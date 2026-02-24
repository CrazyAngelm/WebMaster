// 📁 src/components/QuestLog.tsx - Quest tracking UI
// 🎯 Core function: Displays active quests and their progress
// 🔗 Key dependencies: src/store/gameStore.ts
// 💡 Usage: Sidebar or separate tab for player reference

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { QuestStatus } from '../types/game';
import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  ChevronRight,
  Target,
  Scroll
} from 'lucide-react';
import { clsx } from 'clsx';

const translateQuestStatus = (status: QuestStatus): string => {
  switch (status) {
    case QuestStatus.NOT_STARTED: return 'Доступно';
    case QuestStatus.IN_PROGRESS: return 'В процессе';
    case QuestStatus.READY_TO_COMPLETE: return 'Готов к сдаче';
    case QuestStatus.COMPLETED: return 'Завершено';
    case QuestStatus.FAILED: return 'Провалено';
    default: return status;
  }
};

export const QuestLog: React.FC = () => {
  const { activeQuests, acceptQuest } = useGameStore();

  const inProgress = activeQuests.filter(q => 
    q.status === QuestStatus.IN_PROGRESS || 
    q.status === QuestStatus.READY_TO_COMPLETE ||
    q.status === QuestStatus.COMPLETED
  );
  const available = activeQuests.filter(q => q.status === QuestStatus.NOT_STARTED);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Scroll className="text-fantasy-accent" size={20} />
          <h2 className="text-xl font-serif text-fantasy-accent uppercase tracking-widest">Дневник</h2>
        </div>
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-black/30 px-2 py-0.5 border border-fantasy-border rounded">
          {inProgress.length} АКТИВНО
        </div>
      </div>
      
      {/* Available Quests */}
      {available.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-fantasy-border/50" />
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Новые поручения</h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-fantasy-border/50" />
          </div>
          <div className="space-y-3">
            {available.map(quest => (
              <div key={quest.id} className="fantasy-panel p-4 border-l-2 border-l-amber-600/50 bg-amber-900/5 hover:bg-amber-900/10 transition-colors group">
                <h4 className="font-bold text-white text-sm mb-1 group-hover:text-fantasy-accent transition-colors">{quest.title}</h4>
                <p className="text-[10px] text-gray-400 mb-3 italic line-clamp-2 leading-relaxed">{quest.description}</p>
                <button
                  onClick={() => acceptQuest(quest.id)}
                  className="w-full py-1.5 text-[9px] font-bold uppercase tracking-widest bg-fantasy-accent/10 border border-fantasy-accent/30 text-fantasy-accent hover:bg-fantasy-accent hover:text-fantasy-dark transition-all rounded flex items-center justify-center gap-2"
                >
                  Принять <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Active Quests */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-fantasy-border/50" />
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Текущие задачи</h3>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-fantasy-border/50" />
      </div>

      {inProgress.length === 0 ? (
        <div className="fantasy-panel p-8 text-center flex flex-col items-center gap-3 bg-black/20">
          <BookOpen size={32} className="text-gray-700" />
          <p className="text-xs text-gray-500 italic">
            {available.length === 0 ? 'Журнал пуст. Ищите задания в городе.' : 'У вас нет активных задач.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
          {inProgress.map(quest => (
            <div 
              key={quest.id} 
              className={clsx(
                "fantasy-panel p-4 border-l-2 transition-all relative overflow-hidden",
                quest.status === QuestStatus.READY_TO_COMPLETE || quest.status === QuestStatus.COMPLETED
                  ? "border-l-green-500 bg-green-900/5 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]" 
                  : "border-l-fantasy-accent bg-fantasy-surface/40"
              )}
            >
              {(quest.status === QuestStatus.READY_TO_COMPLETE || quest.status === QuestStatus.COMPLETED) && (
                <div className="absolute top-0 right-0 p-1 opacity-10">
                  <CheckCircle2 size={48} />
                </div>
              )}

              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className={clsx(
                    "font-bold text-sm mb-0.5",
                    quest.status === QuestStatus.READY_TO_COMPLETE || quest.status === QuestStatus.COMPLETED ? "text-green-400" : "text-white"
                  )}>
                    {quest.title}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className={clsx(
                      "text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter border",
                      quest.status === QuestStatus.READY_TO_COMPLETE || quest.status === QuestStatus.COMPLETED
                        ? "bg-green-900/20 text-green-500 border-green-500/30" 
                        : "bg-blue-900/20 text-blue-500 border-blue-500/30"
                    )}>
                      {translateQuestStatus(quest.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-[10px] text-gray-400 mb-4 italic leading-relaxed">{quest.description}</p>
              
              <div className="space-y-2 mb-4 bg-black/20 p-2 rounded border border-fantasy-border/30">
                <div className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                  <Target size={10} /> Цели
                </div>
                {quest.objectives.map(obj => (
                  <div key={obj.id} className="flex items-center gap-2 text-[10px]">
                    <div className={clsx(
                      "flex-shrink-0 w-3 h-3 border rounded-full flex items-center justify-center transition-colors",
                      obj.isCompleted ? "bg-green-500 border-green-500" : "border-fantasy-border"
                    )}>
                      {obj.isCompleted ? <CheckCircle2 size={8} className="text-white" /> : <Circle size={6} className="text-gray-600" />}
                    </div>
                    <span className={clsx(
                      "flex-1",
                      obj.isCompleted ? 'text-gray-500 line-through italic' : 'text-gray-300'
                    )}>
                      {obj.description}
                    </span>
                    <span className={clsx(
                      "font-mono font-bold",
                      obj.isCompleted ? 'text-green-500/50' : 'text-fantasy-accent'
                    )}>
                      {obj.currentAmount}/{obj.requiredAmount}
                    </span>
                  </div>
                ))}
              </div>

              {quest.rewards && ((quest.rewards.money && quest.rewards.money > 0) || (quest.rewards.essence && quest.rewards.essence > 0) || (quest.rewards.items && quest.rewards.items.length > 0)) && (
                <div className="space-y-2 mb-4 bg-amber-900/10 p-2 rounded border border-amber-700/30">
                  <div className="text-[8px] text-amber-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                    <Scroll size={10} /> Награда
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px]">
                    {quest.rewards.money && quest.rewards.money > 0 && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <span className="font-bold">{quest.rewards.money}</span>
                        <span className="text-gray-400">золота</span>
                      </div>
                    )}
                    {quest.rewards.essence && quest.rewards.essence > 0 && (
                      <div className="flex items-center gap-1 text-purple-400">
                        <span className="font-bold">{quest.rewards.essence}</span>
                        <span className="text-gray-400">эссенции</span>
                      </div>
                    )}
                    {quest.rewards.items && quest.rewards.items.length > 0 && (
                      <div className="flex items-center gap-1 text-blue-400">
                        <span className="font-bold">{quest.rewards.items.length}</span>
                        <span className="text-gray-400">предметов</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {quest.status === QuestStatus.READY_TO_COMPLETE && (
                <div className="w-full py-2 px-3 text-[10px] font-bold uppercase tracking-widest bg-green-900/50 text-green-400 border border-green-700/50 rounded flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> Поговорите с NPC чтобы получить награду
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};




