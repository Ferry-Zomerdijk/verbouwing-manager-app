CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app settings" ON public.app_settings FOR SELECT USING (true);

INSERT INTO public.app_settings (key, value) VALUES ('pro_plan', jsonb_build_object(
  'name', 'Pro',
  'amount_cents', 999,
  'currency', 'eur',
  'interval', 'month',
  'price_id', 'price_1SktK8GzO5wk8qyVsW9NlTMb',
  'product_id', 'prod_TiJysg1CJilS1o',
  'known_price_ids', jsonb_build_array('price_1SktK8GzO5wk8qyVsW9NlTMb'),
  'terms', E'## Pro-abonnement\n\n- Het abonnement wordt maandelijks automatisch verlengd en vooraf gefactureerd.\n- Je kunt op elk moment opzeggen; je houdt Pro tot het einde van de lopende periode.\n- Facturen staan automatisch in de app onder Abonnement.\n- Er vindt geen restitutie plaats over een lopende periode.\n- Prijswijzigingen gelden alleen voor nieuwe abonnementen.'
));