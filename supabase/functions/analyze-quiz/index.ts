import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { answers, questions, sessionId } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the latest prompt from admin_prompts
    const { data: promptData, error: promptError } = await supabase
      .from('admin_prompts')
      .select('prompt_text')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (promptError) {
      console.error('Error fetching prompt:', promptError);
    }

    let customPrompt = promptData?.prompt_text;
    
    // Sanitize and truncate prompt to prevent issues
    if (customPrompt) {
      customPrompt = customPrompt.replace(/[^\x20-\x7E\n\r\t]/g, '').substring(0, 2000);
      console.log('Using custom prompt (sanitized, length:', customPrompt.length, ')');
    } else {
      console.log('Using default prompt');
    }

    // Format questions and answers for AI
    let quizContent = "Análise do Quiz de PC:\n\n";
    
    questions.forEach((q: any, index: number) => {
      const answer = answers[q.id];
      quizContent += `${index + 1}. ${q.question}\n`;
      
      if (q.type === 'single' && q.options) {
        const selectedOption = q.options.find((opt: any) => opt.value === answer);
        quizContent += `   Resposta: ${selectedOption?.label || answer}\n`;
      } else {
        quizContent += `   Resposta: ${answer}\n`;
      }
      quizContent += '\n';
    });

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não está configurada');
    }

    const systemPrompt = customPrompt || 
      `Você é um especialista em hardware de computadores. Analise as respostas do quiz e forneça uma recomendação personalizada de PC em formato Markdown.

Inclua:
- Análise do orçamento
- Componentes recomendados (CPU, GPU, RAM, Armazenamento, Placa-mãe, Fonte)
- Performance esperada
- Dicas extras

Seja específico com modelos reais de 2024-2025. Use formatação Markdown clara com cabeçalhos (##), negrito (**texto**) e bullet points.`;

    // Helper function to call AI with retry logic
    async function callAIWithRetry(maxRetries = 3) {
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`AI call attempt ${attempt}/${maxRetries}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 120000);

          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: quizContent }
              ],
              stream: false,
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error ${response.status}:`, errorText);
            
            // Don't retry on 402 (no credits) or 401 (auth error)
            if (response.status === 402) {
              throw new Error('CREDITS_EXHAUSTED');
            }
            if (response.status === 401) {
              throw new Error('AUTH_ERROR');
            }
            
            // Retry on 429 (rate limit) or 5xx errors
            if (attempt < maxRetries && (response.status === 429 || response.status >= 500)) {
              const delay = Math.pow(2, attempt) * 1000;
              console.log(`Rate limit or server error. Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            throw new Error(`API_ERROR_${response.status}`);
          }

          const contentType = response.headers.get('content-type') || '';
          console.log('Response content-type:', contentType);
          
          let aiContent: string;
          
          // Try parsing as JSON first
          try {
            const aiResponse = await response.json();
            console.log('Parsed as JSON successfully');
            
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
          
          console.log('Final content length:', aiContent.length);
          return aiContent;

        } catch (error: any) {
          lastError = error;
          console.error(`Attempt ${attempt} failed:`, error.message);
          
          // Don't retry on specific errors
          if (error.message === 'CREDITS_EXHAUSTED' || error.message === 'AUTH_ERROR') {
            throw error;
          }
          
          // Last attempt with main model failed
          if (attempt === maxRetries) {
            break; // Will try fallback model
          }
          
          // Wait before retry
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // Fallback: Try with flash-lite model (1 attempt)
      console.log('All attempts with gemini-2.5-flash failed. Trying fallback model: gemini-2.5-flash-lite');
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: quizContent }
            ],
            stream: false,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const aiResponse = await response.json();
          const content = aiResponse.choices?.[0]?.message?.content;
          
          if (content && content.length > 100) {
            console.log('Fallback model succeeded! Content length:', content.length);
            return content;
          }
        }
      } catch (fallbackError) {
        console.error('Fallback model also failed:', fallbackError);
      }
      
      // All attempts failed
      throw lastError || new Error('All retry attempts failed');
    }

    console.log('Calling Lovable AI with quiz data...');
    const recommendation = await callAIWithRetry();

    console.log('AI analysis completed successfully');

    // Save recommendation to database
    if (sessionId) {
      try {
        const { error: insertError } = await supabase
          .from('ai_recommendations')
          .insert({
            session_id: sessionId,
            recommendation_text: recommendation,
            prompt_used: customPrompt ? 'custom' : 'default',
            model_used: 'google/gemini-2.5-flash',
          });

        if (insertError) {
          console.error('Error saving AI recommendation to database:', insertError);
          // Don't fail the entire request if just the database save fails
        } else {
          console.log('AI recommendation saved to database successfully');
        }
      } catch (dbError) {
        console.error('Exception saving AI recommendation:', dbError);
        // Don't fail the entire request
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendation,
        promptUsed: customPrompt ? 'custom' : 'default'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-quiz function:', error);
    
    // Return specific error codes
    let status = 500;
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      if (error.message === 'CREDITS_EXHAUSTED') {
        status = 402;
        errorMessage = 'Insufficient credits. Please add more credits to continue.';
      } else if (error.message === 'AUTH_ERROR') {
        status = 401;
        errorMessage = 'Authentication error. Please contact support.';
      } else if (error.message.includes('429')) {
        status = 429;
        errorMessage = 'Rate limit exceeded. Please wait a few moments and try again.';
      } else if (error.message === 'PARSE_FAILED' || error.message === 'SSE_PARSE_FAILED') {
        errorMessage = 'AI service returned an invalid response. Please try again.';
      } else if (error.message === 'CONTENT_TOO_SHORT') {
        errorMessage = 'AI generated incomplete response. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        success: false 
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
