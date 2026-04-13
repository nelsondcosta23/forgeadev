import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8085;
const INTERNAL_KEY = (process.env.INTERNAL_PROXY_KEY || process.env.VITE_INTERNAL_PROXY_KEY || '').trim();
if (!INTERNAL_KEY) {
  console.warn('WARNING: INTERNAL_PROXY_KEY is not defined in .env! API endpoints will be inaccessible.');
} else {
  console.log('INTERNAL_PROXY_KEY loaded successfully (length: ' + INTERNAL_KEY.length + ')');
}
const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';

// Language mapping: country code -> language for AI responses
const countryToLanguage = {
  'PT': 'Portuguese (Portugal)', 'BR': 'Portuguese (Brazil)', 'ES': 'Spanish', 'FR': 'French',
  'DE': 'German', 'IT': 'Italian', 'NL': 'Dutch', 'BE': 'Dutch/French', 'AT': 'German',
  'CH': 'German/French', 'PL': 'Polish', 'SE': 'Swedish', 'NO': 'Norwegian', 'DK': 'Danish',
  'FI': 'Finnish', 'IE': 'English', 'GB': 'English (UK)', 'US': 'English (US)', 'CA': 'English',
  'AU': 'English', 'NZ': 'English', 'MX': 'Spanish', 'AR': 'Spanish', 'CL': 'Spanish',
  'CO': 'Spanish', 'PE': 'Spanish', 'JP': 'Japanese', 'KR': 'Korean', 'CN': 'Chinese',
  'IN': 'English', 'SG': 'English', 'TH': 'Thai', 'MY': 'English', 'ID': 'Indonesian',
  'PH': 'English', 'VN': 'Vietnamese', 'ZA': 'English', 'AE': 'English', 'SA': 'Arabic',
  'IL': 'Hebrew', 'TR': 'Turkish', 'RU': 'Russian', 'UA': 'Ukrainian', 'CZ': 'Czech',
  'GR': 'Greek', 'RO': 'Romanian', 'HU': 'Hungarian', 'OTHER': 'English',
};

// Currency mapping: country code -> currency symbol and code
const countryToCurrency = {
  'PT': { symbol: '€', code: 'EUR' }, 'ES': { symbol: '€', code: 'EUR' },
  'FR': { symbol: '€', code: 'EUR' }, 'DE': { symbol: '€', code: 'EUR' },
  'IT': { symbol: '€', code: 'EUR' }, 'NL': { symbol: '€', code: 'EUR' },
  'BE': { symbol: '€', code: 'EUR' }, 'AT': { symbol: '€', code: 'EUR' },
  'IE': { symbol: '€', code: 'EUR' }, 'FI': { symbol: '€', code: 'EUR' },
  'GR': { symbol: '€', code: 'EUR' }, 'BR': { symbol: 'R$', code: 'BRL' },
  'GB': { symbol: '£', code: 'GBP' }, 'US': { symbol: '$', code: 'USD' },
  'CA': { symbol: 'CA$', code: 'CAD' }, 'AU': { symbol: 'AU$', code: 'AUD' },
  'NZ': { symbol: 'NZ$', code: 'NZD' }, 'MX': { symbol: 'MX$', code: 'MXN' },
  'AR': { symbol: 'AR$', code: 'ARS' }, 'CL': { symbol: 'CL$', code: 'CLP' },
  'CO': { symbol: 'CO$', code: 'COP' }, 'PE': { symbol: 'S/', code: 'PEN' },
  'CH': { symbol: 'CHF', code: 'CHF' }, 'SE': { symbol: 'kr', code: 'SEK' },
  'NO': { symbol: 'kr', code: 'NOK' }, 'DK': { symbol: 'kr', code: 'DKK' },
  'PL': { symbol: 'zł', code: 'PLN' }, 'CZ': { symbol: 'Kč', code: 'CZK' },
  'HU': { symbol: 'Ft', code: 'HUF' }, 'RO': { symbol: 'lei', code: 'RON' },
  'JP': { symbol: '¥', code: 'JPY' }, 'KR': { symbol: '₩', code: 'KRW' },
  'CN': { symbol: '¥', code: 'CNY' }, 'IN': { symbol: '₹', code: 'INR' },
  'SG': { symbol: 'S$', code: 'SGD' }, 'TH': { symbol: '฿', code: 'THB' },
  'MY': { symbol: 'RM', code: 'MYR' }, 'ID': { symbol: 'Rp', code: 'IDR' },
  'PH': { symbol: '₱', code: 'PHP' }, 'VN': { symbol: '₫', code: 'VND' },
  'ZA': { symbol: 'R', code: 'ZAR' }, 'AE': { symbol: 'AED', code: 'AED' },
  'SA': { symbol: 'SAR', code: 'SAR' }, 'IL': { symbol: '₪', code: 'ILS' },
  'TR': { symbol: '₺', code: 'TRY' }, 'RU': { symbol: '₽', code: 'RUB' },
  'UA': { symbol: '₴', code: 'UAH' }, 'OTHER': { symbol: '$', code: 'USD' },
};

