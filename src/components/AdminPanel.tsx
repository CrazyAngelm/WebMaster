// 📁 src/components/AdminPanel.tsx - Administrative control panel
// 🎯 Core function: Quick cheats and debugging for admins
// 🔗 Key dependencies: React, useGameStore, lucide-react
// 💡 Usage: Accessible only by users with ADMIN role

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Coins, Clock, Heart, X, Zap } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { adminAddGold, adminSkipTime, adminForceRest, adminSetMultiplier, serverTimeData } = useGameStore();
  const [goldAmount, setGoldAmount] = useState(1000);
  const [skipHours, setSkipHours] = useState(24);
  const [multiplier, setMultiplier] = useState(serverTimeData?.multiplier || 1.0);
  const [message, setMessage] = useState('');

  const handleAction = async (action: () => Promise<void>) => {
    try {
      await action();
      setMessage('Успешно выполнено');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Ошибка: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="fantasy-panel w-full max-w-md relative p-8">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-fantasy-accent transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-serif text-fantasy-accent mb-8 uppercase tracking-widest text-center">
          Панель Администратора
        </h2>

        <div className="space-y-6">
          {/* Gold Action */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-fantasy-dark border border-fantasy-border flex items-center justify-center text-yellow-500">
              <Coins size={24} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Добавить золото</div>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={goldAmount}
                  onChange={(e) => setGoldAmount(Number(e.target.value))}
                  className="bg-fantasy-dark border border-fantasy-border p-2 text-white w-24 outline-none focus:border-fantasy-accent"
                />
                <button 
                  onClick={() => handleAction(() => adminAddGold(goldAmount))}
                  className="fantasy-button flex-1 py-2 text-xs"
                >
                  Выдать
                </button>
              </div>
            </div>
          </div>

          {/* Time Action */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-fantasy-dark border border-fantasy-border flex items-center justify-center text-blue-400">
              <Clock size={24} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Пропустить время (часы)</div>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={skipHours}
                  onChange={(e) => setSkipHours(Number(e.target.value))}
                  className="bg-fantasy-dark border border-fantasy-border p-2 text-white w-24 outline-none focus:border-fantasy-accent"
                />
                <button 
                  onClick={() => handleAction(() => adminSkipTime(skipHours))}
                  className="fantasy-button flex-1 py-2 text-xs"
                >
                  Промотать
                </button>
              </div>
            </div>
          </div>

          {/* Multiplier Action */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-fantasy-dark border border-fantasy-border flex items-center justify-center text-fantasy-essence">
              <Zap size={24} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Множитель времени (x5, x10...)</div>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  step="0.1"
                  value={multiplier}
                  onChange={(e) => setMultiplier(Number(e.target.value))}
                  className="bg-fantasy-dark border border-fantasy-border p-2 text-white w-24 outline-none focus:border-fantasy-accent"
                />
                <button 
                  onClick={() => handleAction(() => adminSetMultiplier(multiplier))}
                  className="fantasy-button flex-1 py-2 text-xs"
                >
                  Установить
                </button>
              </div>
            </div>
          </div>

          {/* Rest Action */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-fantasy-dark border border-fantasy-border flex items-center justify-center text-green-500">
              <Heart size={24} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Полное восстановление</div>
              <button 
                onClick={() => handleAction(() => adminForceRest())}
                className="fantasy-button w-full py-2 text-xs"
              >
                Восстановить персонажа
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-8 text-center text-xs text-fantasy-accent italic animate-pulse">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

