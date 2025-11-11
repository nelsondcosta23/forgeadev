import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
}

// Generate fingerprint from request data
function generateFingerprint(ip: string, userAgent: string, sessionId?: string): string {
  const data = `${ip}:${userAgent}:${sessionId || 'anonymous'}`;
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Extract short code from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const shortCode = pathParts[pathParts.length - 1];

    if (!shortCode) {
      return new Response('Missing short code', { status: 400, headers: corsHeaders });
    }

    console.log('Processing click for short code:', shortCode);

    // Get request metadata
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const referer = req.headers.get('referer') || '';
    
    // Extract query parameters
    const sessionId = url.searchParams.get('session') || null;
    const source = url.searchParams.get('source') || 'direct';

    // Rate limiting
    if (!checkRateLimit(ip)) {
      console.log('Rate limit exceeded for IP:', ip);
      return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders });
    }

    // Fetch tracked link
    const { data: link, error: linkError } = await supabase
      .from('tracked_links')
      .select('*')
      .eq('short_code', shortCode)
      .eq('status', true)
      .maybeSingle();

    if (linkError || !link) {
      console.error('Link not found or inactive:', shortCode, linkError);
      return new Response('Link not found', { status: 404, headers: corsHeaders });
    }

    console.log('Found link:', link.destination_url);

    // Detect country from IP
    let countryCode = null;
    let countryName = null;
    
    try {
      const detectResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/detect-country`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({ ip }),
        }
      );

      if (detectResponse.ok) {
        const countryData = await detectResponse.json();
        countryCode = countryData.country_code;
        countryName = countryData.country_name;
        console.log('Detected country:', countryCode, countryName);
      }
    } catch (err) {
      console.error('Error detecting country:', err);
    }

    // Generate fingerprint for duplicate detection
    const fingerprint = generateFingerprint(ip, userAgent, sessionId || undefined);

    // Check for duplicate clicks (same fingerprint within 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentClick } = await supabase
      .from('clicks')
      .select('id')
      .eq('fingerprint', fingerprint)
      .eq('link_id', link.id)
      .gte('created_at', oneHourAgo)
      .maybeSingle();

    const isValid = !recentClick;
    const invalidReason = recentClick ? 'duplicate_click' : null;

    // Calculate cost (only for valid clicks)
    const cost = isValid ? (link.cpc_override || link.company_id ? 0.05 : 0) : 0;

    // Insert click record
    const { error: clickError } = await supabase
      .from('clicks')
      .insert({
        link_id: link.id,
        company_id: link.company_id,
        ip_address: ip,
        user_agent: userAgent,
        referer: referer,
        country_code: countryCode,
        country_name: countryName,
        session_id: sessionId,
        source: source,
        fingerprint: fingerprint,
        is_valid: isValid,
        invalid_reason: invalidReason,
        cost: cost,
      });

    if (clickError) {
      console.error('Error inserting click:', clickError);
    } else {
      console.log('Click recorded:', { isValid, cost, sessionId, source });
    }

    // Update tracked link counters
    const updates: any = {
      total_clicks: link.total_clicks + 1,
    };

    if (isValid) {
      updates.valid_clicks = link.valid_clicks + 1;
      updates.total_cost = parseFloat(link.total_cost) + cost;
    } else {
      updates.invalid_clicks = link.invalid_clicks + 1;
    }

    const { error: updateError } = await supabase
      .from('tracked_links')
      .update(updates)
      .eq('id', link.id);

    if (updateError) {
      console.error('Error updating link counters:', updateError);
    }

    // Redirect to destination URL
    console.log('Redirecting to:', link.destination_url);
    return Response.redirect(link.destination_url, 302);

  } catch (error) {
    console.error('Error in track-click function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
