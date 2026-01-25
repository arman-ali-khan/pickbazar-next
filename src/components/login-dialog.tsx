'use client';

import { useState } from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, Eye, EyeOff, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from '@/lib/supabase/provider';


type View = 'login' | 'register' | 'forgotPassword';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-7.9z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);


export function LoginDialog() {
  const [view, setView] = useState<View>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { supabase } = useSupabase();
  const router = useRouter();
  const { toast } = useToast();

  const togglePassword = () => setShowPassword(prev => !prev);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    } else {
      toast({ title: 'Login Successful', description: "Welcome back!" });
      router.refresh();
    }
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
    } else {
      toast({ title: 'Registration Pending', description: "Please check your email to confirm your account." });
      setView('login');
    }
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${location.origin}/auth/callback?next=${window.location.pathname}`,
        }
    });
    if (error) {
        toast({ variant: "destructive", title: "Google Login Failed", description: error.message });
    }
    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ variant: "destructive", title: "Error", description: "Please enter your email address." });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback?next=/profile/change-password`,
    });
    if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
        toast({ title: "Password Reset Email Sent", description: "Check your inbox for a link to reset your password." });
        setView('login');
    }
    setIsSubmitting(false);
  };

  const headerContent: Record<View, {title: string, description: React.ReactNode}> = {
    login: {
      title: 'PickBazar',
      description: 'Login with your email & password',
    },
    register: {
      title: 'PickBazar',
      description: (
        <>
          By signing up, you agree to our{' '}
          <Button variant="link" asChild className="p-0 h-auto text-primary">
            <Link href="/terms-and-conditions">terms</Link>
          </Button>
          {' '}&{' '}
          <Button variant="link" asChild className="p-0 h-auto text-primary">
             <Link href="/privacy-policy">policy</Link>
          </Button>
        </>
      )
    },
    forgotPassword: {
      title: 'Forgot Password',
      description: 'We will send you a link to reset your password',
    },
  };

  const currentHeader = headerContent[view];

  return (
    <DialogContent className="sm:max-w-md p-8">
      <DialogHeader className="items-center text-center mb-4">
        <Link href="/" className="flex items-center gap-2 mb-2">
          <Leaf className="h-7 w-7 text-primary" />
          <DialogTitle className="text-2xl font-bold text-gray-800">{currentHeader.title}</DialogTitle>
        </Link>
        <DialogDescription>
          {currentHeader.description}
        </DialogDescription>
      </DialogHeader>
      
      {view === 'login' && (
         <form onSubmit={handleLogin}>
            <div className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="customer@demo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    <Button variant="link" size="sm" type="button" className="h-auto p-0 text-xs text-primary" onClick={() => setView('forgotPassword')}>
                        Forgot password?
                    </Button>
                </div>
                <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-500"
                    onClick={togglePassword}
                    >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                </div>
                <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
            </div>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
            </div>
            <div className="space-y-3">
                <Button type="button" variant="outline" className="w-full h-12 bg-[#4285F4] text-white hover:bg-[#4285F4]/90 hover:text-white border-transparent" onClick={handleGoogleLogin} disabled={isSubmitting}>
                    <GoogleIcon />
                    Login with Google
                </Button>
                <Button type="button" variant="outline" className="w-full h-12 bg-gray-600 text-white hover:bg-gray-700 hover:text-white border-transparent" disabled>
                    <Smartphone className="h-5 w-5 mr-2" />
                    Login with Mobile number
                </Button>
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have any account?{' '}
                <Button variant="link" type="button" className="p-0 h-auto font-semibold text-primary" onClick={() => setView('register')}>
                    Register
                </Button>
            </p>
        </form>
      )}

      {view === 'register' && (
        <form onSubmit={handleRegister}>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                        <Input id="register-password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-500"
                          onClick={togglePassword}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                    {isSubmitting ? 'Registering...' : 'Register'}
                </Button>
            </div>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
            </div>
            <p className="mt-2 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button variant="link" type="button" className="p-0 h-auto font-semibold text-primary" onClick={() => setView('login')}>
                    Login
                </Button>
            </p>
        </form>
      )}

      {view === 'forgotPassword' && (
         <form onSubmit={handleForgotPassword}>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input id="forgot-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Submit'}
                </Button>
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
                <Button variant="link" type="button" className="p-0 h-auto font-semibold text-primary" onClick={() => setView('login')}>
                    Back to login
                </Button>
            </p>
        </form>
      )}

    </DialogContent>
  );
}
