-- Drop existing policies, triggers, and functions to avoid conflicts.
-- The CASCADE option will automatically drop dependent objects.

-- Drop policies
DROP POLICY IF EXISTS "Allow admin full access to settings" ON public.settings;
DROP POLICY IF EXISTS "Allow admin update for settings" ON public.settings;
DROP POLICY IF EXISTS "Allow admin delete for contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admin update for contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admin select for contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admin full access" ON public.reviews;
DROP POLICY IF EXISTS "Allow admin full access to questions" ON public.questions;
DROP POLICY IF EXISTS "Allow admin full access" ON public.refunds;
DROP POLICY IF EXISTS "Allow user to cancel own pending refund" ON public.refunds;
DROP POLICY IF EXISTS "Allow admin to update roles" ON public.profiles;

-- Drop triggers
DROP TRIGGER IF EXISTS on_new_order ON public.orders;
DROP TRIGGER IF EXISTS on_new_review ON public.reviews;
DROP TRIGGER IF EXISTS on_new_message ON public.contact_messages;
DROP TRIGGER IF EXISTS on_new_question ON public.questions;

-- Drop functions (in reverse order of dependency if needed, but CASCADE helps)
DROP FUNCTION IF EXISTS public.is_admin(p_user_id uuid);
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.create_order_notification();
DROP FUNCTION IF EXISTS public.create_review_notification();
DROP FUNCTION IF EXISTS public.create_message_notification();
DROP FUNCTION IF EXISTS public.create_question_notification();
DROP FUNCTION IF EXISTS public.get_admin_notifications();

-- Drop tables that will be recreated or might have issues
DROP TABLE IF EXISTS public.notifications;

-- 1. NOTIFICATIONS TABLE
-- Stores notifications for admin users.
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Can be null for system-wide notifications
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    type TEXT, -- e.g., 'new_order', 'new_review'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. RLS for Notifications Table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin full access to notifications" ON notifications
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- 3. NOTIFICATION HELPER FUNCTIONS & TRIGGERS

-- Function to create notification on new order
CREATE OR REPLACE FUNCTION create_order_notification()
RETURNS TRIGGER AS $$
DECLARE
    order_data RECORD;
BEGIN
    SELECT * INTO order_data FROM orders WHERE id = NEW.id;
    INSERT INTO notifications (title, message, link, type)
    VALUES (
        'New Order Received!',
        'Order ' || order_data.order_number || ' has been placed for $' || order_data.total_amount,
        '/admin/orders/' || order_data.order_number,
        'new_order'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new orders
CREATE TRIGGER on_new_order
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_order_notification();

-- Function to create notification on new review
CREATE OR REPLACE FUNCTION create_review_notification()
RETURNS TRIGGER AS $$
DECLARE
    product_name_text TEXT;
BEGIN
    SELECT name INTO product_name_text FROM products WHERE id = NEW.product_id;
    INSERT INTO notifications (title, message, link, type)
    VALUES (
        'New Review Submitted',
        'A new ' || NEW.rating || '-star review for "' || product_name_text || '" is pending approval.',
        '/admin/reviews',
        'new_review'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new reviews
CREATE TRIGGER on_new_review
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION create_review_notification();

-- Function to create notification on new message
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (title, message, link, type)
    VALUES (
        'New Contact Message',
        'From: ' || NEW.name || ' - Subject: ' || NEW.subject,
        '/admin/messages/view/' || NEW.id,
        'new_message'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new messages
CREATE TRIGGER on_new_message
    AFTER INSERT ON contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION create_message_notification();
    
-- Function to create notification on new question
CREATE OR REPLACE FUNCTION create_question_notification()
RETURNS TRIGGER AS $$
DECLARE
    product_name_text TEXT;
BEGIN
    SELECT name INTO product_name_text FROM products WHERE id = NEW.product_id;

    INSERT INTO notifications (title, message, link, type)
    VALUES (
        'New Question Asked',
        'A new question was asked about "' || product_name_text || '".',
        '/admin/questions',
        'new_question'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new questions
CREATE TRIGGER on_new_question
    AFTER INSERT ON questions
    FOR EACH ROW
    EXECUTE FUNCTION create_question_notification();

-- 4. RPC FUNCTION to get notifications
CREATE OR REPLACE FUNCTION get_admin_notifications()
RETURNS TABLE(
    id BIGINT,
    title TEXT,
    message TEXT,
    link TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    type TEXT
) AS $$
BEGIN
    IF is_admin(auth.uid()) THEN
        RETURN QUERY
        SELECT 
            n.id,
            n.title,
            n.message,
            n.link,
            n.is_read,
            n.created_at,
            n.type
        FROM notifications n
        ORDER BY n.created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create policies that were dropped
CREATE POLICY "Allow admin full access to settings" ON public.settings FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Allow admin update for settings" ON public.settings FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Allow admin delete for contact messages" ON public.contact_messages FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Allow admin update for contact messages" ON public.contact_messages FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Allow admin select for contact messages" ON public.contact_messages FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Allow admin full access" ON public.reviews FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow admin full access to questions" ON public.questions FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow admin full access" ON public.refunds FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow user to cancel own pending refund" ON public.refunds FOR DELETE USING (((auth.uid() = user_id) AND (status = 'Pending'::text)));
CREATE POLICY "Allow admin to update roles" ON public.profiles FOR UPDATE USING ((get_my_role() = 'super-admin'::text));
