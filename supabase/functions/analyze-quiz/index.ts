import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Language mapping: country code -> language for AI responses
  const countryToLanguage: { [key: string]: string } = {
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
  const countryToCurrency: { [key: string]: { symbol: string; code: string } } = {
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

  try {
    const { answers, questions, sessionId } = await req.json();
    
    console.log('Received request for session:', sessionId);
    
    if (!answers || !questions || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate session exists and hasn't been analyzed already
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('id, completed_at')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      console.error('Invalid session:', sessionId);
      return new Response(
        JSON.stringify({ error: 'Invalid session ID' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if session has already been analyzed
    const { data: existingRecommendation } = await supabase
      .from('ai_recommendations')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existingRecommendation) {
      console.log('Session already analyzed:', sessionId);
      return new Response(
        JSON.stringify({ error: 'Session already analyzed' }),
        { status: 409, headers: corsHeaders }
      );
    }

    // Fetch the latest prompt
    const { data: promptData, error: promptError } = await supabase
      .from('admin_prompts')
      .select('prompt_text')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (promptError) {
      console.error('Error fetching prompt:', promptError);
    }

    const customPrompt = promptData?.prompt_text || '';
    
    // Sanitize and truncate custom prompt
    const sanitizedPrompt = customPrompt
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .trim()
      .substring(0, 4000); // Max 4000 chars
    
    console.log('Custom prompt length:', sanitizedPrompt.length);

    // Extract user's country from answers
    const userCountryCode = answers.country || 'US';
    const userLanguage = countryToLanguage[userCountryCode] || 'English';
    const userCurrency = countryToCurrency[userCountryCode] || { symbol: '$', code: 'USD' };

    console.log('User location info:', { 
      country: userCountryCode, 
      language: userLanguage, 
      currency: userCurrency 
    });

    // Fetch store links for the user's country from database
    const { data: storeLinks, error: storeError } = await supabase
      .from('country_store_links')
      .select('store_name, store_url')
      .eq('country_code', userCountryCode)
      .eq('status', true);

    if (storeError) {
      console.error('Error fetching store links:', storeError);
    }

    // Build store URLs list for (user_country) tag replacement
    let countryStoreUrls = '';
    if (storeLinks && storeLinks.length > 0) {
      countryStoreUrls = storeLinks
        .map(store => `${store.store_name}: ${store.store_url}`)
        .join('\n');
      console.log('Found', storeLinks.length, 'stores for', userCountryCode);
    } else {
      countryStoreUrls = 'Amazon.com: https://www.amazon.com';
      console.log('No stores found for', userCountryCode, '- using Amazon.com fallback');
    }

    // Build store recommendations based on what we found
    let storeInstructions = '';
    if (storeLinks && storeLinks.length > 0) {
      const storeList = storeLinks
        .map(store => `  - ${store.store_name}: ${store.store_url}`)
        .join('\n');
      
      storeInstructions = `
RECOMMENDED STORES for ${userCountryCode}:
${storeList}

CRITICAL: When suggesting where to buy components, you MUST ONLY recommend these stores.
For each component, specify which store to check and what to search for.
Example: "Search for 'RTX 4060' at ${storeLinks[0].store_name}"`;
      
    } else {
      storeInstructions = `
NO SPECIFIC STORES AVAILABLE for ${userCountryCode}.

FALLBACK: Recommend Amazon.com as the primary source for components.
Mention that prices may vary and shipping costs may apply to ${userCountryCode}.`;
    }

    // Format the quiz data for AI analysis
    const quizData = questions.map((q: any) => ({
      question: q.question,
      answer: answers[q.id],
      options: q.options
    }));

    // Interpolate placeholders in prompt
    const fillPromptPlaceholders = (prompt: string, answers: any): string => {
      const placeholderMap: { [key: string]: string } = {
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
        upgrade_horizon: '12–24 meses', // Default, não existe no quiz
      };
      
      return prompt.replace(/\{\{(\w+)\}\}/g, (_, key) => placeholderMap[key] || `{{${key}}}`);
    };

    let filledPrompt = sanitizedPrompt ? fillPromptPlaceholders(sanitizedPrompt, answers) : '';
    
    // Replace (user_country) tag with store URLs from SQL
    if (filledPrompt.includes('(user_country)')) {
      filledPrompt = filledPrompt.replace(/\(user_country\)/g, countryStoreUrls);
      console.log('Replaced (user_country) tag with store URLs');
    }
    
    console.log('Prompt filled with answers');

    const systemPrompt = filledPrompt ||
      `You are an expert PC building advisor with deep knowledge of hardware and regional availability.

CURRENT DATE: January 2025

═══════════════════════════════════════════════════════════════
⚠️ CRITICAL PRODUCT CURRENCY REQUIREMENTS (MUST FOLLOW):
═══════════════════════════════════════════════════════════════

🔴 HARDWARE CURRENCY:
   - ONLY recommend PC components released in 2023, 2024, or 2025
   - For CPUs: Use ONLY 13th/14th gen Intel OR Ryzen 7000/9000 series
   - For GPUs: Use ONLY RTX 40-series, RX 7000-series, or Intel Arc
   - For RAM: DDR4 (3200MHz+) or DDR5 only
   - For Storage: NVMe Gen3/Gen4 SSDs from 2023-2025
   - EXPLICITLY mention the generation/year in your recommendation
   - If a component seems outdated, it probably is - choose a newer alternative

🔴 NO DIRECT PRODUCT LINKS:
   - DO NOT include Amazon ASIN codes or direct product URLs
   - DO NOT use links like amazon.com/dp/XXXXXX
   - INSTEAD: Provide exact product names and search terms
   - Example: "Search for 'AMD Ryzen 7 7800X3D' at ${storeLinks?.[0]?.store_name || 'your local store'}"
   - Users will search for products themselves using current availability

═══════════════════════════════════════════════════════════════
🌍 CRITICAL LOCALIZATION REQUIREMENTS (MUST FOLLOW):
═══════════════════════════════════════════════════════════════

1. 🗣️ LANGUAGE: Respond ENTIRELY in ${userLanguage}
   - ALL text, explanations, component names, and descriptions must be in this language
   - Use natural, native phrasing appropriate for this language
   - Do NOT mix languages - stay consistent throughout

2. 💰 CURRENCY: Display ALL prices in ${userCurrency.code} (${userCurrency.symbol})
   - Format: ${userCurrency.symbol}XXX (example: ${userCurrency.symbol}1,200)
   - Consider regional pricing differences
   - Mention if prices are approximate

3. 🛒 STORES: ${storeLinks && storeLinks.length > 0 ? 'ONLY recommend the following stores' : 'Use Amazon.com as fallback'}
${storeInstructions}

═══════════════════════════════════════════════════════════════
📋 USER PROFILE:
═══════════════════════════════════════════════════════════════
- Country: ${userCountryCode}
- Language: ${userLanguage}
- Currency: ${userCurrency.code}
- Budget: ${answers.budget || 'Not specified'}${userCurrency.symbol}

═══════════════════════════════════════════════════════════════
🎯 RECOMMENDATION STRUCTURE (in ${userLanguage}):
═══════════════════════════════════════════════════════════════

Provide a comprehensive PC build recommendation with these sections:

1. **CPU (Processor)**
   - Specific model with generation (e.g., "Intel Core i5-14600K - 14th Gen" or "AMD Ryzen 7 7800X3D")
   - Year released (2023-2025 ONLY)
   - Why it fits their needs
   - Approximate price in ${userCurrency.code}
   - Search term: "Search for '[exact product name]' at [store name]"

2. **GPU (Graphics Card)**
   - Exact model and VRAM (e.g., "RTX 4070 12GB" or "RX 7800 XT 16GB")
   - Must be RTX 40-series, RX 7000-series, or Intel Arc
   - Performance expectations for their use case
   - Price in ${userCurrency.code}
   - Search term for finding the product

3. **Motherboard**
   - Model compatible with CPU (B650/X670 for AMD, B760/Z790 for Intel)
   - Key features (WiFi, connectivity)
   - Price in ${userCurrency.code}
   - Search instructions

4. **RAM (Memory)**
   - Capacity, speed, and specific kit
   - DDR4 (3200MHz+) or DDR5 only
   - Why this amount is suitable
   - Price in ${userCurrency.code}
   - Where to search

5. **Storage**
   - Primary NVMe SSD Gen3/Gen4 (capacity and speed)
   - Models from 2023-2025 only
   - Optional secondary storage if needed
   - Prices in ${userCurrency.code}
   - Search guidance

6. **PSU (Power Supply)**
   - Wattage and efficiency rating (80+ Bronze/Gold/Platinum)
   - Why this capacity
   - Price in ${userCurrency.code}
   - Brand and model to search for

7. **Case**
   - Model with good cooling
   - Size preference consideration
   - Price in ${userCurrency.code}
   - Search term

8. **💰 TOTAL COST ESTIMATE**
   - Sum of all components in ${userCurrency.code}
   - Mention if peripherals are included
   - Note any additional costs (shipping, etc.)

9. **🛒 SHOPPING GUIDE**
   - Step-by-step purchasing advice
   - Priority order for buying components
   - Tips for finding current deals in ${userCountryCode}
   - How to verify product availability and current prices

10. **⚡ PERFORMANCE EXPECTATIONS**
    - What they can expect with this build
    - FPS estimates for games (if gaming PC)
    - Rendering times (if content creation)

═══════════════════════════════════════════════════════════════
✅ QUALITY CHECKLIST:
═══════════════════════════════════════════════════════════════
- [ ] ALL components from 2023-2025 ONLY (13th/14th Gen Intel, Ryzen 7000/9000, RTX 40, RX 7000)
- [ ] NO direct product links or Amazon ASINs
- [ ] Exact product names with search instructions
- [ ] Entire response in ${userLanguage}
- [ ] All prices in ${userCurrency.code} (${userCurrency.symbol})
- [ ] Only recommended stores listed
- [ ] Specific model numbers for all components
- [ ] Clear explanations for each choice
- [ ] Total cost within or near budget
- [ ] Realistic performance expectations

Remember: This recommendation will directly impact their purchasing decisions. Be accurate, specific, and helpful! Focus on CURRENT hardware only.`;

    const userPrompt = `Based on these quiz responses, provide comprehensive PC build recommendations:\n\n${JSON.stringify(quizData, null, 2)}`;

    // Call AI with retry logic
    const callAIWithRetry = async (model: string, maxRetries = 3): Promise<{ content: string; aiReport: any; builds: any }> => {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      
      if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries} with model: ${model}`);
          
          // Add 45-second timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000);
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            signal: controller.signal,
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              max_tokens: 2000,
              temperature: 0.7,
              stream: false,
              tools: [
                {
                  type: "function",
                  function: {
                    name: "generate_pc_build_report",
                    description: "Generate a comprehensive PC build recommendation with AI analysis report and structured build data",
                    parameters: {
                      type: "object",
                      properties: {
                        recommendation: {
                          type: "string",
                          description: "The full PC build recommendation in markdown format with all component details, prices, and shopping guide"
                        },
                        builds: {
                          type: "object",
                          properties: {
                            "Best Value": {
                              type: "object",
                              properties: {
                                processor: { type: "string", description: "CPU model and generation" },
                                graphics_card: { type: "string", description: "GPU model" },
                                ram: { type: "string", description: "RAM capacity and speed" },
                                storage: { type: "string", description: "Storage type and capacity" },
                                power_supply: { type: "string", description: "PSU wattage and efficiency" },
                                estimated_price_range: { type: "string", description: "Price range in user currency" },
                                performance_tier: { type: "string", description: "Performance level description" }
                              },
                              required: ["processor", "graphics_card", "ram", "storage", "power_supply", "estimated_price_range", "performance_tier"]
                            },
                            "Balanced": {
                              type: "object",
                              properties: {
                                processor: { type: "string", description: "CPU model and generation" },
                                graphics_card: { type: "string", description: "GPU model" },
                                ram: { type: "string", description: "RAM capacity and speed" },
                                storage: { type: "string", description: "Storage type and capacity" },
                                power_supply: { type: "string", description: "PSU wattage and efficiency" },
                                estimated_price_range: { type: "string", description: "Price range in user currency" },
                                performance_tier: { type: "string", description: "Performance level description" }
                              },
                              required: ["processor", "graphics_card", "ram", "storage", "power_supply", "estimated_price_range", "performance_tier"]
                            },
                            "High Performance": {
                              type: "object",
                              properties: {
                                processor: { type: "string", description: "CPU model and generation" },
                                graphics_card: { type: "string", description: "GPU model" },
                                ram: { type: "string", description: "RAM capacity and speed" },
                                storage: { type: "string", description: "Storage type and capacity" },
                                power_supply: { type: "string", description: "PSU wattage and efficiency" },
                                estimated_price_range: { type: "string", description: "Price range in user currency" },
                                performance_tier: { type: "string", description: "Performance level description" }
                              },
                              required: ["processor", "graphics_card", "ram", "storage", "power_supply", "estimated_price_range", "performance_tier"]
                            }
                          },
                          required: ["Best Value", "Balanced", "High Performance"]
                        },
                        ai_report: {
                          type: "object",
                          properties: {
                            budget_range: {
                              type: "string",
                              description: "Concise budget range description based on analysis (e.g., 'Entry-level Budget', 'Mid-range Gaming', 'High-end Workstation')"
                            },
                            primary_use: {
                              type: "string",
                              description: "Primary use case identified (e.g., 'Gaming & Streaming', 'Content Creation', 'Office Work', 'Video Editing')"
                            },
                            performance_level: {
                              type: "string",
                              description: "Expected performance level (e.g., '1080p 60fps Gaming', '4K Video Editing', 'Competitive Gaming 240fps')"
                            },
                            upgrade_priority: {
                              type: "string",
                              description: "Upgrade path or build priority (e.g., 'GPU-focused Build', 'Balanced All-rounder', 'Future-proof Investment')"
                            }
                          },
                          required: ["budget_range", "primary_use", "performance_level", "upgrade_priority"]
                        }
                      },
                      required: ["recommendation", "builds", "ai_report"]
                    }
                  }
                }
              ],
              tool_choice: { type: "function", function: { name: "generate_pc_build_report" } }
            }),
          });
          
          clearTimeout(timeoutId);

          const contentType = response.headers.get('content-type') || '';
          console.log('Response content-type:', contentType, 'status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error (${response.status}):`, errorText.substring(0, 500));
            
            if (response.status === 402) {
              throw new Error('CREDITS_EXHAUSTED');
            } else if (response.status === 429) {
              throw new Error('RATE_LIMIT');
            } else if (response.status === 401 || response.status === 403) {
              throw new Error('AUTH_ERROR');
            }
            
            throw new Error(`API_ERROR_${response.status}`);
          }

          let aiContent = '';
          let extractedAiReport: any = null;
          let extractedBuilds: any = null;
          
          // Try parsing as JSON first
          try {
            const aiResponse = await response.json();
            
            // Check for tool call response
            if (aiResponse.choices?.[0]?.message?.tool_calls?.[0]) {
              const toolCall = aiResponse.choices[0].message.tool_calls[0];
              if (toolCall.function?.name === 'generate_pc_build_report') {
                const functionArgs = JSON.parse(toolCall.function.arguments);
                aiContent = functionArgs.recommendation || '';
                extractedAiReport = functionArgs.ai_report || null;
                extractedBuilds = functionArgs.builds || null;
                console.log('Extracted AI report from tool call:', extractedAiReport);
                console.log('Extracted builds from tool call:', extractedBuilds);
              }
            } else if (aiResponse.choices?.[0]?.message?.content) {
              // Fallback to content if no tool call
              aiContent = aiResponse.choices[0].message.content;
            } else {
              console.error('Invalid JSON structure:', JSON.stringify(aiResponse).substring(0, 300));
              throw new Error('Invalid response structure');
            }
          } catch (jsonError) {
            console.log('JSON parse failed, trying SSE format...');
            
            // Fallback: Handle SSE format (text/event-stream)
            const responseText = await response.text();
            
            if (contentType.includes('text/event-stream')) {
              console.log('Detected SSE format, parsing manually...');
              const lines = responseText.split('\n');
              let reconstructedContent = '';
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.substring(6).trim();
                  if (jsonStr === '[DONE]') break;
                  
                  try {
                    const chunk = JSON.parse(jsonStr);
                    const delta = chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.message?.content;
                    if (delta) {
                      reconstructedContent += delta;
                    }
                  } catch (chunkError) {
                    // Skip malformed chunks
                    continue;
                  }
                }
              }
              
              if (reconstructedContent.length > 100) {
                console.log('SSE parsing successful, content length:', reconstructedContent.length);
                aiContent = reconstructedContent;
              } else {
                console.error('SSE parsing failed, content too short:', reconstructedContent.length);
                throw new Error('SSE_PARSE_FAILED');
              }
            } else {
              console.error('Unexpected content type and JSON parse failed');
              console.error('Response preview:', responseText.substring(0, 500));
              throw new Error('PARSE_FAILED');
            }
          }
          
          // Validate content
          if (!aiContent || aiContent.trim().length < 100) {
            console.error('AI content too short:', aiContent?.length || 0);
            throw new Error('CONTENT_TOO_SHORT');
          }
          
          // Truncate if too long (safety)
          if (aiContent.length > 50000) {
            console.log('Truncating content from', aiContent.length, 'to 50000 chars');
            aiContent = aiContent.substring(0, 50000);
          }
          
          console.log('AI analysis successful, content length:', aiContent.length);
          return { content: aiContent, aiReport: extractedAiReport, builds: extractedBuilds };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Attempt ${attempt} failed:`, errorMessage);
          
          // Handle timeout
          if (errorMessage.includes('abort')) {
            throw new Error('TIMEOUT');
          }
          
          // Don't retry on specific errors
          if (errorMessage === 'CREDITS_EXHAUSTED' || 
              errorMessage === 'AUTH_ERROR' ||
              errorMessage === 'RATE_LIMIT') {
            throw error;
          }
          
          // Last attempt
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw new Error('Max retries exceeded');
    };

    // Try main model first
    let recommendation = '';
    let aiReport: any = null;
    let builds: any = null;
    let usedModel = 'gpt-4o-mini';
    try {
      const result = await callAIWithRetry('gpt-4o-mini');
      recommendation = result.content;
      aiReport = result.aiReport;
      builds = result.builds;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Primary model failed:', errorMessage);
      
      // Fallback strategy: retry with same model
      if (errorMessage === 'TIMEOUT' ||
          errorMessage === 'SSE_PARSE_FAILED' || 
          errorMessage === 'PARSE_FAILED' ||
          errorMessage === 'CONTENT_TOO_SHORT') {
        console.log('Attempting fallback retry with gpt-4o-mini...');
        try {
          const result = await callAIWithRetry('gpt-4o-mini', 2);
          recommendation = result.content;
          aiReport = result.aiReport;
          builds = result.builds;
        } catch (fallbackError) {
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
          console.error('Fallback retry failed:', fallbackMessage);
          throw error; // Throw original error
        }
      } else {
        throw error;
      }
    }

    // Process recommendation to create search-based tracked links
    let processedRecommendation = recommendation;
    
    try {
      console.log('Processing recommendation to create search-based tracked links...');
      
      // Step 1: Remove any direct http(s) URLs from AI output (except markdown-formatted ones)
      const directUrlRegex = /(?<!\]\()https?:\/\/[^\s<>"()]+/gi;
      const removedUrls = recommendation.match(directUrlRegex) || [];
      if (removedUrls.length > 0) {
        console.log('Removing', removedUrls.length, 'direct URLs from AI output');
        processedRecommendation = processedRecommendation.replace(directUrlRegex, '[removed]');
      }
      
      // Step 2: Build allowlist of store domains from country_store_links
      const storeDomainMap = new Map<string, { name: string; url: string }>();
      if (storeLinks && storeLinks.length > 0) {
        for (const store of storeLinks) {
          try {
            const storeUrl = new URL(store.store_url);
            const domain = storeUrl.hostname.replace('www.', '');
            storeDomainMap.set(domain, { name: store.store_name, url: store.store_url });
          } catch (e) {
            console.error('Invalid store URL:', store.store_url);
          }
        }
      }
      console.log('Built allowlist with', storeDomainMap.size, 'store domains');
      
      // Step 3: Extract "Search for '...' at ..." patterns
      const searchPatterns = [
        /Search for ['"]([^'"]+)['"] at ([^\n.]+)/gi,
        /Procure ['"]([^'"]+)['"] em ([^\n.]+)/gi,
        /Busca ['"]([^'"]+)['"] en ([^\n.]+)/gi,
        /Cherchez ['"]([^'"]+)['"] chez ([^\n.]+)/gi,
      ];
      
      interface ComponentLink {
        component: string;
        searchTerm: string;
        storeName: string;
        searchUrl: string;
        shortCode: string;
      }
      
      const componentLinks: ComponentLink[] = [];
      const componentCategories = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler'];
      
      // Try to extract from explicit "Search for..." patterns first
      for (const pattern of searchPatterns) {
        let match;
        while ((match = pattern.exec(processedRecommendation)) !== null) {
          const searchTerm = match[1].trim();
          const storeName = match[2].trim();
          
          // Find matching store domain
          let matchedStore = null;
          for (const [domain, storeInfo] of storeDomainMap.entries()) {
            if (storeInfo.name.toLowerCase().includes(storeName.toLowerCase()) || 
                storeName.toLowerCase().includes(storeInfo.name.toLowerCase())) {
              matchedStore = { domain, ...storeInfo };
              break;
            }
          }
          
          if (matchedStore) {
            // Determine component category from context
            let component = 'Component';
            for (const cat of componentCategories) {
              if (searchTerm.toLowerCase().includes(cat.toLowerCase()) || 
                  processedRecommendation.substring(Math.max(0, match.index - 200), match.index).toLowerCase().includes(cat.toLowerCase())) {
                component = cat;
                break;
              }
            }
            
            // Generate search URL based on store domain
            let searchUrl = '';
            const encodedTerm = encodeURIComponent(searchTerm);
            
            if (matchedStore.domain.includes('pcdiga.com')) {
              searchUrl = `https://www.pcdiga.com/catalogsearch/result/?q=${encodedTerm}`;
            } else if (matchedStore.domain.includes('pccomponentes.com') || matchedStore.domain.includes('pccomponentes.pt')) {
              searchUrl = `https://www.pccomponentes.pt/pesquisa/?query=${encodedTerm}`;
            } else if (matchedStore.domain.includes('amazon.')) {
              searchUrl = `${matchedStore.url}/s?k=${encodedTerm}`;
            } else if (matchedStore.domain.includes('worten.')) {
              searchUrl = `https://www.google.com/search?q=site:${matchedStore.domain}+${encodedTerm}`;
              console.log('Using Google fallback for worten:', searchUrl);
            } else if (matchedStore.domain.includes('globaldata.')) {
              searchUrl = `https://www.google.com/search?q=site:${matchedStore.domain}+${encodedTerm}`;
              console.log('Using Google fallback for globaldata:', searchUrl);
            } else {
              // Generic fallback: Google site search
              searchUrl = `https://www.google.com/search?q=site:${matchedStore.domain}+${encodedTerm}`;
              console.log('Using Google fallback for unknown store:', matchedStore.domain);
            }
            
            // Check if tracked link exists
            const { data: existingLink } = await supabase
              .from('tracked_links')
              .select('short_code')
              .eq('destination_url', searchUrl)
              .eq('status', true)
              .maybeSingle();
            
            let shortCode = '';
            if (existingLink) {
              shortCode = existingLink.short_code;
              console.log('Found existing search link:', shortCode);
            } else {
              shortCode = Math.random().toString(36).substring(2, 10);
              const { error: linkError } = await supabase
                .from('tracked_links')
                .insert({
                  short_code: shortCode,
                  destination_url: searchUrl,
                  label: `Search: ${searchTerm.substring(0, 40)}`,
                  company_id: null,
                  status: true,
                });
              
              if (linkError) {
                console.error('Error creating search link:', linkError);
                continue;
              }
              console.log('Created search link:', shortCode, 'for', searchTerm);
            }
            
            componentLinks.push({
              component,
              searchTerm,
              storeName: matchedStore.name,
              searchUrl,
              shortCode,
            });
          }
        }
      }
      
      console.log('Extracted', componentLinks.length, 'component search links');
      
      // Step 4: If no explicit patterns found, try to infer from component sections
      if (componentLinks.length === 0 && storeLinks && storeLinks.length > 0) {
        console.log('No explicit search patterns found, attempting inference from component sections');
        
        for (const category of componentCategories) {
          // Find sections mentioning this component category
          const categoryRegex = new RegExp(`\\*\\*${category}[^*]*\\*\\*[^*]+?([A-Za-z0-9][A-Za-z0-9\\s-]+(?:RTX|RX|Ryzen|Intel|Core|DDR|GB|TB|MHz|GHz)[A-Za-z0-9\\s-]+)`, 'i');
          const match = categoryRegex.exec(processedRecommendation);
          
          if (match && match[1]) {
            const inferredProduct = match[1].trim().substring(0, 60);
            const primaryStore = storeLinks[0];
            
            let searchUrl = '';
            const encodedTerm = encodeURIComponent(inferredProduct);
            const storeDomain = new URL(primaryStore.store_url).hostname.replace('www.', '');
            
            if (storeDomain.includes('pcdiga.com')) {
              searchUrl = `https://www.pcdiga.com/catalogsearch/result/?q=${encodedTerm}`;
            } else if (storeDomain.includes('pccomponentes.')) {
              searchUrl = `https://www.pccomponentes.pt/pesquisa/?query=${encodedTerm}`;
            } else if (storeDomain.includes('amazon.')) {
              searchUrl = `${primaryStore.store_url}/s?k=${encodedTerm}`;
            } else {
              searchUrl = `https://www.google.com/search?q=site:${storeDomain}+${encodedTerm}`;
            }
            
            const { data: existingLink } = await supabase
              .from('tracked_links')
              .select('short_code')
              .eq('destination_url', searchUrl)
              .maybeSingle();
            
            let shortCode = '';
            if (existingLink) {
              shortCode = existingLink.short_code;
            } else {
              shortCode = Math.random().toString(36).substring(2, 10);
              await supabase.from('tracked_links').insert({
                short_code: shortCode,
                destination_url: searchUrl,
                label: `${category}: ${inferredProduct.substring(0, 30)}`,
                company_id: null,
                status: true,
              });
            }
            
            componentLinks.push({
              component: category,
              searchTerm: inferredProduct,
              storeName: primaryStore.store_name,
              searchUrl,
              shortCode,
            });
          }
        }
        
        console.log('Inferred', componentLinks.length, 'component links from sections');
      }
      
      // Step 5: Inject "Links rápidos" section with tracked links
      if (componentLinks.length > 0) {
        const languageHeaders: { [key: string]: string } = {
          'Portuguese (Portugal)': '## 🔗 Links Rápidos',
          'Portuguese (Brazil)': '## 🔗 Links Rápidos',
          'Spanish': '## 🔗 Enlaces Rápidos',
          'French': '## 🔗 Liens Rapides',
          'English': '## 🔗 Quick Links',
        };
        
        const header = languageHeaders[userLanguage] || '## 🔗 Quick Links';
        const linksList = componentLinks
          .map(link => {
            const trackedUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/track-click/${link.shortCode}`;
            return `- **${link.component}**: [${link.searchTerm}](${trackedUrl}) - ${link.storeName}`;
          })
          .join('\n');
        
        const linksSection = `\n\n${header}\n\n${linksList}\n\n*Click nos links acima para pesquisar cada componente diretamente nas lojas recomendadas.*\n`;
        
        // Inject before the final section (total cost or shopping guide)
        const insertBeforePatterns = [
          /##\s*💰\s*(?:TOTAL|CUSTO|COST|COÛT)/i,
          /##\s*🛒\s*(?:SHOPPING|COMPRAS|ACHATS)/i,
          /##\s*⚡\s*(?:PERFORMANCE|DESEMPENHO|RENDIMIENTO)/i,
        ];
        
        let inserted = false;
        for (const pattern of insertBeforePatterns) {
          const match = processedRecommendation.search(pattern);
          if (match !== -1) {
            processedRecommendation = 
              processedRecommendation.substring(0, match) + 
              linksSection + 
              processedRecommendation.substring(match);
            inserted = true;
            break;
          }
        }
        
        if (!inserted) {
          // Append at the end if no suitable section found
          processedRecommendation += linksSection;
        }
        
        console.log('Injected links section with', componentLinks.length, 'component links');
      }
      
    } catch (trackingError) {
      console.error('Error processing search-based tracked links:', trackingError);
      // Continue with original recommendation if tracking fails
      processedRecommendation = recommendation;
    }

    // Use AI-generated report or create fallback from answers
    const finalAiReport = aiReport || {
      budget_range: answers.budget || 'Not specified',
      primary_use: answers.purpose || 'Not specified',
      performance_level: answers.fps ? `${answers.fps} FPS @ ${answers.resolution || '1080p'}` : 'Standard',
      upgrade_priority: answers.upgradeExisting ? 'Upgrade' : 'New Build',
    };

    // Use AI-generated builds or create empty fallback
    const finalBuilds = builds || {
      "Best Value": {
        processor: "N/A",
        graphics_card: "N/A",
        ram: "N/A",
        storage: "N/A",
        power_supply: "N/A",
        estimated_price_range: "N/A",
        performance_tier: "N/A"
      },
      "Balanced": {
        processor: "N/A",
        graphics_card: "N/A",
        ram: "N/A",
        storage: "N/A",
        power_supply: "N/A",
        estimated_price_range: "N/A",
        performance_tier: "N/A"
      },
      "High Performance": {
        processor: "N/A",
        graphics_card: "N/A",
        ram: "N/A",
        storage: "N/A",
        power_supply: "N/A",
        estimated_price_range: "N/A",
        performance_tier: "N/A"
      }
    };

    // Save to database
    const { error: insertError } = await supabase
      .from('ai_recommendations')
      .insert({
        session_id: sessionId,
        recommendation_text: processedRecommendation,
        prompt_used: systemPrompt,
        model_used: usedModel,
      });

    if (insertError) {
      console.error('Error saving recommendation:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save recommendation' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Mark session as completed
    console.log('Marking session as completed:', sessionId);
    const { error: updateError } = await supabase
      .from('quiz_sessions')
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('Error marking session as completed:', updateError);
      // Don't fail the request, recommendation was saved successfully
    }

    // Get session info for response
    const { data: sessionData } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    // Return structured JSON matching the user's specification
    return new Response(
      JSON.stringify({ 
        session_info: {
          session_id: sessionId,
          country: sessionData?.country || userCountryCode,
          country_code: userCountryCode,
          total_score: sessionData?.total_score || null,
          completed_at: sessionData?.completed_at || new Date().toISOString(),
          ai_report: finalAiReport
        },
        recommendations: finalBuilds,
        explanation: processedRecommendation,
        metadata: {
          model_used: usedModel,
          tokens_used: 0, // OpenAI doesn't return token count in tool call mode
          created_at: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in analyze-quiz function:', errorMessage);
    
    let statusCode = 500;
    let errorResponse = 'Internal server error';
    
    if (errorMessage === 'CREDITS_EXHAUSTED') {
      statusCode = 402;
      errorResponse = 'AI credits exhausted';
    } else if (errorMessage === 'RATE_LIMIT') {
      statusCode = 429;
      errorResponse = 'Rate limit exceeded';
    } else if (errorMessage === 'AUTH_ERROR') {
      statusCode = 500;
      errorResponse = 'Authentication error';
    } else if (errorMessage.includes('PARSE_FAILED') || errorMessage === 'CONTENT_TOO_SHORT') {
      statusCode = 500;
      errorResponse = 'Failed to parse AI response';
    }
    
    return new Response(
      JSON.stringify({ error: errorResponse }),
      { status: statusCode, headers: corsHeaders }
    );
  }
});
