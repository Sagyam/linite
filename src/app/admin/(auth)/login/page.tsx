'use client';

import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github } from 'lucide-react';

export default function AdminLoginPage() {
  const handleGithubSignIn = async () => {
    await signIn.social({
      provider: 'github',
      callbackURL: '/admin',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Linite Admin</CardTitle>
          <CardDescription>Sign in with GitHub to manage applications</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGithubSignIn}
            className="w-full gap-2"
            size="lg"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Only authorized administrators can access this panel
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
