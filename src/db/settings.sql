
-- Drop the function if it exists to allow for return type changes.
-- This is necessary because CREATE OR REPLACE FUNCTION cannot alter the return type.
DROP FUNCTION IF EXISTS get_all_settings();

-- Ensure the settings table exists
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Insert default settings if they don't exist.
-- This ensures that on repeated runs, we don't try to re-insert existing data.
INSERT INTO settings (key, value) VALUES
    ('site_title', 'Karwanbazar'),
    ('site_subtitle', 'Your one-stop shop for fresh groceries.'),
    ('logo_url', NULL),
    ('favicon_url', NULL),
    ('link_preview_image_url', NULL),
    ('meta_title', 'Karwanbazar - Fresh Groceries Delivered'),
    ('meta_description', 'High-quality fresh food and grocery delivery service.'),
    ('meta_tags', 'groceries, fresh food, delivery'),
    ('canonical_url', 'https://www.schoolbd.top'),
    ('og_title', 'PickbKarwanbazarazar - Fresh Groceries Delivered'),
    ('og_description', 'The best place to buy fresh food and groceries online.'),
    ('enable_cod', 'true'),
    ('enable_mobile_banking', 'true'),
    ('enable_card_payment', 'true'),
    ('enable_sslcommerz', 'false'),
    ('maintenance_mode', 'false'),
    ('maintenance_title', 'We''ll be back soon!'),
    ('maintenance_description', 'Sorry for the inconvenience but we''re performing some maintenance at the moment. We''ll be back online shortly!'),
    ('maintenance_cover_image_url', NULL),
    ('maintenance_end_date', NULL),
    ('enable_promo_popup', 'true')
ON CONFLICT (key) DO NOTHING;


-- Create the function to get all settings as a single JSON object
CREATE FUNCTION get_all_settings()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    settings_json json;
BEGIN
    SELECT json_object_agg(key, value)
    INTO settings_json
    FROM settings;

    RETURN settings_json;
END;
$$;
