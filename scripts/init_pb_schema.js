
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const PB_URL = 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || '';
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || '';

const pb = new PocketBase(PB_URL);

async function initSchema() {
  try {
    console.log('🏗️ Iniciando configuração do esquema PocketBase...');
    
    await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
    console.log('✅ Autenticado como Admin.');

    const collections = [
      {
        name: 'quiz_sessions',
        type: 'base',
        schema: [
          { name: 'session_id', type: 'text', required: true, unique: true },
          { name: 'country_code', type: 'text' },
          { name: 'country_name', type: 'text' },
          { name: 'completed', type: 'bool' },
          { name: 'completed_at', type: 'date' },
          { name: 'answers', type: 'json' },
        ],
      },
      {
        name: 'ai_recommendations',
        type: 'base',
        schema: [
          { name: 'session_id', type: 'text', required: true, unique: true },
          { name: 'recommendation_text', type: 'json', required: true }, // Changed to JSON as our BFF sends JSON
          { name: 'prompt_used', type: 'text' },
          { name: 'model_used', type: 'text' },
        ],
      },
      {
        name: 'analytics_events',
        type: 'base',
        schema: [
          { name: 'event_type', type: 'text' },
          { name: 'page_path', type: 'text' },
          { name: 'session_id', type: 'text' },
          { name: 'country_code', type: 'text' },
          { name: 'language', type: 'text' },
          { name: 'metadata', type: 'json' },
        ],
      },
      {
        name: 'admin_roadmap',
        type: 'base',
        schema: [
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'text' },
          { name: 'status', type: 'select', options: { values: ['planned', 'in-progress', 'completed'] } },
          { name: 'priority', type: 'select', options: { values: ['low', 'medium', 'high'] } },
          { name: 'order', type: 'number' },
        ],
      },
      {
        name: 'admin_prompts',
        type: 'base',
        schema: [
          { name: 'name', type: 'text' },
          { name: 'prompt_text', type: 'text', required: true },
          { name: 'is_active', type: 'bool' },
        ],
      },
      {
        name: 'country_store_links',
        type: 'base',
        schema: [
          { name: 'country_code', type: 'text', required: true },
          { name: 'country_name', type: 'text' },
          { name: 'store_name', type: 'text', required: true },
          { name: 'store_url', type: 'text', required: true },
          { name: 'status', type: 'bool' },
        ],
      }
    ];

    for (const config of collections) {
      try {
        console.log(`Creating collection: ${config.name}...`);
        await pb.collections.create(config);
        console.log(`✅ Collection ${config.name} created!`);
      } catch (e) {
        if (e.message.includes('must be unique')) {
          console.log(`ℹ️ Collection ${config.name} already exists, skipping.`);
        } else {
          console.error(`❌ Error creating ${config.name}:`, e.message);
        }
      }
    }

    console.log('\n✨ ESQUEMA CONFIGURADO COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ ERRO AO CONFIGURAR ESQUEMA:', error.message);
  }
}

initSchema();
