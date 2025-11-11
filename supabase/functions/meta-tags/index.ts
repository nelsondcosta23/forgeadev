import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to detect if the request is from a social media bot
function isSocialBot(userAgent: string): boolean {
  const botPatterns = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'TelegramBot',
    'Slackbot',
    'Pinterest',
    'Discordbot',
    'SkypeUriPreview',
    'vkShare',
    'W3C_Validator',
    'redditbot',
    'Embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'tumblr',
    'developers.google.com/+/web/snippet',
    'Googlebot',
    'Bingbot'
  ];
  
  const lowerUA = userAgent.toLowerCase();
  return botPatterns.some(pattern => lowerUA.includes(pattern.toLowerCase()));
}

// Function to extract session ID from URL path
function extractSessionId(pathname: string): string | null {
  // Matches /build/:sessionId or /build/:sessionId/ patterns
  const match = pathname.match(/\/build\/([^\/]+)\/?$/);
  return match ? match[1] : null;
}

// Function to extract budget value from answers
function extractBudget(responses: any[]): string {
  const budgetResponse = responses.find(r => 
    r.question_text?.toLowerCase().includes('budget') || 
    r.question_text?.toLowerCase().includes('spend')
  );
  return budgetResponse?.selected_answer || 'Custom Budget';
}

// Function to extract main components from answers
function extractMainComponents(responses: any[]): { cpu?: string; gpu?: string } {
  const components: { cpu?: string; gpu?: string } = {};
  
  // Look for gaming/purpose questions to infer components
  const purposeResponse = responses.find(r => 
    r.question_text?.toLowerCase().includes('use') || 
    r.question_text?.toLowerCase().includes('purpose')
  );
  
  if (purposeResponse) {
    const purpose = purposeResponse.selected_answer.toLowerCase();
    if (purpose.includes('gaming')) {
      components.cpu = 'AMD Ryzen / Intel Core';
      components.gpu = 'NVIDIA RTX / AMD RX';
    } else if (purpose.includes('content')) {
      components.cpu = 'Multi-core Processor';
      components.gpu = 'Professional GPU';
    } else if (purpose.includes('workstation')) {
      components.cpu = 'High-end Workstation CPU';
      components.gpu = 'Workstation Graphics';
    }
  }
  
  return components;
}

// Function to generate meta tags HTML
function generateMetaTagsHTML(
  sessionId: string,
  budget: string,
  components: { cpu?: string; gpu?: string },
  aiSummary?: string,
  baseUrl?: string
): string {
  const url = baseUrl || 'https://forgea.dev';
  const shareUrl = `${url}/build/${sessionId}`;
  const imageUrl = `${url}/images/og-image.png`;
  
  // Create dynamic title
  const title = components.cpu && components.gpu
    ? `Build PC Personalizada | ${components.cpu} + ${components.gpu} | ${budget}`
    : `Build PC Personalizada | ${budget} | Forgea`;
  
  // Create dynamic description
  let description = aiSummary 
    ? aiSummary.substring(0, 155) + '...'
    : `Configuração personalizada de PC criada com Forgea. Orçamento: ${budget}. Componentes otimizados para máximo desempenho.`;
  
  if (!aiSummary && components.cpu) {
    description = `Build PC: ${components.cpu}${components.gpu ? ` + ${components.gpu}` : ''} | ${budget} | Criada no Forgea - Acesse para ver todos os detalhes!`;
  }
  
  return `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Primary Meta Tags -->
    <title>${title}</title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${shareUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="Forgea" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${shareUrl}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- LinkedIn -->
    <meta property="og:type" content="article" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="https://storage.googleapis.com/gpt-engineer-file-uploads/Vu5fnn2kvLS97Pxzt508Mzp1VTn1/uploads/1761931305529-forgea-favicon-64.png">
    
    <!-- Redirect for real users (not bots) -->
    <script>
      // This script will only run for real browsers, not bots
      window.location.href = '${shareUrl}';
    </script>
    
    <!-- NoScript fallback -->
    <noscript>
      <meta http-equiv="refresh" content="0;url=${shareUrl}" />
    </noscript>
  </head>
  <body>
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
      <h1>🚀 ${title}</h1>
      <p>${description}</p>
      <p>
        <a href="${shareUrl}" style="display: inline-block; background: #ff7832; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Ver Build Completa →
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Você será redirecionado automaticamente em alguns segundos...
      </p>
    </div>
  </body>
</html>`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const userAgent = req.headers.get('user-agent') || '';
    const pathname = url.pathname;
    
    console.log('Received request:', { pathname, userAgent: userAgent.substring(0, 100) });
    
    // Extract session ID from URL
    const sessionId = extractSessionId(pathname);
    
    if (!sessionId) {
      console.log('No session ID found in URL');
      return new Response('Not Found', { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
    
    console.log('Processing session:', sessionId);
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    // Fetch quiz responses for this session
    const { data: responses, error: responsesError } = await supabase
      .from('quiz_responses')
      .select('question_text, selected_answer')
      .eq('session_id', sessionId)
      .order('question_number', { ascending: true });
    
    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return new Response('Error loading build data', { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
    
    // Fetch AI recommendation if available
    const { data: aiRec } = await supabase
      .from('ai_recommendations')
      .select('recommendation_text')
      .eq('session_id', sessionId)
      .maybeSingle();
    
    // Extract relevant data
    const budget = extractBudget(responses || []);
    const components = extractMainComponents(responses || []);
    
    // Get AI summary (first 200 chars of recommendation)
    const aiSummary = aiRec?.recommendation_text 
      ? aiRec.recommendation_text.substring(0, 200).replace(/[#*`]/g, '').trim()
      : undefined;
    
    console.log('Build data:', { budget, components, hasAI: !!aiSummary });
    
    // Check if request is from a social media bot
    const isBot = isSocialBot(userAgent);
    
    console.log('Is social bot:', isBot);
    
    if (isBot) {
      // Generate and return HTML with dynamic meta tags for bots
      const baseUrl = url.origin;
      const html = generateMetaTagsHTML(sessionId, budget, components, aiSummary, baseUrl);
      
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    } else {
      // For regular users, redirect to the React app
      const redirectUrl = `${url.origin}/build/${sessionId}`;
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl,
        },
      });
    }
    
  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