// Middleware
app.use(cors());
app.use(express.json());

// Initialize PocketBase
const pb = new PocketBase(PB_URL);

// Admin credentials (from .env)
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.warn('WARNING: PocketBase admin credentials missing in .env');
}

// Keep track of auth status
let isPbAuthenticated = false;

const authenticatePb = async () => {
  // Bypassing auth because collections are public (null rules)
  isPbAuthenticated = true;
};

// Middleware to ensure PB auth before each request
const ensurePbAuth = async (req, res, next) => {
  // No-op middleware since we are public
  next();
};

// Authenticate via internal key middleware
const authenticateProxy = (req, res, next) => {
  const key = (req.headers['x-internal-key'] || '').trim();
  if (!key || key !== INTERNAL_KEY) {
    console.error(`[Auth Error] Expected key: ${INTERNAL_KEY ? '***' + INTERNAL_KEY.slice(-4) : 'undefined'}, Received: ${key ? '***' + key.slice(-4) : 'empty'}`);
    return res.status(401).json({ error: 'Unauthorized: Invalid internal proxy key' });
  }
  next();
};

// --- API ENDPOINTS ---

// Example Admin Auth endpoint
app.post('/api/admin/login', authenticateProxy, async (req, res) => {
  try {
    const { email, password } = req.body;
    // Note: Pocketbase uses "auth-with-password" on admin or collections
    const authData = await pb.collection('users').authWithPassword(email, password);
    res.json(authData);
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials', details: error.message });
  }
});

// Analytics tracking endpoint
app.post('/api/analytics/track', authenticateProxy, ensurePbAuth, async (req, res) => {
  try {
    const event = req.body;
    const record = await pb.collection('analytics_events').create(event);
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record analytics', details: error.message });
  }
});

