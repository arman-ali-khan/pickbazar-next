-- Create Categories Table
-- Use CASCADE to remove dependent objects like foreign keys before dropping the table.
DROP TABLE IF EXISTS public.categories CASCADE;

CREATE TABLE public.categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name character varying NOT NULL,
    slug character varying UNIQUE NOT NULL,
    description text,
    parent_id bigint REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS Policies for Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
    ON public.categories
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
CREATE POLICY "Authenticated users can manage categories"
    ON public.categories
    FOR ALL
    TO authenticated
    USING (true);
