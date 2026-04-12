import PocketBase from 'pocketbase';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const PB_URL = 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || '';
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || '';
const SQL_FILE = './forgea-backup-2026-04-11.sql';

const pb = new PocketBase(PB_URL);

const collections = [
  {
    name: 'quiz_sessions',
    fields: [
      { name: 'session_id', type: 'text', required: true },
      { name: 'country_code', type: 'text' },
      { name: 'country_name', type: 'text' },
      { name: 'completed', type: 'bool' },
      { name: 'completed_at', type: 'date' },
      { name: 'answers', type: 'json' },
    ],
  },
  {
    name: 'quiz_responses',
    fields: [
      { name: 'session_id', type: 'text' },
      { name: 'question_number', type: 'number' },
      { name: 'question_text', type: 'text' },
      { name: 'selected_answer', type: 'text' },
      { name: 'answered_at', type: 'date' },
    ],
  },
  {
    name: 'ai_recommendations',
    fields: [
      { name: 'session_id', type: 'text', required: true },
      { name: 'recommendation_text', type: 'json', required: true },
      { name: 'prompt_used', type: 'text' },
      { name: 'model_used', type: 'text' },
    ],
  },
  {
    name: 'analytics_events',
    fields: [
      { name: 'event_type', type: 'text' },
      { name: 'page_path', type: 'text' },
      { name: 'session_id', type: 'text' },
      { name: 'country_code', type: 'text' },
      { name: 'language', type: 'text' },
      { name: 'metadata', type: 'json' },
    ],
  },
  {
    name: 'analytics_sessions',
    fields: [
      { name: 'session_id', type: 'text' },
      { name: 'started_at', type: 'date' },
      { name: 'ended_at', type: 'date' },
      { name: 'user_agent', type: 'text' },
    ],
  },
  {
    name: 'admin_roadmap',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'priority', type: 'text' },
      { name: 'order', type: 'number' },
    ],
  },
  {
    name: 'admin_prompts',
    fields: [
      { name: 'name', type: 'text' },
      { name: 'prompt_text', type: 'text', required: true },
      { name: 'is_active', type: 'bool' },
    ],
  },
  {
    name: 'country_store_links',
    fields: [
      { name: 'country_code', type: 'text', required: true },
      { name: 'country_name', type: 'text' },
      { name: 'store_name', type: 'text', required: true },
      { name: 'store_url', type: 'text', required: true },
      { name: 'status', type: 'bool' },
    ],
  },
  {
    name: 'tracked_links',
    fields: [
      { name: 'link_id', type: 'text' },
      { name: 'url', type: 'text' },
      { name: 'clicks', type: 'number' },
      { name: 'last_clicked_at', type: 'date' },
    ],
  },
  {
    name: 'credit_transactions',
    fields: [
      { name: 'user_id', type: 'text' },
      { name: 'amount', type: 'number' },
      { name: 'description', type: 'text' },
      { name: 'created_at', type: 'date' },
    ],
  },
  {
    name: 'user_roles',
    fields: [
      { name: 'user_id', type: 'text' },
      { name: 'role', type: 'text' },
    ],
  }
];

async function runMigration() {
  console.log('🚀 Starting Master Migration (Supabase SQL -> PocketBase v0.23+)...');
  
  try {
    // Auth
    await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
    console.log('✅ Authenticated as Superuser');

    // Create Collections
    for (const col of collections) {
      try {
          const existing = await pb.collections.getOne(col.name);
          await pb.collections.delete(existing.id);
          console.log(`🗑️ Removed: ${col.name}`);
      } catch (e) {}
      
      await pb.collections.create({
          name: col.name,
          type: 'base',
          fields: col.fields,
          listRule: "",
          viewRule: "",
          createRule: "",
          updateRule: "",
          deleteRule: ""
      });
      console.log(`🏗️ Created: ${col.name} (${col.fields.length} fields)`);
    }

    console.log('\n🏁 SCHEMA INITIALIZATION COMPLETED!');
  } catch (err) {
    console.error('❌ MIGRATION ERROR:', err.message);
  }
}

runMigration();
