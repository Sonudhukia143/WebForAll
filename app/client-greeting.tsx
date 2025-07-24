'use client';
import { trpc } from '../trpc/client';

export function ClientGreeting() {
  const [data] = trpc.hello.useSuspenseQuery({ text: 'ClientGreeting' });


  // Uncomment the following lines to invoke the Inngest function
  // Note: This is commented out to avoid unnecessary API calls during component rendering.

  // it is working fine with gemini donot overuse the api as it will cost you
  // fetch('http://localhost:3000/api/users').then(async data => {
  //   console.log('Response from invokeFunc:',await data.json());
  // }).catch(err => {
  //   console.error('Error invoking function:', err);
  // });


  return (
    <div>
      <h1>Client Greeting</h1>
      <p>This is a client component that uses tRPC to fetch data.</p>
      {data.greeting}
    </div>
  );
}