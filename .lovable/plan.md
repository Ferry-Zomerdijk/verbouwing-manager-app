

# Fix: PDF factuurverwerking faalt bij bestanden groter dan 1 MB

## Probleem

De `process-invoice` edge function gebruikt OCR.space met de gratis API key (`helloworld`), die een **maximale bestandsgrootte van 1024 KB** heeft. Facturen groter dan 1 MB falen altijd.

## Oplossing

Elimineer de OCR.space dependency volledig. Gemini 2.5 Flash ondersteunt native PDF-verwerking via de Vision API (base64 encoded). We sturen PDFs rechtstreeks als base64 image naar Gemini, net zoals we dat al doen voor afbeeldingen. Dit verwijdert de bestandsgrootte-beperking en de afhankelijkheid van een externe OCR-service.

## Wijziging

### `supabase/functions/process-invoice/index.ts`

De PDF-branch (regels 148-254) wordt vervangen. In plaats van OCR.space + tekst-analyse, sturen we de PDF direct als base64 data URL naar Gemini Vision, identiek aan de image-branch:

- Verwijder de hele OCR.space sectie (FormData, fetch naar ocr.space, text extraction)
- Stuur de PDF als `data:application/pdf;base64,...` naar de Gemini Vision API
- Gebruik hetzelfde tool-calling patroon als bij afbeeldingen
- De twee branches (PDF en image) worden samengevoegd tot een enkele flow aangezien de aanroep identiek is

Dit lost het probleem op voor alle bestandsgroottes en maakt de code eenvoudiger.