// Quiz analysis endpoint
app.post('/api/quiz/analyze', authenticateProxy, ensurePbAuth, async (req, res) => {
  try {
    const { answers, questions, sessionId } = req.body;
    
    console.log('Received request for session:', sessionId);
    
    if (!answers || !questions || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Validate session exists
    let session;
    try {
      session = await pb.collection('quiz_sessions').getFirstListItem(`session_id="${sessionId}"`);
    } catch (e) {
      console.error('Invalid session or not found:', sessionId);
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    // 2. Fetch the latest prompt
    let customPrompt = '';
    try {
      const promptRecord = await pb.collection('admin_prompts').getFirstListItem('', { sort: '-created' });
      customPrompt = promptRecord.prompt_text || '';
    } catch (e) {
      console.log('No custom prompt found, using default');
    }

    const sanitizedPrompt = customPrompt
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .trim()
      .substring(0, 5000);

    // 3. Resolve localization
    const userCountryCode = answers.country || 'US';
    const userLanguage = countryToLanguage[userCountryCode] || 'English';
    const userCurrency = countryToCurrency[userCountryCode] || { symbol: '$', code: 'USD' };

    // 4. Fetch store links
    let storeInstructions = '';
    let countryStoreUrls = 'Amazon.com: https://www.amazon.com';
    try {
      const storeLinks = await pb.collection('country_store_links').getFullList({
        filter: `country_code="${userCountryCode}" && status=true`
      });

      if (storeLinks && storeLinks.length > 0) {
        countryStoreUrls = storeLinks.map(s => `${s.store_name}: ${s.store_url}`).join('\n');
        const storeList = storeLinks.map(s => `  - ${s.store_name}: ${s.store_url}`).join('\n');
        storeInstructions = `RECOMMENDED STORES for ${userCountryCode}:\n${storeList}\n\nCRITICAL: When suggesting where to buy components, you MUST ONLY recommend these stores.`;
      } else {
        storeInstructions = `NO SPECIFIC STORES AVAILABLE for ${userCountryCode}. FALLBACK: Recommend Amazon.com.`;
      }
    } catch (e) {
      console.error('Error fetching store links:', e.message);
    }

    // 5. Interpolate placeholders
    const fillPromptPlaceholders = (prompt, answers) => {
      const placeholderMap = {
        country: String(answers.country || 'N/A'),
        use: String(answers.purpose || 'N/A'),
        genres_or_workloads: answers.purpose === 'gaming' ? String(answers.games || 'N/A') : String(answers.purpose || 'N/A'),
        resolution: String(answers.resolution || 'N/A'),
        fps_or_metric_target: String(answers.fps || 'N/A'),
        streaming: String(answers.streaming || 'no'),
        budget_usd: String(answers.budget || 'N/A'),
        form_factor: String(answers.casePreference || 'N/A'),
        peripherals: String(answers.peripherals || 'none'),
        upgrades: String(answers.upgradability || 'no'),
        upgrade_horizon: '12–24 meses',
      };
      
      let filled = prompt.replace(/\{\{(\w+)\}\}/g, (_, key) => placeholderMap[key] || `{{${key}}}`);
      return filled.replace(/\(user_country\)/g, countryStoreUrls);
    };

    let filledPrompt = sanitizedPrompt ? fillPromptPlaceholders(sanitizedPrompt, answers) : '';

    const systemPrompt = filledPrompt || `You are an expert PC building advisor... (Fallback System Prompt)`;
    const userPrompt = `Based on these quiz responses, provide comprehensive PC build recommendations:\n\n${JSON.stringify(questions.map(q => ({ question: q.question, answer: answers[q.id] })), null, 2)}`;

    // 6. Call Gemini AI via official SDK
    console.log('Sending request to Gemini AI (SDK)...');
    const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY is missing or empty');
    
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            ai_report: {
              type: "object",
              properties: {
                budget_range: { type: "string" },
                primary_use: { type: "string" },
                performance_level: { type: "string" },
                upgrade_priority: { type: "string" }
              },
              required: ["budget_range", "primary_use", "performance_level", "upgrade_priority"]
            },
            builds: {
              type: "object",
              properties: {
                "Best Value": { type: "object", properties: { processor: { type: "string" }, graphics_card: { type: "string" }, ram: { type: "string" }, storage: { type: "string" }, power_supply: { type: "string" }, motherboard: { type: "string" }, case: { type: "string" }, cooler: { type: "string" }, estimated_price_range: { type: "string" }, performance_tier: { type: "string" } }, required: ["processor", "graphics_card", "ram", "storage", "estimated_price_range"] },
                "Balanced": { type: "object", properties: { processor: { type: "string" }, graphics_card: { type: "string" }, ram: { type: "string" }, storage: { type: "string" }, power_supply: { type: "string" }, motherboard: { type: "string" }, case: { type: "string" }, cooler: { type: "string" }, estimated_price_range: { type: "string" }, performance_tier: { type: "string" } }, required: ["processor", "graphics_card", "ram", "storage", "estimated_price_range"] },
                "High Performance": { type: "object", properties: { processor: { type: "string" }, graphics_card: { type: "string" }, ram: { type: "string" }, storage: { type: "string" }, power_supply: { type: "string" }, motherboard: { type: "string" }, case: { type: "string" }, cooler: { type: "string" }, estimated_price_range: { type: "string" }, performance_tier: { type: "string" } }, required: ["processor", "graphics_card", "ram", "storage", "estimated_price_range"] }
              },
              required: ["Best Value", "Balanced", "High Performance"]
            },
            recommendation: { type: "string" }
          },
          required: ["ai_report", "builds", "recommendation"]
        }
      }
    });

    const jsonSchemaInstructions = `
CRITICAL: Your response MUST BE A VALID JSON OBJECT.
Use ${userLanguage} for the recommendation field.
`;

    const finalSystemPrompt = `${systemPrompt}\n\n${jsonSchemaInstructions}`;

    const result = await model.generateContent([
      { text: finalSystemPrompt },
      { text: userPrompt }
    ]);

    const resultResponse = await result.response;
    let resultText = resultResponse.text();
    
    if (!resultText) throw new Error('AI failed to generate a response');

    // Robust JSON parsing
    let functionArgs;
    try {
      functionArgs = JSON.parse(resultText);
    } catch (e) {
      console.error('JSON Parse Failed. Raw text:', resultText);
      res.status(500).json({ error: 'Failed to analyze quiz', details: 'AI returned invalid JSON format' });
      return; 
    }
    
    // Map response to the structure expected by the frontend
    const fullStructuredResponse = {
      session_info: {
        session_id: sessionId,
        completed_at: new Date().toISOString(),
        recommendation: functionArgs.recommendation,
        ai_report: functionArgs.ai_report,
        metadata: { model_used: 'gemini-2.5-flash' }
      },
      recommendations: functionArgs.builds,
      explanation: functionArgs.recommendation,
      recommendation: functionArgs.recommendation // Root redundancy
    };

    console.log(`[DEBUG] Finalizing analysis for ${sessionId}. Recommendation length: ${fullStructuredResponse.explanation?.length || 0}`);

    // 7. Persist to PocketBase
    await pb.collection('ai_recommendations').create({
      session_id: sessionId,
      recommendation_text: JSON.stringify(fullStructuredResponse),
      prompt_used: systemPrompt,
      model_used: 'gemini-2.5-flash',
    });

    // Mark session as completed and store answers
    try {
      await pb.collection('quiz_sessions').update(session.id, { 
        completed: true, 
        completed_at: new Date().toISOString(),
        answers: JSON.stringify(answers) 
      });
    } catch (e) {
      console.warn('Failed to update session completion status:', e.message);
    }

    console.log(`[DEBUG] Sending response for session ${sessionId}`);
    res.json(fullStructuredResponse);
  } catch (error) {
    console.error('Quiz analysis failed:', error.message);
    res.status(500).json({ error: 'Failed to analyze quiz', details: error.message });
  }
});

