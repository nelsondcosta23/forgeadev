
import fs from 'fs';
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Configuration
const BACKUP_FILE = './forgea-backup-2026-04-11.json';
const PB_URL = 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || '';
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || '';

const pb = new PocketBase(PB_URL);

async function migrate() {
  try {
    console.log('🚀 Iniciando migração de dados...');
    
    // 1. Authenticate
    console.log(`🔐 Autenticando no PocketBase como ${PB_ADMIN_EMAIL}...`);
    try {
      await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
      console.log('✅ Autenticado com sucesso!');
    } catch (e) {
      console.error('❌ Falha na autenticação:', e.message);
      console.log('Dica: Verifique se o superuser foi criado usando "pocketbase superuser create".');
      return;
    }

    // 2. Read Backup
    console.log('📖 Lendo ficheiro de backup...');
    const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    
    // 3. Helper for batch processing
    const processBatch = async (items, collectionName, mapper) => {
      console.log(`📦 Processando ${items.length} itens para a coleção "${collectionName}"...`);
      let success = 0;
      let skipped = 0;
      
      for (const item of items) {
        try {
          const pbData = mapper(item);
          await pb.collection(collectionName).create(pbData);
          success++;
        } catch (e) {
          // If record exists (duplicate session_id), we might skip it
          if (e.message.includes('unique constraint')) {
            skipped++;
          } else {
            console.warn(`⚠️ Erro ao criar item em ${collectionName}:`, e.message);
          }
        }
      }
      console.log(`✅ ${collectionName}: ${success} criados, ${skipped} ignorados.`);
    };

    // --- MIGRATION STEPS ---

    // A. Roadmap
    if (backupData.admin_roadmap) {
      await processBatch(backupData.admin_roadmap.rows, 'admin_roadmap', (row) => ({
        title: row.title,
        description: row.description,
        status: row.status || 'planned',
        priority: row.priority || 'medium',
        order: row.order || 0,
      }));
    }

    // B. Prompts
    if (backupData.admin_prompts) {
      await processBatch(backupData.admin_prompts.rows, 'admin_prompts', (row) => ({
        name: row.name || 'Default',
        prompt_text: row.prompt_text,
        is_active: row.is_active ?? true,
      }));
    }

    // C. Store Links (CRM)
    if (backupData.country_store_links) {
      await processBatch(backupData.country_store_links.rows, 'country_store_links', (row) => ({
        country_code: row.country_code,
        country_name: row.country_name,
        store_name: row.store_name,
        store_url: row.store_url,
        status: row.status ?? true,
      }));
    }

    // D. Analytics
    if (backupData.analytics_events) {
      // Small sample to avoid massive wait, or process all if needed
      const events = backupData.analytics_events.rows.slice(0, 500); 
      await processBatch(events, 'analytics_events', (row) => ({
        event_type: row.event_type,
        page_path: row.page_path,
        session_id: row.session_id,
        country_code: row.country_code,
        language: row.language,
        metadata: row.metadata ? JSON.stringify(row.metadata) : '{}'
      }));
    }

    // E. SESSIONS & RESPONSES (Complex mapping)
    console.log('🔄 Reconstruindo respostas do Quiz...');
    const responsesMap = {};
    if (backupData.quiz_responses) {
      backupData.quiz_responses.rows.forEach(r => {
        if (!responsesMap[r.session_id]) responsesMap[r.session_id] = {};
        // Map question_number to a generic key if we don't have IDs
        // Usually its purpose, budget, etc.
        const qKey = r.question_text.toLowerCase().includes('budget') ? 'budget' : 
                     r.question_text.toLowerCase().includes('purpose') ? 'purpose' :
                     `q_${r.question_number}`;
        responsesMap[r.session_id][qKey] = r.selected_answer;
      });
    }

    if (backupData.quiz_sessions) {
      await processBatch(backupData.quiz_sessions.rows, 'quiz_sessions', (row) => ({
        session_id: row.session_id,
        country_code: row.country_code || 'US',
        country_name: row.country_name || 'United States',
        completed: !!row.completed_at,
        completed_at: row.completed_at || null,
        answers: JSON.stringify(responsesMap[row.session_id] || {}),
        created: row.started_at,
      }));
    }

    // F. AI Recommendations
    if (backupData.ai_recommendations) {
      await processBatch(backupData.ai_recommendations.rows, 'ai_recommendations', (row) => ({
        session_id: row.session_id,
        recommendation_text: row.recommendation_text || JSON.stringify(row.ai_report || row.recommendation || {}),
        prompt_used: row.prompt_used || '',
        model_used: row.model_used || 'gemini-1.5-flash',
      }));
    }

    console.log('\n🏁 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('Podes agora ir ao Admin do PocketBase e ver os teus dados.');

  } catch (error) {
    console.error('❌ ERRO CRÍTICO NA MIGRAÇÃO:', error.message);
  }
}

migrate();
