// 📁 src/components/Notification.tsx - Global system notifications
// 🎯 Core function: Show transient success/error messages from game actions
// 🔗 Key dependencies: useGameStore
// 💡 Usage: Rendered inside Layout to display latest notification

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export const Notification: React.FC = () => {
  const { notification, clearNotification } = useGameStore((state) => ({
    notification: state.notification,
    clearNotification: state.clearNotification,
  }));

  useEffect(() => {
    if (!notification) return;
    
    // * Auto hides notification after short delay
    const timeoutId = setTimeout(() => {
      clearNotification();
    }, 4000);

    return () => clearTimeout(timeoutId);
  }, [notification, clearNotification]);

  if (!notification) {
    return null;
  }

  const isSuccess = notification.type === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded border text-xs uppercase tracking-widest font-bold shadow-lg bg-fantasy-surface ${
          isSuccess
            ? 'border-emerald-500 text-emerald-300'
            : 'border-fantasy-blood text-fantasy-blood'
        }`}
      >
        <Icon size={16} />
        <span>{notification.message}</span>
      </div>
    </div>
  );
};


