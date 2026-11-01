"use client";
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ApplyRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  useEffect(() => {
    if (ref) {
      router.push(`/register?ref=${ref}`);
    } else {
      router.push('/register');
    }
  }, [ref, router]);

  return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase tracking-[0.4em]">Initializing Referral Link...</div>;
}

export default function ApplyPage() {
  return (
    <Suspense>
      <ApplyRedirect />
    </Suspense>
  );
}