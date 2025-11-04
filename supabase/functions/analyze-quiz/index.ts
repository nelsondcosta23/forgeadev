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
    const { answers, questions } = await req.json();
    
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
      `Você é um especialista em hardware de computadores. Analise as respostas do quiz e forneça uma recomendação COMPLETA em formato MARKDOWN.

IMPORTANTE: Sua resposta DEVE estar em formato Markdown com:
- Use # para títulos principais
- Use ## para subtítulos
- Use **negrito** para componentes importantes
- Use listas numeradas ou com bullet points
- Use \`código\` para nomes técnicos de componentes

Estruture sua resposta assim:

# Recomendação Personalizada

## 💰 Orçamento Ideal
[análise do orçamento]

## 🎯 Componentes Recomendados

### Processador (CPU)
- **Modelo**: [nome específico]
- **Por quê**: [explicação]

### Placa Gráfica (GPU)
- **Modelo**: [nome específico]
- **Por quê**: [explicação]

### Memória RAM
- **Especificação**: [quantidade e tipo]
- **Por quê**: [explicação]

### Armazenamento
- **Tipo**: [SSD/HDD e capacidade]
- **Por quê**: [explicação]

### Outros Componentes
- **Motherboard**: [recomendação]
- **Fonte (PSU)**: [potência e certificação]
- **Gabinete**: [tipo]
- **Cooler**: [tipo]

## 📊 Performance Esperada
[lista de benchmarks e FPS esperados]

## 💡 Dicas Extras
[otimizações e considerações]

Seja específico, técnico mas acessível. Use modelos reais de 2024-2025.`;

    console.log('Calling Lovable AI with quiz data...');

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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit excedido, tente novamente em alguns instantes.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos ao workspace.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Erro ao chamar API da AI');
    }

    const aiResponse = await response.json();
    const recommendation = aiResponse.choices[0].message.content;

    console.log('AI analysis completed successfully');

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
