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

    const customPrompt = promptData?.prompt_text || '';

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
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: quizContent }
              ],
              // No temperature parameter for Gemini 2.5
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Attempt ${attempt} - AI API error:`, response.status, errorText);
            
            // Don't retry on 402 (no credits) or 401 (auth error)
            if (response.status === 402) {
              return new Response(
                JSON.stringify({ error: 'Insufficient credits. Please add credits to the workspace.', success: false }), 
                { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            
            if (response.status === 401) {
              throw new Error('Authentication error');
            }
            
            // Retry on 429 (rate limit) or 5xx errors
            if (attempt < maxRetries && (response.status === 429 || response.status >= 500)) {
              const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
              console.log(`Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            return new Response(
              JSON.stringify({ error: 'The AI service is temporarily unavailable. Please try again.', success: false }), 
              { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const responseText = await response.text();
          console.log('AI response received, length:', responseText.length);

          if (!responseText || responseText.trim().length === 0) {
            throw new Error('Empty response');
          }

          // Try to parse JSON
          let aiResponse;
          try {
            aiResponse = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Failed to parse AI response.');
            console.error('Response length:', responseText.length);
            console.error('First 500 chars:', responseText.substring(0, 500));
            console.error('Last 500 chars:', responseText.substring(responseText.length - 500));
            console.error('Parse error:', parseError);
            throw new Error('Invalid JSON response');
          }
          
          // Validate structure
          if (!aiResponse.choices?.[0]?.message?.content) {
            console.error('AI response missing expected structure:', aiResponse);
            throw new Error('Invalid response structure');
          }

          return aiResponse.choices[0].message.content;

        } catch (error: any) {
          console.error(`Attempt ${attempt} failed:`, error.message);
          
          // Handle timeout
          if (error.name === 'AbortError') {
            if (attempt === maxRetries) {
              return new Response(
                JSON.stringify({ error: 'AI analysis timed out. Please try again.', success: false }), 
                { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Timeout - retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // Last attempt, throw error
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw new Error('All retry attempts failed');
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
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
