-- 1. Create the pages table if it doesn't exist
CREATE TABLE IF NOT EXISTS pages (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger to update the updated_at timestamp on any change
CREATE OR REPLACE FUNCTION handle_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
DROP TRIGGER IF EXISTS set_pages_updated_at ON pages;
CREATE TRIGGER set_pages_updated_at
BEFORE UPDATE ON pages
FOR EACH ROW
EXECUTE PROCEDURE handle_pages_updated_at();

-- 3. Enable Row Level Security (RLS)
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "Pages are publicly viewable" ON pages;
CREATE POLICY "Pages are publicly viewable" ON pages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage pages" ON pages;
CREATE POLICY "Admins can manage pages" ON pages FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super-admin'));

-- 5. Insert initial data if not present (ON CONFLICT prevents errors on re-runs)

-- About Page
INSERT INTO pages (slug, title, content)
VALUES ('about', 'About Us', '{
    "title": "About Pickbazar",
    "subtitle": "We are a team of passionate food lovers dedicated to bringing the freshest groceries right to your doorstep.",
    "missionTitle": "Our Mission",
    "missionText": "To provide our customers with the highest quality, freshest products sourced from local farms and trusted suppliers, all while offering a convenient and delightful shopping experience.",
    "teamTitle": "Meet Our Team",
    "team": [
        { "name": "John Doe", "role": "CEO & Founder", "bio": "John is passionate about bringing fresh, local produce to every household. His vision drives our mission." },
        { "name": "Jane Smith", "role": "Head of Operations", "bio": "Jane ensures that from farm to your door, every step is seamless, efficient, and meets our quality standards." },
        { "name": "Peter Jones", "role": "Lead Developer", "bio": "Peter is the mastermind behind our user-friendly platform, constantly innovating to improve your shopping experience." }
    ]
}') ON CONFLICT (slug) DO NOTHING;

-- Contact Page
INSERT INTO pages (slug, title, content)
VALUES ('contact', 'Contact Us', '{
    "address": "123 Green Grocer Lane, Farmville, FV 54321",
    "email": "support@pickbazar.com",
    "phone": "+1 (123) 456-7890"
}') ON CONFLICT (slug) DO NOTHING;

-- FAQ Page
INSERT INTO pages (slug, title, content)
VALUES ('faq', 'Frequently Asked Questions', '{
    "faqs": [
        { "question": "How does the delivery process work?", "answer": "We offer delivery within 90 minutes for most locations. Once you place an order, our system assigns it to the nearest delivery partner. You will receive a notification once your order is out for delivery." },
        { "question": "How do I track my order?", "answer": "You can track your order in real-time from the ''My Orders'' section of your account. You will also receive SMS and email updates at every stage of your order." },
        { "question": "What are the payment methods available?", "answer": "We accept all major credit and debit cards, as well as digital wallets like Apple Pay and Google Pay. Cash on Delivery (COD) is also available for select orders." },
        { "question": "What is your return policy?", "answer": "We have a no-questions-asked return policy for most items within 24 hours of delivery, provided the items are in their original packaging and condition. Please check the item description for specific return information." },
        { "question": "How do I contact customer support?", "answer": "You can reach our customer support team 24/7 via the \"Contact Us\" page, through the in-app chat, or by calling our toll-free number. We are always here to help!" }
    ]
}') ON CONFLICT (slug) DO NOTHING;

-- Privacy Policy Page
INSERT INTO pages (slug, title, content)
VALUES ('privacy-policy', 'Privacy Policy', '{
    "html": "<section><h2>1. Introduction</h2><p>Welcome to Pickbazar. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p></section><section><h2>2. Information We Collect</h2><p>We may collect personal identification information (Name, email address, phone number, etc.) and non-personal identification information (browser name, type of computer, etc.).</p></section><section><h2>3. How We Use Your Information</h2><p>We may use the information we collect from you to personalize your experience, to improve our website, to process transactions, and to send periodic emails.</p></section><section><h2>4. How We Protect Your Information</h2><p>We adopt appropriate data collection, storage and processing practices and security measures to protect against unauthorized access, alteration, disclosure or destruction of your personal information.</p></section><section><h2>5. Sharing Your Personal Information</h2><p>We do not sell, trade, or rent users personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates and advertisers.</p></section><section><h2>6. Changes to This Privacy Policy</h2><p>Pickbazar has the discretion to update this privacy policy at any time. When we do, we will revise the updated date at the top of this page. We encourage Users to frequently check this page for any changes to stay informed about how we are helping to protect the personal information we collect.</p></section><section><h2>7. Your Acceptance of These Terms</h2><p>By using this Site, you signify your acceptance of this policy. If you do not agree to this policy, please do not use our Site. Your continued use of the Site following the posting of changes to this policy will be deemed your acceptance of those changes.</p></section>"
}') ON CONFLICT (slug) DO NOTHING;

-- Terms and Conditions Page
INSERT INTO pages (slug, title, content)
VALUES ('terms-and-conditions', 'Terms & Conditions', '{
    "html": "<section><h2>1. Agreement to Terms</h2><p>By using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.</p></section><section><h2>2. Purchases</h2><p>If you wish to purchase any product or service made available through the Service (''Purchase''), you may be asked to supply certain information relevant to your Purchase including, without limitation, your credit card number, the expiration date of your credit card, your billing address, and your shipping information.</p></section><section><h2>3. Content</h2><p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material (''Content''). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.</p></section><section><h2>4. Accounts</h2><p>When you create an account with us, you guarantee that you are above the age of 18, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service.</p></section><section><h2>5. Links To Other Web Sites</h2><p>Our Service may contain links to third-party web sites or services that are not owned or controlled by Pickbazar. Pickbazar has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services.</p></section><section><h2>6. Termination</h2><p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p></section><section><h2>7. Governing Law</h2><p>These Terms shall be governed and construed in accordance with the laws of the jurisdiction, without regard to its conflict of law provisions.</p></section>"
}') ON CONFLICT (slug) DO NOTHING;
