'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProProfile() {
  const router = useRouter();
  useEffect(() => { router.push('/pro/dashboard'); }, [router]);
  return null;
}
