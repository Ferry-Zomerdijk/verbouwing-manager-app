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

    let extractedData;

    // Use OCR.space API for PDF text extraction
    if (mimeType === 'application/pdf') {
      console.log('Extracting text from PDF...');
      
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);

      // Use OCR.space free API for PDF text extraction
      const formData = new FormData();
      formData.append('base64Image', `data:${mimeType};base64,${base64}`);
      formData.append('isOverlayRequired', 'false');
      formData.append('filetype', 'PDF');

      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': 'helloworld', // Free API key
        },
        body: formData,
      });

      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        console.error('OCR error:', ocrResponse.status, errorText);
        throw new Error('PDF text extractie mislukt');
      }

      const ocrResult = await ocrResponse.json();
      console.log('OCR result:', JSON.stringify(ocrResult).substring(0, 200));

      // Check if we have any extracted text - partial success (page limit reached) is OK
      const extractedTextResult = ocrResult.ParsedResults?.[0]?.ParsedText;
      if (!extractedTextResult || extractedTextResult.trim().length === 0) {
        console.error('OCR processing error:', ocrResult.ErrorMessage || ocrResult.ErrorDetails);
        throw new Error('Kon geen tekst extraheren uit PDF');
      }
      
      if (ocrResult.ErrorMessage) {
        console.log('OCR warning (continuing with partial text):', ocrResult.ErrorMessage);
      }

      const extractedText = extractedTextResult;
      console.log('Extracted text length:', extractedText.length);

      // Analyze extracted text with AI
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
              content: `Analyseer deze factuur tekst en extraheer de volgende informatie. Geef het antwoord via de extract_invoice_data functie.

Factuur tekst:
${extractedText}`
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
        console.error('AI analysis error:', response.status, errorText);
        
        if (response.status === 429) {
          throw new Error('Te veel aanvragen. Probeer het later opnieuw.');
        }
        if (response.status === 402) {
          throw new Error('AI credits zijn op. Voeg credits toe in Lovable.');
        }
        
        throw new Error('AI analyse mislukt');
      }

      const aiResponse = await response.json();
      const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        throw new Error('Geen gestructureerde data ontvangen van AI');
      }

      extractedData = JSON.parse(toolCall.function.arguments);

    } else {
      // Use Vision API for images
      console.log('Processing image with Vision API...');
      
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);
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