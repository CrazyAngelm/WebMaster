// 📁 src/components/AdminPanel.tsx - Administrative control panel
// 🎯 Core function: Quick cheats and debugging for admins
// 🔗 Key dependencies: React, useGameStore, lucide-react
// 💡 Usage: Accessible only by users with ADMIN role

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Coins, Clock, Heart, X, Zap, Settings, Save } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { 
    user,
    adminAddGold, 
    adminSkipTime, 
    adminForceRest, 
    adminSetMultiplier, 
    adminGetConfigs,
    adminUpdateConfig,
    serverTimeData,
    serverConfigs
  } = useGameStore();
  
  const [goldAmount, setGoldAmount] = useState(1000);
  const [skipHours, setSkipHours] = useState(24);
  const [multiplier, setMultiplier] = useState(serverTimeData?.multiplier || 1.0);
  const [message, setMessage] = useState('');
  const [editingConfigs, setEditingConfigs] = useState<Record<string, string>>({});

  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    if (isOwner) {
      adminGetConfigs();
    }
  }, [isOwner, adminGetConfigs]);

  useEffect(() => {
    if (serverConfigs.length > 0) {
      const initialConfigs: Record<string, string> = {};
      serverConfigs.forEach(c => {
        initialConfigs[c.key] = c.value;
      });
      setEditingConfigs(initialConfigs);
    }
  }, [serverConfigs]);

  const handleAction = async (action: () => Promise<void>) => {
    try {
      await action();
      setMessage('Успешно выполнено');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Ошибка: ${err.message}`);
    }
  };

  const handleUpdateConfig = async (key: string) => {
    try {
      let value = editingConfigs[key];
      
      if (typeof value !== 'string') {
        throw new Error('Значение конфигурации должно быть строкой');
      }

      // Try to parse as JSON if it looks like it
      try {
        if (value.startsWith('{') || value.startsWith('[')) {
          value = JSON.parse(value);
        }
      } catch (e) {
        // Keep as string if parsing fails
      }
      
      await adminUpdateConfig(key, value);
      setMessage(`Конфиг ${key} обновлен`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Ошибка: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="fantasy-panel w-full max-w-2xl relative p-8 my-8">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-fantasy-accent transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-serif text-fantasy-accent mb-8 uppercase tracking-widest text-center">
          Панель {isOwner ? 'Владельца' : 'Администратора'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-serif text-fantasy-accent/60 uppercase tracking-wider border-b border-fantasy-border/30 pb-2">
              Базовые действия
            </h3>
            
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

            {isOwner && (
              <>
                <h3 className="text-sm font-serif text-fantasy-accent/60 uppercase tracking-wider border-b border-fantasy-border/30 mt-8 pb-2">
                  Управление временем
                </h3>

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
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Множитель времени</div>
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
              </>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-serif text-fantasy-accent/60 uppercase tracking-wider border-b border-fantasy-border/30 pb-2">
              {isOwner ? 'Настройки сервера' : 'Статус сервера'}
            </h3>

            {!isOwner ? (
              <div className="text-xs text-gray-500 italic p-4 bg-fantasy-dark/50 border border-fantasy-border/20">
                У вас недостаточно прав для изменения конфигурации сервера. Обратитесь к владельцу.
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {serverConfigs.map((config) => (
                  <div key={config.key} className="p-3 bg-fantasy-dark/50 border border-fantasy-border/30 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] text-fantasy-accent font-bold uppercase tracking-widest">
                        {config.key}
                      </div>
                      <button 
                        onClick={() => handleUpdateConfig(config.key)}
                        className="text-gray-500 hover:text-green-500 transition-colors"
                        title="Сохранить"
                      >
                        <Save size={16} />
                      </button>
                    </div>
                    <textarea 
                      value={editingConfigs[config.key] || ''}
                      onChange={(e) => setEditingConfigs({ ...editingConfigs, [config.key]: e.target.value })}
                      rows={3}
                      className="w-full bg-black/40 border border-fantasy-border/30 p-2 text-[10px] text-gray-300 font-mono outline-none focus:border-fantasy-accent resize-none"
                    />
                  </div>
                ))}
                {serverConfigs.length === 0 && (
                  <div className="text-center text-xs text-gray-600 py-8">
                    Загрузка конфигураций...
                  </div>
                )}
              </div>
            )}
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

