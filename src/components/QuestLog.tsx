// 📁 src/components/QuestLog.tsx - Quest tracking UI
// 🎯 Core function: Displays active quests and their progress
// 🔗 Key dependencies: src/store/gameStore.ts
// 💡 Usage: Sidebar or separate tab for player reference

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { QuestStatus } from '../types/game';

const translateQuestStatus = (status: QuestStatus): string => {
  switch (status) {
    case QuestStatus.NOT_STARTED: return 'Не начато';
    case QuestStatus.IN_PROGRESS: return 'В процессе';
    case QuestStatus.COMPLETED: return 'Завершено';
    case QuestStatus.FAILED: return 'Провалено';
    default: return status;
  }
};

export const QuestLog: React.FC = () => {
  const { activeQuests, completeQuest } = useGameStore();

  const inProgress = activeQuests.filter(q => q.status === QuestStatus.IN_PROGRESS || q.status === QuestStatus.COMPLETED);

  return (
    <div className="flex flex-col h-full gap-4">
      <h2 className="text-xl font-serif text-fantasy-accent uppercase tracking-tight mb-2">Журнал заданий</h2>
      
      {inProgress.length === 0 ? (
        <div className="fantasy-panel p-6 text-center text-gray-500 italic">
          Нет активных заданий. Посетите НПС, чтобы найти работу.
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
          {inProgress.map(quest => (
            <div key={quest.id} className="fantasy-panel p-4 border-l-4 border-l-fantasy-accent/30">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white">{quest.title}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${
                  quest.status === QuestStatus.COMPLETED ? 'bg-green-900/20 text-green-500' : 'bg-blue-900/20 text-blue-500'
                }`}>
                  {translateQuestStatus(quest.status)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-4 italic">{quest.description}</p>
              
              <div className="space-y-2 mb-4">
                {quest.objectives.map(obj => (
                  <div key={obj.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 border rounded-sm flex items-center justify-center ${
                      obj.isCompleted ? 'bg-fantasy-accent border-fantasy-accent' : 'border-fantasy-border'
                    }`}>
                      {obj.isCompleted && <span className="text-[8px] text-fantasy-dark">✓</span>}
                    </div>
                    <span className={obj.isCompleted ? 'text-gray-500 line-through' : 'text-gray-300'}>
                      {obj.description} ({obj.currentAmount}/{obj.requiredAmount})
                    </span>
                  </div>
                ))}
              </div>

              {quest.status === QuestStatus.COMPLETED && (
                <button
                  onClick={() => completeQuest(quest.id)}
                  className="fantasy-button w-full py-1 text-[10px] bg-green-900/20 hover:bg-green-900/40 border-green-900/50"
                >
                  ПОЛУЧИТЬ НАГРАДЫ
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



