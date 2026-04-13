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
  console.error('ERROR: INTERNAL_PROXY_KEY missing. API will be inaccessible.');
  process.exit(1);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY missing. AI features will fail.');
  process.exit(1);
}

console.log(`Server environment validated. Internal key length: ${INTERNAL_KEY.length}`);

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

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

app.use(cors());
app.use(express.json());

const ensurePbAuth = async (req, res, next) => next();

const authenticateProxy = (req, res, next) => {
  const key = (req.headers['x-internal-key'] || '').trim();
  if (!key || key !== INTERNAL_KEY) {
    console.error(`Unauthorized access attempt. Received: ${key.slice(-4) || 'none'}`);
    return res.status(401).json({ error: 'Invalid internal proxy key' });
  }
  next();
};

app.post('/api/admin/login', authenticateProxy, async (req, res) => {
  try {
    const { email, password } = req.body;
    const authData = await pb.collection('users').authWithPassword(email, password);
    res.json(authData);
  } catch (error) {
    res.status(401).json({ error: 'Auth failed', details: error.message });
  }
});

app.post('/api/analytics/track', authenticateProxy, ensurePbAuth, async (req, res) => {
  try {
    const record = await pb.collection('analytics_events').create(req.body);
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ error: 'Analytics failure', details: error.message });
  }
});

