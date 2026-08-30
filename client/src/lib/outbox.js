/**
 * ==============================================================================
 * SkinLab AI - Offline Outbox Synchronization Engine (PWA Pattern)
 * ==============================================================================
 * Implements the Outbox Pattern for offline clinic resilience:
 * 1. If internet drops mid-session, queued writes (sales, session notes, patients)
 *    are stored locally in localStorage / IndexedDB.
 * 2. As soon as connectivity returns, all pending records in the Outbox
 *    are sequentially synced to the server without losing any data.
 * ==============================================================================
 */

const OUTBOX_STORAGE_KEY = 'skinlab_offline_outbox_queue';

export const outboxManager = {
  // Retrieve pending outbox queue
  getPendingQueue() {
    try {
      const data = localStorage.getItem(OUTBOX_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // Enqueue an action while offline
  enqueueAction(actionType, payload) {
    const queue = this.getPendingQueue();
    const newEntry = {
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      type: actionType, // 'create_sale', 'redeem_session', 'register_patient'
      payload: payload,
      queuedAt: new Date().toISOString()
    };
    queue.push(newEntry);
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(queue));
    return newEntry;
  },

  // Process and sync all queued items
  async flushQueue(apiClient) {
    const queue = this.getPendingQueue();
    if (queue.length === 0) return { syncedCount: 0 };

    const remaining = [];
    let synced = 0;

    for (const item of queue) {
      try {
        if (item.type === 'create_sale') {
          await apiClient.createSale(item.payload);
        } else if (item.type === 'redeem_session') {
          await apiClient.redeemSession(item.payload);
        } else if (item.type === 'register_patient') {
          await apiClient.registerPatient(item.payload);
        }
        synced++;
      } catch (err) {
        console.error('[Outbox] Failed to sync item:', item, err);
        remaining.push(item);
      }
    }

    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(remaining));
    return { syncedCount: synced, remainingCount: remaining.length };
  },

  clearQueue() {
    localStorage.removeItem(OUTBOX_STORAGE_KEY);
  }
};
