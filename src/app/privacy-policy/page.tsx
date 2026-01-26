
import type { Metadata } from 'next';
import Header from '@/components/header';
import CartDrawer from '@/components/cart-drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from('pages').select('title').eq('slug', 'privacy-policy').single();

  const pageTitle = data?.title || 'Privacy Policy';

  return {
    title: pageTitle,
  };
}

export default async function PrivacyPolicyPage() {
  const supabase = createClient();
  const { data } = await supabase.from('pages').select('title, content, updated_at').eq('slug', 'privacy-policy').single();

  if (!data) {
    notFound();
  }
  
  const pageContent = data.content as { html: string };

  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
<<<<<<< HEAD
      <main className="container py-12">
=======
      <main className="container mx-auto py-12">
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{data.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(data.updated_at).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent>
              <div
                className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: pageContent.html }}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <CartDrawer />
    </div>
  );
}