// Public endpoint for shared results
app.get('/api/results/:sessionId', ensurePbAuth, async (req, res) => {
  const { sessionId } = req.params;
  console.log(`[DEBUG] Fetching results to display for ${sessionId}`);
  try {
    const quizSession = await pb.collection('quiz_sessions').getFirstListItem(`session_id="${sessionId}"`);
    
    let recommendation = null;
    try {
      const aiRecommendation = await pb.collection('ai_recommendations').getFirstListItem(`session_id="${sessionId}"`);
      recommendation = JSON.parse(aiRecommendation.recommendation_text);
      console.log(`[DEBUG] Found recommendation in DB for ${sessionId}`);
    } catch (e) {
      console.log(`[DEBUG] No recommendation found in DB for session ${sessionId}:`, e.message);
    }
    
    res.json({
      recommendation: recommendation,
      answers: typeof quizSession.answers === 'string' ? JSON.parse(quizSession.answers) : quizSession.answers
    });
  } catch (error) {
    console.error(`[DEBUG] Error for ${sessionId}:`, error.message);
    res.status(404).json({ error: 'Results not found', details: error.message });
  }
});

// Generic forwarder to PocketBase for CRM/Roadmap (BFF approach)
app.use('/api/pb/:collection', authenticateProxy, ensurePbAuth, async (req, res) => {
  const { collection } = req.params;
  try {
    if (req.method === 'GET') {
      // Only apply sort if explicitly provided in the query params
      const options = {};
      if (req.query.sort) {
        options.sort = req.query.sort;
      }
      
      const records = await pb.collection(collection).getFullList(options);
      const serializedRecords = records.map(record => {
        // Explicitly extract system fields if they exist
        const plain = { ...record }; 
        return {
          ...plain,
          created: record.created || null,
          updated: record.updated || null,
          id: record.id
        };
      });
      return res.json(serializedRecords);
    } else if (req.method === 'POST') {
      const record = await pb.collection(collection).create(req.body);
      const plain = JSON.parse(JSON.stringify(record));
      return res.json({
        ...plain,
        created: record.created,
        updated: record.updated,
        id: record.id
      });
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      // Expecting ID in query or body
      const id = req.query.id || req.body.id;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const record = await pb.collection(collection).update(id, req.body);
      return res.json(record);
    } else if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const success = await pb.collection(collection).delete(id);
      return res.json({ success });
    }
  } catch (error) {
    console.error(`PB Operation failed for collection ${collection}:`, error.message);
    res.status(500).json({ error: 'PB Operation failed', details: error.message });
  }
});

// --- SERVE STATIC FRONTEND ---
// Serve Vite dist directly if existing
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Spa fallback
app.get('*path', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`PocketBase connected at ${PB_URL}`);
});
