import { Suspense } from 'react';
import MaojiClient from './MaojiClient';

export default function MaojiPage() {
  return (
    <Suspense fallback={null}>
      <MaojiClient />
    </Suspense>
  );
}
