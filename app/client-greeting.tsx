'use client';
import { trpc } from '../trpc/client';


export function ClientGreeting() {
  const [data] = trpc.hello.useSuspenseQuery({text: 'ClientGreeting'});
  
  return (
  <div>
    <h1>Client Greeting</h1>
    <p>This is a client component that uses tRPC to fetch data.</p>
    {data.greeting}
    </div>
  );
}