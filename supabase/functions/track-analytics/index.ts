import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsEvent {
  event_type: string;
  page_path: string;
  page_title?: string;
  referrer?: string;
  user_agent?: string;
  country_code?: string;
  country_name?: string;
  language?: string;
  session_id: string;
  user_id?: string;
  metadata?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const event: AnalyticsEvent = await req.json();
    
    console.log('Tracking analytics event:', event.event_type, 'for page:', event.page_path);

    // Insert event
    const { error: eventError } = await supabase
      .from('analytics_events')
      .insert([event]);

    if (eventError) {
      console.error('Error inserting event:', eventError);
      throw eventError;
    }

    // Update or create session
    if (event.event_type === 'pageview') {
      // Check if session exists
      const { data: existingSession } = await supabase
        .from('analytics_sessions')
        .select('*')
        .eq('session_id', event.session_id)
        .maybeSingle();

      if (existingSession) {
        // Update existing session
        const { error: updateError } = await supabase
          .from('analytics_sessions')
          .update({
            last_page: event.page_path,
            pages_viewed: existingSession.pages_viewed + 1,
            is_bounce: false, // More than one page = not a bounce
            ended_at: new Date().toISOString(),
          })
          .eq('session_id', event.session_id);

        if (updateError) {
          console.error('Error updating session:', updateError);
        }
      } else {
        // Create new session
        const { error: insertError } = await supabase
          .from('analytics_sessions')
          .insert([{
            session_id: event.session_id,
            first_page: event.page_path,
            last_page: event.page_path,
            country_code: event.country_code,
            country_name: event.country_name,
            language: event.language,
            pages_viewed: 1,
            is_bounce: true, // Will be updated if more pages viewed
          }]);

        if (insertError) {
          console.error('Error creating session:', insertError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in track-analytics function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
