-- 1. Create notifications table
-- This table will store all system notifications for the admin dashboard.
CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    type text,
    metadata jsonb
);

-- 2. Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies for 'notifications'
-- Admins should have full access to manage notifications.
DROP POLICY IF EXISTS "Allow admin full access to notifications" ON public.notifications;
CREATE POLICY "Allow admin full access to notifications"
ON public.notifications
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));


-- 4. Create function to generate a notification when a new order is placed
-- This function gets the customer's name and creates a notification record.
CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_name text;
BEGIN
  -- Check if the order was placed by a registered user
  IF NEW.user_id IS NOT NULL THEN
    -- Get the full name from the user's metadata
    SELECT raw_user_meta_data->>'full_name' INTO customer_name FROM auth.users WHERE id = NEW.user_id;
  END IF;

  -- If it's a guest or the user has no name, use the shipping details
  IF customer_name IS NULL THEN
    customer_name := NEW.shipping_details->>'firstName' || ' ' || NEW.shipping_details->>'lastName';
  END IF;

  -- Insert a new notification into the notifications table
  INSERT INTO public.notifications(title, message, link, type, metadata)
  VALUES (
    'New Order Received',
    'Order ' || NEW.order_number || ' placed by ' || customer_name,
    '/admin/orders/' || NEW.order_number,
    'new_order',
    jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number)
  );
  
  RETURN NEW;
END;
$$;

-- 5. Create a trigger that executes the function after a new order is inserted
DROP TRIGGER IF EXISTS on_new_order_create_notification ON public.orders;
CREATE TRIGGER on_new_order_create_notification
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.create_order_notification();


-- 6. Create an RPC function for the frontend to easily fetch notifications
CREATE OR REPLACE FUNCTION public.get_admin_notifications()
RETURNS TABLE (
    id bigint,
    title text,
    message text,
    link text,
    is_read boolean,
    created_at timestamptz,
    type text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    id,
    title,
    message,
    link,
    is_read,
    created_at,
    type
  FROM public.notifications
  ORDER BY created_at DESC;
$$;
