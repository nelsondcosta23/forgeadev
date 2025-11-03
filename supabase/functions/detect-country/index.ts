const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from request headers
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    console.log('Detecting country for IP:', clientIp);

    // Use ip-api.com to get country information (free, no API key needed)
    const response = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,countryCode`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch geolocation data');
    }

    const data = await response.json();

    if (data.status === 'fail') {
      return new Response(
        JSON.stringify({ 
          country_code: null, 
          country_name: null,
          error: 'Could not detect country'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({
        country_code: data.countryCode,
        country_name: data.country,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error detecting country:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        country_code: null, 
        country_name: null,
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
