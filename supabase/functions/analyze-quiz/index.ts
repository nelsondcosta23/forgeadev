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

    const filledPrompt = sanitizedPrompt ? fillPromptPlaceholders(sanitizedPrompt, answers) : '';
    console.log('Prompt filled with answers');

    const systemPrompt = filledPrompt ||
      `You are an expert PC building advisor. Analyze the quiz responses and provide personalized recommendations.

${answers.country ? `User location: ${answers.country}. Consider regional availability, pricing, and local retailers.` : ''}

Provide recommendations with:
1. CPU (with model number)
2. GPU (based on gaming/work needs)
3. RAM (amount and speed)
4. Storage (SSD/HDD)
5. PSU wattage
6. Case & cooling
7. Total cost estimate
8. Where to buy

Be specific with model numbers and explain why each component fits their needs.`;

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

    // Save to database
    const { error: insertError } = await supabase
      .from('ai_recommendations')
      .insert({
        session_id: sessionId,
        recommendation_text: recommendation,
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
        recommendation 
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
