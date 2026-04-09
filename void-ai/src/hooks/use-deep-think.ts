'use client';

import { useState } from 'react';

export type DepthLevel = 'quick' | 'deep' | 'exhaustive';

const DEPTH_LABELS: Record<DepthLevel, string> = {
  quick: 'Quick',
  deep: 'Deep',
  exhaustive: 'Exhaustive',
};

export function useDeepThink() {
  const [depth, setDepth] = useState<DepthLevel>('quick');

  return {
    depth,
    setDepth,
    DEPTH_LABELS,
  };
}
