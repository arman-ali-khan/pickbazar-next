import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Terms and Conditions</CardTitle>
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">1. Agreement to Terms</h2>
                <p>
                  By using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">2. Purchases</h2>
                <p>
                  If you wish to purchase any product or service made available through the Service ("Purchase"), you may be asked to supply certain information relevant to your Purchase including, without limitation, your credit card number, the expiration date of your credit card, your billing address, and your shipping information.
                </p>
              </section>
               <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">3. Content</h2>
                <p>
                  Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">4. Accounts</h2>
                <p>
                  When you create an account with us, you guarantee that you are above the age of 18, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">5. Links To Other Web Sites</h2>
                <p>
                 Our Service may contain links to third-party web sites or services that are not owned or controlled by Pickbazar. Pickbazar has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">6. Termination</h2>
                <p>
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">7. Governing Law</h2>
                <p>
                  These Terms shall be governed and construed in accordance with the laws of the jurisdiction, without regard to its conflict of law provisions.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
