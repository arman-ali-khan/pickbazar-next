'use client';

import { initializeFirebase, FirebaseProvider } from '@/firebase';

export const FirebaseClientProvider = ({ children }: { children: React.ReactNode }) => {
  const firebase = initializeFirebase();
  return <FirebaseProvider value={firebase}>{children}</FirebaseProvider>;
};
