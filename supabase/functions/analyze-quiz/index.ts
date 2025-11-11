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
   - Specific model with generation
   - Why it fits their needs
   - Approximate price in ${userCurrency.code}
   - Where to buy (from approved stores)

2. **GPU (Graphics Card)**
   - Exact model and VRAM
   - Performance expectations for their use case
   - Price in ${userCurrency.code}
   - Store recommendation

3. **Motherboard**
   - Model compatible with CPU
   - Key features (WiFi, connectivity)
   - Price in ${userCurrency.code}
   - Where to find it

4. **RAM (Memory)**
   - Capacity, speed, and specific kit
   - Why this amount is suitable
   - Price in ${userCurrency.code}
   - Store suggestion

5. **Storage**
   - Primary NVMe SSD (capacity and speed)
   - Optional secondary HDD if needed
   - Prices in ${userCurrency.code}
   - Where to buy

6. **PSU (Power Supply)**
   - Wattage and efficiency rating (80+ Bronze/Gold)
   - Why this capacity
   - Price in ${userCurrency.code}
   - Store recommendation

7. **Case**
   - Model with good cooling
   - Size preference consideration
   - Price in ${userCurrency.code}
   - Where to buy

8. **💰 TOTAL COST ESTIMATE**
   - Sum of all components in ${userCurrency.code}
   - Mention if peripherals are included
   - Note any additional costs (shipping, etc.)

9. **🛒 SHOPPING GUIDE**
   - Step-by-step purchasing advice
   - Priority order for buying components
   - Tips for finding deals in ${userCountryCode}

10. **⚡ PERFORMANCE EXPECTATIONS**
    - What they can expect with this build
    - FPS estimates for games (if gaming PC)
    - Rendering times (if content creation)

═══════════════════════════════════════════════════════════════
✅ QUALITY CHECKLIST:
═══════════════════════════════════════════════════════════════
- [ ] Entire response in ${userLanguage}
- [ ] All prices in ${userCurrency.code} (${userCurrency.symbol})
- [ ] Only recommended stores listed
- [ ] Specific model numbers for all components
- [ ] Clear explanations for each choice
- [ ] Total cost within or near budget
- [ ] Realistic performance expectations

Remember: This recommendation will directly impact their purchasing decisions. Be accurate, specific, and helpful!`;

    const userPrompt = `Based on these quiz responses, provide comprehensive PC build recommendations:\n\n${JSON.stringify(quizData, null, 2)}`;

    // Call AI with retry logic
    const callAIWithRetry = async (model: string, maxRetries = 3): Promise<string> => {
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
          
          // Try parsing as JSON first
          try {
            const aiResponse = await response.json();
            
            if (!aiResponse.choices?.[0]?.message?.content) {
              console.error('Invalid JSON structure:', JSON.stringify(aiResponse).substring(0, 300));
              throw new Error('Invalid response structure');
            }
            
            aiContent = aiResponse.choices[0].message.content;
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
          return aiContent;

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
    let usedModel = 'gpt-4o-mini';
    try {
      recommendation = await callAIWithRetry('gpt-4o-mini');
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
          recommendation = await callAIWithRetry('gpt-4o-mini', 2);
        } catch (fallbackError) {
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
          console.error('Fallback retry failed:', fallbackMessage);
          throw error; // Throw original error
        }
      } else {
        throw error;
      }
    }

    // Process recommendation to create tracked links
    let processedRecommendation = recommendation;
    
    try {
      console.log('Processing recommendation to create tracked links...');
      
      // Extract all URLs from the recommendation text (exclude parentheses to avoid markdown syntax)
      const urlRegex = /https?:\/\/[^\s<>"()]+/gi;
      const urls = recommendation.match(urlRegex) || [];
      const uniqueUrls = [...new Set(urls)];
      
      console.log('Found', uniqueUrls.length, 'unique URLs in recommendation');
      
      // Map to store original URL -> tracked URL
      const urlMapping = new Map<string, string>();
      
      for (const originalUrl of uniqueUrls) {
        // Skip if already a forgea.com tracked link
        if (originalUrl.includes('forgea.com/go/')) {
          continue;
        }
        
        // Check if tracked link already exists for this URL
        const { data: existingLink } = await supabase
          .from('tracked_links')
          .select('short_code')
          .eq('destination_url', originalUrl)
          .eq('status', true)
          .maybeSingle();
        
        let shortCode = '';
        
        if (existingLink) {
          shortCode = existingLink.short_code;
          console.log('Found existing tracked link:', shortCode, 'for', originalUrl);
        } else {
          // Generate unique short code (8 characters)
          shortCode = Math.random().toString(36).substring(2, 10);
          
          // Extract product label from context (try to get text before URL)
          const urlIndex = recommendation.indexOf(originalUrl);
          const contextBefore = recommendation.substring(Math.max(0, urlIndex - 100), urlIndex);
          let label = 'Product';
          
          // Try to extract product name from markdown link [text](url) format
          const markdownMatch = recommendation.match(new RegExp(`\\[([^\\]]+)\\]\\(${originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`));
          if (markdownMatch && markdownMatch[1]) {
            label = markdownMatch[1].substring(0, 50);
          } else if (contextBefore.includes(':')) {
            // Try to get text after last colon (component name)
            const parts = contextBefore.split(':');
            label = parts[parts.length - 1].trim().substring(0, 50) || 'Product';
          }
          
          // Create new tracked link
          const { error: linkError } = await supabase
            .from('tracked_links')
            .insert({
              short_code: shortCode,
              destination_url: originalUrl,
              label: label,
              company_id: null,
              status: true,
            });
          
          if (linkError) {
            console.error('Error creating tracked link:', linkError);
            continue; // Skip this URL
          }
          
          console.log('Created new tracked link:', shortCode, 'for', originalUrl, 'label:', label);
        }
        
        // Store mapping
        const trackedUrl = `https://forgea.com/go/${shortCode}`;
        urlMapping.set(originalUrl, trackedUrl);
      }
      
      // Replace all original URLs with tracked URLs in the recommendation
      for (const [originalUrl, trackedUrl] of urlMapping.entries()) {
        // Use a more careful replacement to preserve markdown formatting
        const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        processedRecommendation = processedRecommendation.replace(
          new RegExp(escapedUrl, 'g'),
          trackedUrl
        );
      }
      
      console.log('Processed recommendation with', urlMapping.size, 'tracked links');
      
    } catch (trackingError) {
      console.error('Error processing tracked links:', trackingError);
      // Continue with original recommendation if tracking fails
      processedRecommendation = recommendation;
    }

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

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendation: processedRecommendation 
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
