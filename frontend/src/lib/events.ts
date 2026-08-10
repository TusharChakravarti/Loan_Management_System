
const CHANNEL_NAME = 'lms_loan_updates_channel';
const STORAGE_KEY = 'lms_loan_update_event';

export interface LoanUpdateEvent {
  type:
    | 'LOAN_CREATED'
    | 'SALES_APPROVED'
    | 'SANCTION_APPROVED'
    | 'SANCTION_REJECTED'
    | 'LOAN_DISBURSED'
    | 'PAYMENT_RECORDED';
  loanId?: string;
  timestamp: number;
}

export const broadcastLoanUpdate = (event: Omit<LoanUpdateEvent, 'timestamp'>): void => {
  const payload: LoanUpdateEvent = {
    ...event,
    timestamp: Date.now(),
  };

  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    } catch (e) {
      console.warn('[BroadcastChannel Error]', e);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
     
    }
  }
};

export const subscribeToLoanUpdates = (onUpdate: (event: LoanUpdateEvent) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  let channel: BroadcastChannel | null = null;

  if ('BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (e) => {
        if (e.data && e.data.timestamp) {
          onUpdate(e.data as LoanUpdateEvent);
        }
      };
    } catch (e) {
      console.warn('[BroadcastChannel Listen Error]', e);
    }
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        onUpdate(parsed);
      } catch {
   
      }
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) {
      channel.close();
    }
    window.removeEventListener('storage', handleStorage);
  };
};
