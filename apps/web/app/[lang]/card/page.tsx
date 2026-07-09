import CardPageClient from '@haveabreak/card/components/CardPageClient';
import { Suspense } from 'react';

export default async function CardPage() {
  return (
    <Suspense fallback={null}>
      <CardPageClient />
    </Suspense>
  );
}
