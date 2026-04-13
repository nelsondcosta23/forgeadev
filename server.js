import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';

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

    // 6. Call Gemini AI
    console.log('Sending request to Gemini AI (v1beta)...');
    const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY is missing or empty');
    
    // Explicitly request JSON format in the prompt if not already there
    const jsonSchemaInstructions = `
CRITICAL: Your response MUST BE A VALID JSON OBJECT conforming to this structure:
{
  "ai_report": {
    "budget_range": "...",
    "primary_use": "...",
    "performance_level": "...",
    "upgrade_priority": "..."
  },
  "builds": {
    "Best Value": { "processor": "...", "graphics_card": "...", "ram": "...", "storage": "...", "power_supply": "...", "motherboard": "...", "case": "...", "cooler": "...", "estimated_price_range": "...", "performance_tier": "..." },
    "Balanced": { ... },
    "High Performance": { ... }
  },
  "recommendation": "A detailed explanation in ${userLanguage}..."
}
`;

    const finalSystemPrompt = `${systemPrompt}\n\n${jsonSchemaInstructions}`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: finalSystemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          response_mime_type: 'application/json'
        }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Gemini API Error:', errorText);
      throw new Error(`AI Gateway Error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let resultText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) throw new Error('AI failed to generate a response');

    // Robust JSON parsing
    let functionArgs;
    try {
      // Clean up any potential markdown junk and parse
      let cleanedJson = resultText.trim();
      
      // Handle ```json ... ``` or just ``` ... ```
      if (cleanedJson.includes('```')) {
        const parts = cleanedJson.split('```');
        // Find the part that looks like JSON (usually after the first ``` or inside the markers)
        for (const part of parts) {
          const possible = part.replace(/^json/, '').trim();
          if (possible.startsWith('{') && possible.endsWith('}')) {
            cleanedJson = possible;
            break;
          }
        }
      }
      
      functionArgs = JSON.parse(cleanedJson);
    } catch (e) {
      console.error('JSON Parse Failed.');
      console.error('Raw text:', resultText);
      res.status(500).json({ error: 'Failed to analyze quiz', details: 'AI returned invalid JSON format' });
      return; // Stop execution
    }
    
    // Map response to the structure expected by the frontend
    const fullStructuredResponse = {
      session_info: {
        session_id: sessionId,
        completed_at: new Date().toISOString(),
        recommendation: functionArgs.recommendation || functionArgs.explanation, // Try both names
        ai_report: functionArgs.ai_report || {
          budget_range: String(answers.budget || 'N/A'),
          primary_use: String(answers.purpose || 'N/A'),
          performance_level: 'Standard',
          upgrade_priority: answers.upgradability === 'yes' ? 'High' : 'Low'
        },
        metadata: { model_used: 'gemini-1.5-flash' }
      },
      recommendations: functionArgs.builds || functionArgs.recommendations,
      explanation: functionArgs.recommendation || functionArgs.explanation // Fallback for legacy
    };

    // 7. Persist to PocketBase
    await pb.collection('ai_recommendations').create({
      session_id: sessionId,
      recommendation_text: JSON.stringify(fullStructuredResponse),
      prompt_used: systemPrompt,
      model_used: 'gemini-1.5-flash',
    });

    // Mark session as completed and store answers
    try {
      await pb.collection('quiz_sessions').update(session.id, { 
        completed: true, 
        completed_at: new Date().toISOString(),
        answers: JSON.stringify(answers) // Store the full answers object
      });
    } catch (e) {
      console.warn('Failed to update session completion status:', e.message);
    }

    res.json(fullStructuredResponse);
  } catch (error) {
    console.error('Quiz analysis failed:', error.message);
    res.status(500).json({ error: 'Failed to analyze quiz', details: error.message });
  }
});

// Public endpoint for shared results
app.get('/api/results/:sessionId', ensurePbAuth, async (req, res) => {
  const { sessionId } = req.params;
  try {
    // 1. Get the session first
    const quizSession = await pb.collection('quiz_sessions').getFirstListItem(`session_id="${sessionId}"`);
    
    // 2. Try to get the recommendation, but don't fail if missing
    let recommendation = null;
    try {
      const aiRecommendation = await pb.collection('ai_recommendations').getFirstListItem(`session_id="${sessionId}"`);
      recommendation = JSON.parse(aiRecommendation.recommendation_text);
    } catch (e) {
      console.log(`No active recommendation found for session ${sessionId}`);
    }
    
    res.json({
      recommendation: recommendation,
      answers: typeof quizSession.answers === 'string' ? JSON.parse(quizSession.answers) : quizSession.answers
    });
  } catch (error) {
    console.error(`Error fetching results for session ${sessionId}:`, error.message);
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
