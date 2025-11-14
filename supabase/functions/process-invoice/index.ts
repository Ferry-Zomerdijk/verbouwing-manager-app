import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    let extractedData;

    // Use Document Parse API for PDFs
    if (mimeType === 'application/pdf') {
      console.log('Processing PDF with Document Parse API...');
      
      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(filePath);

      const parseResponse = await fetch('https://api.lovable.app/document-parse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_url: publicUrl,
          extract_tables: true,
          extract_text: true
        })
      });

      if (!parseResponse.ok) {
        const errorText = await parseResponse.text();
        console.error('Document Parse error:', parseResponse.status, errorText);
        throw new Error('Document parsing failed');
      }

      const parseResult = await parseResponse.json();
      console.log('Document parsed successfully');
      
      // Extract data from parsed document using AI
      const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: `Analyseer deze factuur tekst en extraheer de volgende informatie:

${parseResult.text || parseResult.content}

Geef het antwoord via de extract_invoice_data functie.`
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

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('AI Analysis error:', analysisResponse.status, errorText);
        
        if (analysisResponse.status === 429) {
          throw new Error('Te veel aanvragen. Probeer het later opnieuw.');
        }
        if (analysisResponse.status === 402) {
          throw new Error('AI credits zijn op. Voeg credits toe in Lovable.');
        }
        
        throw new Error('AI analyse mislukt');
      }

      const aiResponse = await analysisResponse.json();
      const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        throw new Error('Geen gestructureerde data ontvangen van AI');
      }

      extractedData = JSON.parse(toolCall.function.arguments);

    } else {
      // Use Vision API for images
      console.log('Processing image with Vision API...');
      
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const dataUrl = `data:${mimeType};base64,${base64}`;

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
                  image_url: {
                    url: dataUrl
                  }
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

      extractedData = JSON.parse(toolCall.function.arguments);
    }
    
    console.log('Extracted data:', extractedData);

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