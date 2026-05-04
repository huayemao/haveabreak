import FrameLayoutClient from './FrameLayoutClient';
import { Suspense } from 'react';

export default async function FrameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <FrameLayoutClient>
        {children}
      </FrameLayoutClient>
    </Suspense>
  );
}
