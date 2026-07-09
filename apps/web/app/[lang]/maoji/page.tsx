import { Suspense } from 'react';
import MaojiClient from '@haveabreak/maoji/components/MaojiClient';

export default function MaojiPage() {
  return (
    <Suspense fallback={null}>
      <MaojiClient />
    </Suspense>
  );
}
