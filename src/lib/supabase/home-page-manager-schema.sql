-- Create home_page_sections table
CREATE TABLE IF NOT EXISTS public.home_page_sections (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL UNIQUE REFERENCES public.categories(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL
);

-- Enable RLS
ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;

-- Policies for home_page_sections
DROP POLICY IF EXISTS "Public can view home page sections" ON public.home_page_sections;
CREATE POLICY "Public can view home page sections" ON public.home_page_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin users can manage home page sections" ON public.home_page_sections;
CREATE POLICY "Admin users can manage home page sections" ON public.home_page_sections FOR ALL
USING (true)
WITH CHECK (true);


-- Function to update home page sections
CREATE OR REPLACE FUNCTION public.update_home_sections(sections_data JSONB)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- First, clear out the existing sections
    TRUNCATE TABLE public.home_page_sections;

    -- Then, insert the new sections from the JSON data
    INSERT INTO public.home_page_sections (category_id, display_order)
    SELECT
        (value->>'category_id')::INTEGER,
        (value->>'display_order')::INTEGER
    FROM jsonb_array_elements(sections_data);
END;
$$;
