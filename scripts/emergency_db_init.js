
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

// Try internal Docker URL first, then public FQDN as fallback
const PB_URL = process.env.POCKETBASE_URL || 'http://pb:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

console.log(`Connecting to PocketBase at: ${PB_URL}`);

const pb = new PocketBase(PB_URL);

async function run() {
  try {
    // 1. Auth as Admin
    await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
    console.log('✅ Authenticated as Admin');

    // 2. Define Essential Collections
    const collections = [
      {
        name: 'languages',
        type: 'base',
        schema: [
          { name: 'code', type: 'text', required: true, unique: true },
          { name: 'name', type: 'text', required: true },
          { name: 'flag', type: 'text' },
          { name: 'is_active', type: 'bool' },
        ],
        listRule: "", // Public
        viewRule: "", // Public
      },
      {
        name: 'quiz_sessions',
        type: 'base',
        schema: [
          { name: 'session_id', type: 'text', required: true, unique: true },
          { name: 'country_code', type: 'text' },
          { name: 'country_name', type: 'text' },
          { name: 'completed', type: 'bool' },
          { name: 'answers', type: 'json' },
        ],
        listRule: "@request.auth.id != ''", // Admin or Logged
        createRule: "", // Public can create sessions
      },
      {
        name: 'ai_recommendations',
        type: 'base',
        schema: [
          { name: 'session_id', type: 'text', required: true, unique: true },
          { name: 'recommendation_text', type: 'json', required: true },
          { name: 'model_used', type: 'text' },
        ],
        viewRule: "", // Public can see results if they have the ID
      },
      {
        name: 'admin_prompts',
        type: 'base',
        schema: [
          { name: 'name', type: 'text' },
          { name: 'prompt_text', type: 'text', required: true },
          { name: 'is_active', type: 'bool' },
        ],
        listRule: "", // Public needs to read prompts for AI
      }
    ];

    // 3. Create or Update Collections
    for (const col of collections) {
      try {
        console.log(`Processing: ${col.name}...`);
        await pb.collections.create(col);
        console.log(`✨ Created ${col.name}`);
      } catch (e) {
        console.log(`ℹ️  ${col.name} already exists or skipped: ${e.message}`);
        // Attempt update permissions if already exists
        try {
          const existing = await pb.collections.getOne(col.name);
          await pb.collections.update(existing.id, {
            listRule: col.listRule,
            viewRule: col.viewRule,
            createRule: col.createRule,
          });
          console.log(`✅ Updated permissions for ${col.name}`);
        } catch (updateErr) {
            console.warn(`Could not update ${col.name}: ${updateErr.message}`);
        }
      }
    }

    // 4. Seed basic languages if empty
    try {
      const existingLangs = await pb.collection('languages').getList(1, 1);
      if (existingLangs.totalItems === 0) {
        console.log('🌱 Seeding basic languages...');
        const baseLangs = [
          { code: 'pt-PT', name: 'Português', flag: '🇵🇹', is_active: true },
          { code: 'en-US', name: 'English', flag: '🇺🇸', is_active: true }
        ];
        for (const l of baseLangs) {
          await pb.collection('languages').create(l);
        }
        console.log('✅ Base languages seeded!');
      }
    } catch (e) {
      console.warn('Could not seed languages:', e.message);
    }

    console.log('\n🏁 EMERGENCY INITIALIZATION COMPLETE!');
    process.exit(0);

  } catch (err) {
    console.error('❌ CRITICAL ERROR:', err.message);
    process.exit(1);
  }
}

run();
