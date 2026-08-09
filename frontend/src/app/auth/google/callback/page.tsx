'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { CredoraLogo } from '../../../../components/CredoraLogo';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogleToken } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      router.push('/login?error=google_failed');
      return;
    }

    const finishAuth = async () => {
      try {
        await loginWithGoogleToken(token);
        router.push('/borrower/loans');
      } catch (err: any) {
        console.error('[Google Callback Error]:', err);
        setErrorMsg('Google authentication verification failed. Redirecting to login...');
        setTimeout(() => {
          router.push('/login?error=google_failed');
        }, 2000);
      }
    };

    finishAuth();
  }, [searchParams, loginWithGoogleToken, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 flex flex-col items-center">
        <CredoraLogo showTagline={false} size="lg" />

        {errorMsg ? (
          <div className="bg-rose-950/60 border border-rose-900 text-rose-300 p-4 rounded-2xl text-xs font-bold w-full">
            {errorMsg}
          </div>
        ) : (
          <div className="space-y-4 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-3 border-credora-500 border-t-transparent animate-spin" />
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Authenticating with Google...
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Verifying institutional credit credentials & logging into Credora
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="w-8 h-8 rounded-full border-2 border-credora-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
