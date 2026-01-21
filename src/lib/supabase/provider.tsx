'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './client';
import type { SupabaseClient, User } from '@supabase/supabase-js';

type SupabaseContextType = {
  supabase: SupabaseClient;
  user: User | null;
  loading: boolean;
};

const Context = createContext<SupabaseContextType | undefined>(undefined);

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
    const [supabase] = useState(() => createClient());
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    return (
        <Context.Provider value={{ supabase, user, loading }}>
            {children}
        </Context.Provider>
    );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
