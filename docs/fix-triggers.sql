-- Trigger function for the 'pages' table
CREATE OR REPLACE FUNCTION handle_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the old trigger if it exists, then create the new one for 'pages'
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
DROP TRIGGER IF EXISTS set_pages_updated_at ON pages;
CREATE TRIGGER set_pages_updated_at
BEFORE UPDATE ON pages
FOR EACH ROW
EXECUTE PROCEDURE handle_pages_updated_at();

-- Trigger function for the 'refunds' table
CREATE OR REPLACE FUNCTION handle_refunds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the old trigger if it exists, then create the new one for 'refunds'
DROP TRIGGER IF EXISTS update_refunds_updated_at ON refunds;
DROP TRIGGER IF EXISTS set_refunds_updated_at ON refunds;
CREATE TRIGGER set_refunds_updated_at
BEFORE UPDATE ON refunds
FOR EACH ROW
EXECUTE PROCEDURE handle_refunds_updated_at();

-- Additionally, ensure the 'refunds' table has the column.
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
