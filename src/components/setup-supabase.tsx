import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import Link from "next/link";

export function SetupSupabase() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Welcome to Your Pickbazar App!</CardTitle>
          <CardDescription>
            Just one more step to get started. You need to connect your Supabase database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Action Required: Configure Supabase Credentials</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                To connect your application to your database, please update the following file with your Supabase URL and anonymous key:
              </p>
              <pre className="p-2 my-2 bg-muted/80 rounded text-sm font-mono text-foreground">
                src/lib/supabase/config.ts
              </pre>
              <p>
                You can find these keys in your Supabase project settings under "API". For more information, visit the{" "}
                <Link href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                  Supabase API settings page
                </Link>
                .
              </p>
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            Once you have added your credentials, this page will automatically update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
