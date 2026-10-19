import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";
import { isOwnInvoicePath } from "./pathCheck.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tier limits configuration (keep in sync with frontend)
const TIER_LIMITS: Record<string, number> = {
  free: 0,
  basis: 10,
  pro: -1, // unlimited
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    
    if (!filePath) {
      throw new Error('filePath is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Niet ingelogd' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Niet ingelogd' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bind the requested file to the caller: invoice uploads live under `${user.id}/...`
    if (!isOwnInvoicePath(filePath, user.id)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Geen toegang tot dit bestand' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing invoice for user:', user.id);

    // Check subscription tier and usage limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const tier = subscription?.tier || 'free';
    const limit = TIER_LIMITS[tier] ?? 0;

    console.log('User tier:', tier, 'Limit:', limit);

    // Check if user can use AI
    if (limit === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI factuurscanning is niet beschikbaar in het gratis abonnement. Upgrade naar Basis of Pro.',
          requiresUpgrade: true,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check usage limit (if not unlimited)
    if (limit !== -1) {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count } = await supabase
        .from('ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('usage_type', 'invoice_scan')
        .gte('created_at', firstDayOfMonth);

      const currentUsage = count || 0;
      
      if (currentUsage >= limit) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Je hebt de maandelijkse limiet van ${limit} AI scans bereikt. Upgrade naar Pro voor onbeperkte scans.`,
            requiresUpgrade: true,
            currentUsage,
            limit,
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Current usage:', currentUsage, 'of', limit);
    }

    // Download file from storage
    console.log('Downloading file:', filePath);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('invoices')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    const mimeType = fileData.type || 'application/pdf';
    const fileSize = fileData.size;
    console.log('File info:', { mimeType, fileSize });

    // Helper function to convert ArrayBuffer to base64 without stack overflow
    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      return btoa(binary);
    };

    // Send file directly to Gemini Vision API (works for both PDF and images)
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log('Sending to Gemini Vision API...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyseer deze factuur/bon en extraheer de volgende informatie. Geef het antwoord via de extract_invoice_data functie.`
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_invoice_data",
              description: "Extract structured data from an invoice",
              parameters: {
                type: "object",
                properties: {
                  bedrag: { type: "number", description: "Total amount including VAT" },
                  leverancier: { type: "string", description: "Supplier name" },
                  beschrijving: { type: "string", description: "Short description of products/services" },
                  datum: { type: "string", description: "Invoice date in YYYY-MM-DD format" }
                },
                required: ["bedrag", "leverancier", "beschrijving", "datum"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_invoice_data" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Te veel aanvragen. Probeer het later opnieuw.');
      }
      if (response.status === 402) {
        throw new Error('AI credits zijn op. Voeg credits toe in Lovable.');
      }
      
      throw new Error('AI verwerking mislukt');
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('Geen gestructureerde data ontvangen van AI');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    
    console.log('Extracted data:', extractedData);

    // Log AI usage after successful processing
    const { error: usageError } = await supabase
      .from('ai_usage')
      .insert({
        user_id: user.id,
        usage_type: 'invoice_scan',
        metadata: {
          filePath,
          tier,
        }
      });

    if (usageError) {
      console.error('Failed to log AI usage:', usageError);
      return new Response(
        JSON.stringify({ success: false, error: 'Kon AI gebruik niet vastleggen' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('AI usage logged successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in process-invoice function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Er is een fout opgetreden bij het verwerken van de factuur'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
