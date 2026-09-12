export type SyncStrategy = 'merge' | 'overwrite';

export type SubscriptionStatus = 'idle' | 'checking' | 'has_update' | 'up_to_date' | 'error';

export type DiffAction = 'add' | 'update' | 'delete';

export interface Subscription {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  lastCheckTime?: number;
  lastUpdateTime?: number;
  syncStrategy?: SyncStrategy;
  status?: SubscriptionStatus;
  itemCount?: number;
  errorMessage?: string;
}

export interface DiffItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  categoryLabel?: string;
  action: DiffAction;
  data: any;
}

export interface SubscriptionDiff {
  subscriptionId: string;
  subscriptionName: string;
  items: DiffItem[];
  counts: {
    added: number;
    updated: number;
    deleted: number;
    total: number;
  };
  timestamp: number;
  rawRemoteData?: any;
}

export interface SubscriptionValidationResult {
  valid: boolean;
  summary?: string;
  itemCount?: number;
  error?: string;
  data?: any;
}