app.post('/api/quiz/analyze', authenticateProxy, ensurePbAuth, async (req, res) => {
  try {
    const { answers, questions, sessionId } = req.body;
    
    if (!answers || !questions || !sessionId) {
      return res.status(400).json({ error: 'Payload incomplete' });
    }

    const session = await pb.collection('quiz_sessions').getFirstListItem(`session_id="${sessionId}"`);

    let customPrompt = '';
    try {
      const promptRecord = await pb.collection('admin_prompts').getFirstListItem('', { sort: '-created' });
      customPrompt = promptRecord.prompt_text || '';
    } catch (e) {
      console.log('Using default system prompt');
    }

    const sanitizedPrompt = customPrompt.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();

    const countryCode = answers.country || 'US';
    const language = countryToLanguage[countryCode] || 'English';

    let storeInstructions = '';
    let storeUrls = 'Amazon.com: https://www.amazon.com';
    try {
      const links = await pb.collection('country_store_links').getFullList({
        filter: `country_code="${countryCode}" && status=true`
      });

      if (links?.length) {
        storeUrls = links.map(s => `${s.store_name}: ${s.store_url}`).join('\n');
        storeInstructions = `STORES: ${links.map(s => s.store_name).join(', ')}`;
      }
    } catch (e) {
      console.warn('Store link resolution failed');
    }

    const fillPrompt = (p, a) => {
      const map = {
        country: String(a.country || 'N/A'),
        use: String(a.purpose || 'N/A'),
        budget_usd: String(a.budget || 'N/A'),
        resolution: String(a.resolution || 'N/A'),
        peripherals: String(a.peripherals || 'none'),
      };
      return p.replace(/\{\{(\w+)\}\}/g, (_, k) => map[k] || `{{${k}}}`).replace(/\(user_country\)/g, storeUrls);
    };

    const prompt = sanitizedPrompt ? fillPrompt(sanitizedPrompt, answers) : 'Fallback prompt...';
    const userPrompt = `Analysis Request:\n${JSON.stringify(questions.map(q => ({ q: q.question, a: answers[q.id] })))}`;

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (!geminiKey) throw new Error('GEMINI_API_KEY missing');
    
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            ai_report: { type: "object", properties: { budget_range: { type: "string" }, primary_use: { type: "string" }, performance_level: { type: "string" }, upgrade_priority: { type: "string" } }, required: ["budget_range", "primary_use", "performance_level", "upgrade_priority"] },
            builds: {
              type: "object",
              properties: {
                "Best Value": { type: "object", properties: { processor: { type: "object", properties: { model: { type: "string" }, recommended_price: { type: "string" }, where_to_buy: { type: "array", items: { type: "string" } } }, required: ["model", "recommended_price", "where_to_buy"] }, graphics_card: { type: "object", properties: { model: { type: "string" } }, required: ["model"] }, estimated_price_range: { type: "string" }, performance_tier: { type: "string" } }, required: ["processor", "graphics_card", "estimated_price_range"] },
                "Balanced": { type: "object", properties: { processor: { type: "object", properties: { model: { type: "string" } }, required: ["model"] }, graphics_card: { type: "object", properties: { model: { type: "string" } }, required: ["model"] }, estimated_price_range: { type: "string" }, performance_tier: { type: "string" } }, required: ["processor", "graphics_card", "estimated_price_range"] },
                "High Performance": { type: "object", properties: { processor: { type: "object", properties: { model: { type: "string" } }, required: ["model"] }, graphics_card: { type: "object", properties: { model: { type: "string" } }, required: ["model"] }, estimated_price_range: { type: "string" }, performance_tier: { type: "string" } }, required: ["processor", "graphics_card", "estimated_price_range"] }
              },
              required: ["Best Value", "Balanced", "High Performance"]
            },
            recommendation: { type: "string" }
          },
          required: ["ai_report", "builds", "recommendation"]
        }
      }
    });

    const result = await model.generateContent([{ text: `${prompt}\nRespond in ${language}.` }, { text: userPrompt }]);
    const response = await result.response;
    const args = JSON.parse(response.text());
    
    const resultObj = {
      session_info: { session_id: sessionId, completed_at: new Date().toISOString(), recommendation: args.recommendation, ai_report: args.ai_report, metadata: { model: 'gemini-2.5-flash' } },
      recommendations: args.builds,
      explanation: args.recommendation,
      recommendation: args.recommendation
    };

    await pb.collection('ai_recommendations').create({ session_id: sessionId, recommendation_text: JSON.stringify(resultObj), model_used: 'gemini-2.5-flash' });

    try {
      await pb.collection('quiz_sessions').update(session.id, { completed: true, completed_at: new Date().toISOString(), answers: JSON.stringify(answers) });
    } catch (e) {
      console.warn('Post-analysis session update failed');
    }

    res.json(resultObj);
  } catch (error) {
    console.error('Core Analysis Failure:', error.message);
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

app.get('/api/results/:sessionId', ensurePbAuth, async (req, res) => {
  const { sessionId } = req.params;
  try {
    const quizSession = await pb.collection('quiz_sessions').getFirstListItem(`session_id="${sessionId}"`);
    let recommendation = null;
    try {
      const aiRec = await pb.collection('ai_recommendations').getFirstListItem(`session_id="${sessionId}"`);
      const rawText = aiRec.recommendation_text;
      recommendation = typeof rawText === 'string' ? JSON.parse(rawText) : rawText;
    } catch (e) {
      console.log(`Recommendation record not found for ${sessionId}`);
    }
    
    res.json({
      recommendation,
      answers: typeof quizSession.answers === 'string' ? JSON.parse(quizSession.answers) : quizSession.answers
    });
  } catch (error) {
    res.status(404).json({ error: 'Results unavailable' });
  }
});

app.use('/api/pb/:collection', authenticateProxy, ensurePbAuth, async (req, res) => {
  const { collection } = req.params;
  try {
    if (req.method === 'GET') {
      const records = await pb.collection(collection).getFullList(req.query.sort ? { sort: req.query.sort } : {});
      return res.json(records.map(r => ({ ...r, created: r.created, updated: r.updated, id: r.id })));
    } else if (req.method === 'POST') {
      const record = await pb.collection(collection).create(req.body);
      return res.json({ ...record, id: record.id });
    } else if (req.method === 'PATCH') {
      const id = req.query.id || req.body.id;
      if (!id) return res.status(400).json({ error: 'ID required' });
      return res.json(await pb.collection(collection).update(id, req.body));
    } else if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'ID required' });
      return res.json({ success: await pb.collection(collection).delete(id) });
    }
  } catch (error) {
    res.status(500).json({ error: 'Proxy operation failed' });
  }
});

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

app.listen(PORT, () => console.log(`BFF listening on ${PORT}`));
