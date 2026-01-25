-- Create the settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.handle_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists to avoid errors on re-run, then create it
DROP TRIGGER IF EXISTS on_settings_updated ON public.settings;
CREATE TRIGGER on_settings_updated
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_settings_updated_at();


-- Insert default values for all settings, ignoring conflicts if they already exist
INSERT INTO public.settings (key, value) VALUES
    ('site_title', 'Pickbazar'),
    ('site_subtitle', 'An e-commerce storefront for fresh products.'),
    ('logo_url', NULL),
    ('favicon_url', NULL),
    ('link_preview_image_url', NULL),
    ('meta_title', 'Pickbazar - Fresh Groceries Delivered'),
    ('meta_description', 'Shop for fresh groceries and get them delivered to your doorstep in 90 minutes.'),
    ('meta_tags', 'groceries, fresh food, delivery'),
    ('canonical_url', 'https://pickbazar.com'),
    ('og_title', 'Pickbazar: Groceries delivered fast.'),
    ('og_description', 'The fastest grocery delivery service in town.'),
    ('enable_cod', 'true'),
    ('enable_mobile_banking', 'true'),
    ('enable_card_payment', 'true'),
    ('enable_sslcommerz', 'false'),
    ('maintenance_mode', 'false'),
    ('maintenance_title', 'We''ll be back soon!'),
    ('maintenance_description', 'Sorry for the inconvenience. We''re performing some maintenance at the moment.'),
    ('maintenance_cover_image_url', NULL),
    ('maintenance_end_date', NULL),
    ('enable_promo_popup', 'true')
ON CONFLICT (key) DO NOTHING;


-- Function to get all settings as a single JSON object
CREATE OR REPLACE FUNCTION get_all_settings()
RETURNS json
LANGUAGE sql
AS $$
  SELECT json_object_agg(key, value)
  FROM settings;
$$;
