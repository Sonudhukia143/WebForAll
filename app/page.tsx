import { Suspense } from 'react';
import { ClientGreeting } from './client-greeting';
import { HydrateClient } from '@/trpc/server';
import { trpc } from '../trpc/server';

export default async function Home() {
  void trpc.hello.prefetch({text: 'ClientGreeting'});
  
  return (
        <Suspense fallback={<div>Loading...</div>}>
          <ClientGreeting />
        </Suspense>
  );
}