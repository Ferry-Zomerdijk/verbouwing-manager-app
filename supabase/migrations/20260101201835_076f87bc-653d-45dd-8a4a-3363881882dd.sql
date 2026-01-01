-- Create enum for subscription status
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');

-- Create enum for subscription tier
CREATE TYPE subscription_tier AS ENUM ('free', 'basis', 'pro');

-- Create customers table to link Supabase users to Stripe customers
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create products table for Stripe products
CREATE TABLE public.products (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create prices table for Stripe prices
CREATE TABLE public.prices (
  id text NOT NULL PRIMARY KEY,
  product_id text REFERENCES public.products(id) ON DELETE CASCADE,
  active boolean DEFAULT true,
  currency text NOT NULL,
  unit_amount integer,
  interval text,
  interval_count integer DEFAULT 1,
  trial_period_days integer,
  type text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id text NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  customer_id text,
  price_id text REFERENCES public.prices(id),
  status subscription_status NOT NULL,
  tier subscription_tier NOT NULL DEFAULT 'free',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "Users can view their own customer record"
ON public.customers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customer record"
ON public.customers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all customers"
ON public.customers FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Products policies (public read)
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (active = true);

CREATE POLICY "Service role can manage products"
ON public.products FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Prices policies (public read)
CREATE POLICY "Anyone can view active prices"
ON public.prices FOR SELECT
USING (active = true);

CREATE POLICY "Service role can manage prices"
ON public.prices FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
ON public.subscriptions FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_stripe_id ON public.customers(stripe_customer_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_prices_product_id ON public.prices(product_id);

-- Create updated_at trigger for all new tables
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prices_updated_at
BEFORE UPDATE ON public.prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();