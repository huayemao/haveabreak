import { DiffItem, SubscriptionDiff, SyncStrategy } from './subscriptionTypes';

export async function fetchSubscriptionJson(url: string, timeoutMs = 15000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText || 'Failed to fetch'}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Remote response is not valid JSON');
    }
  } finally {
    clearTimeout(timer);
  }
}

export interface DiffCategoryOptions<T extends { id: string; createdAt?: number; updatedAt?: number }> {
  category: string;
  categoryLabel?: string;
  localItems: T[];
  remoteItems: T[];
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => string;
  strategy?: SyncStrategy;
  isUpdated?: (local: T, remote: T) => boolean;
}

export function computeCategoryDiff<T extends { id: string; createdAt?: number; updatedAt?: number }>(
  options: DiffCategoryOptions<T>
): DiffItem[] {
  const {
    category,
    categoryLabel,
    localItems,
    remoteItems,
    getTitle,
    getSubtitle,
    strategy = 'merge',
    isUpdated,
  } = options;

  const diffItems: DiffItem[] = [];
  const localMap = new Map<string, T>(localItems.map(item => [item.id, item]));
  const remoteMap = new Map<string, T>(remoteItems.map(item => [item.id, item]));

  // Check remote items against local
  remoteItems.forEach(remoteItem => {
    const localItem = localMap.get(remoteItem.id);
    if (!localItem) {
      diffItems.push({
        id: remoteItem.id,
        title: getTitle(remoteItem),
        subtitle: getSubtitle ? getSubtitle(remoteItem) : undefined,
        category,
        categoryLabel,
        action: 'add',
        data: remoteItem,
      });
    } else {
      let hasUpdate = false;
      if (isUpdated) {
        hasUpdate = isUpdated(localItem, remoteItem);
      } else {
        const localTime = localItem.updatedAt || localItem.createdAt || 0;
        const remoteTime = remoteItem.updatedAt || remoteItem.createdAt || 0;
        hasUpdate = remoteTime > localTime;
      }

      if (hasUpdate) {
        diffItems.push({
          id: remoteItem.id,
          title: getTitle(remoteItem),
          subtitle: getSubtitle ? getSubtitle(remoteItem) : undefined,
          category,
          categoryLabel,
          action: 'update',
          data: remoteItem,
        });
      }
    }
  });

  // If overwrite strategy, anything in local not in remote is marked for deletion
  if (strategy === 'overwrite') {
    localItems.forEach(localItem => {
      if (!remoteMap.has(localItem.id)) {
        diffItems.push({
          id: localItem.id,
          title: getTitle(localItem),
          subtitle: getSubtitle ? getSubtitle(localItem) : undefined,
          category,
          categoryLabel,
          action: 'delete',
          data: localItem,
        });
      }
    });
  }

  return diffItems;
}

export function buildSubscriptionDiff(
  subscriptionId: string,
  subscriptionName: string,
  diffItems: DiffItem[],
  rawRemoteData?: any
): SubscriptionDiff {
  let added = 0;
  let updated = 0;
  let deleted = 0;

  for (const item of diffItems) {
    if (item.action === 'add') added++;
    else if (item.action === 'update') updated++;
    else if (item.action === 'delete') deleted++;
  }

  return {
    subscriptionId,
    subscriptionName,
    items: diffItems,
    counts: {
      added,
      updated,
      deleted,
      total: added + updated + deleted,
    },
    timestamp: Date.now(),
    rawRemoteData,
  };
}
