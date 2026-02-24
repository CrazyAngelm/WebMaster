// 📁 src/components/NPCDialog.tsx - NPC Dialog Component
// 🎯 Core function: Interactive dialog with AI-powered NPCs
// 🔗 Key dependencies: React, dialogStore, gameStore, AIService
// 💡 Usage: Used in world navigation for talking to NPCs

import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Sparkles } from 'lucide-react';
import { useDialogStore } from '../store/dialogStore';
import { useGameStore } from '../store/gameStore';
import { StaticDataService } from '../services/StaticDataService';
import { NPCData, NPCResponse } from '../types/ai';
import { mockAIService } from '../services/MockAIService';
import { QuestGenerationService } from '../services/QuestGenerationService';

interface NPCDialogProps {
  npc: NPCData;
  onClose: () => void;
  onNavigateToCombat?: () => void;
  onTradeRequest?: (buildingId: string) => void;
}

export const NPCDialog: React.FC<NPCDialogProps> = ({ npc, onClose, onNavigateToCombat, onTradeRequest }) => {
  const { messages, isLoading, error, addPlayerMessage, addNPCMessage, setLoading, setError, clearMessages } = useDialogStore();
  const { 
    aiService, 
    character, 
    inventory,
    itemTemplates,
    activeQuests,
    addQuestFromNPC,
    addItemToInventory,
    getNPCDialogHistory,
    addNPCDialogMessage,
    getNPCReputation,
    changeNPCReputation,
    initiateCombatFromDialog
  } = useGameStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showQuestOffer, setShowQuestOffer] = useState(false);
  const [pendingQuest, setPendingQuest] = useState<NPCResponse['questSuggestion'] | null>(null);
  const [localMessages, setLocalMessages] = useState<{role: 'player' | 'npc'; content: string}[]>([]);

  // Initialize with greeting on mount - load from history if exists
  useEffect(() => {
    const savedHistory = getNPCDialogHistory(npc.id);
    const reputation = getNPCReputation(npc.id);
    
    if (savedHistory.length > 0) {
      // Load existing history
      setLocalMessages(savedHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    } else {
      // Start with greeting
      const greeting = npc.dialogueGreeting || `Приветствую, путник. Я ${npc.name}.`;
      setLocalMessages([{
        role: 'npc',
        content: greeting
      }]);
      addNPCDialogMessage(npc.id, 'npc', greeting);
    }
    
    return () => {
      clearMessages();
    };
  }, [npc.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !npc || !character) return;

    const playerMessage = input.trim();
    setInput('');
    addPlayerMessage(playerMessage);
    addNPCDialogMessage(npc.id, 'player', playerMessage);
    setLocalMessages(prev => [...prev, { role: 'player', content: playerMessage }]);
    setLoading(true);
    setError(null);

    try {
      const service = aiService?.isAvailable() ? aiService : mockAIService;
      
      const history = getNPCDialogHistory(npc.id).map(m => ({
        role: m.role as 'player' | 'npc',
        content: m.content
      }));

      // Get location from character
      const locationId = character.location.locationId;
      const location = StaticDataService.getLocation(locationId);
      
      if (!location) {
        throw new Error('Location not found');
      }

      const context = {
        character,
        location,
        reputation: getNPCReputation(npc.id),
        inventory: inventory ?? undefined,
        itemTemplates: itemTemplates ?? undefined,
        npcId: npc.id
      };

      const response = await service.generateResponse(
        npc.name,
        npc.description,
        npc.personality,
        playerMessage,
        context,
        history
      );

      addNPCMessage(response.text);
      addNPCDialogMessage(npc.id, 'npc', response.text);
      setLocalMessages(prev => [...prev, { role: 'npc', content: response.text }]);

      // Handle NPC actions
      if (response.action) {
        switch (response.action) {
          case 'attack':
            // Change reputation negatively for aggression
            changeNPCReputation(npc.id, -20);
            // Initiate combat and wait for it to start
            try {
              // Check if NPC has a valid server ID (not a temporary one)
              const isTemporaryId = npc.id.startsWith('npc-') || npc.id.startsWith('npc-mock-') || npc.id.startsWith('generated-');
              if (isTemporaryId) {
                console.warn('[NPCDialog] NPC has temporary ID, attempting to persist first...');
                // Re-fetch NPC to ensure it's persisted
                const { NPCService } = await import('../services/NPCService');
                const buildingId = npc.buildingId;
                if (buildingId && character?.location.locationId) {
                  const location = (await import('../services/StaticDataService')).StaticDataService.getLocation(character.location.locationId);
                  const building = (await import('../services/StaticDataService')).StaticDataService.getBuilding(buildingId);
                  if (location && building) {
                    const persistedNPC = await NPCService.getNPCForBuilding(building, location);
                    if (!persistedNPC.id.startsWith('npc-') && !persistedNPC.id.startsWith('npc-mock-') && !persistedNPC.id.startsWith('generated-')) {
                      console.log('[NPCDialog] NPC persisted with new ID:', persistedNPC.id);
                      await initiateCombatFromDialog(persistedNPC.id);
                    } else {
                      throw new Error('NPC could not be persisted with valid server ID');
                    }
                  } else {
                    throw new Error('Could not find location or building for NPC persistence');
                  }
                } else {
                  throw new Error('NPC is missing buildingId or location');
                }
              } else {
                await initiateCombatFromDialog(npc.id);
              }
              // Close dialog and navigate to combat after battle starts
              onClose();
              onNavigateToCombat?.();
            } catch (error) {
              console.error('Failed to initiate combat:', error);
              const errorMessage = error instanceof Error ? error.message : 'Не удалось начать бой';
              addNPCMessage(`Ошибка: ${errorMessage}. Попробуйте ещё раз.`);
            }
            break;
            
          case 'trade': {
            const building = npc.buildingId ? StaticDataService.getBuilding(npc.buildingId) : null;
            if (building?.hasShop && onTradeRequest && npc.buildingId) {
              onTradeRequest(npc.buildingId);
            } else {
              const noShopMsg = 'Здесь нет магазина.';
              addNPCMessage(noShopMsg);
              addNPCDialogMessage(npc.id, 'npc', noShopMsg);
              setLocalMessages(prev => [...prev, { role: 'npc', content: noShopMsg }]);
            }
            break;
          }

          case 'gift':
            break;

          case 'negotiate':
            changeNPCReputation(npc.id, 15);
            break;

          case 'flee':
            // NPC runs away
            changeNPCReputation(npc.id, -10);
            const fleeMessage = npc.name + ' убегает от вас!';
            addNPCMessage(fleeMessage);
            addNPCDialogMessage(npc.id, 'npc', fleeMessage);
            setLocalMessages(prev => [...prev, { role: 'npc', content: fleeMessage }]);
            setTimeout(() => onClose(), 2000);
            break;
            
          case 'offer_quest': {
            // Generate quest using QuestGenerationService with real IDs
            if (character && npc) {
              const location = StaticDataService.getLocation(character.location.locationId);
              if (location) {
                const gameContext = {
                  character,
                  location,
                  inventory: inventory || { items: [], baseSlots: 10 },
                  activeQuests: activeQuests || [],
                  npcs: [],
                  itemTemplates: itemTemplates || new Map()
                };
                
                const generatedQuest = await QuestGenerationService.generateQuestForNPC(npc, gameContext);
                if (generatedQuest) {
                  setPendingQuest(generatedQuest);
                  setShowQuestOffer(true);
                }
              }
            }
            break;
          }

          case 'complete_quest': {
            // Find quests ready to complete from this NPC
            const readyQuests = activeQuests?.filter(q => 
              q.giverNPCId === npc.id && q.status === 'READY_TO_COMPLETE'
            );
            
            if (readyQuests && readyQuests.length > 0) {
              // Complete the first ready quest
              const questToComplete = readyQuests[0];
              const { turnInQuest } = useGameStore.getState();
              const success = await turnInQuest(questToComplete.id, npc.id);
              
              if (success) {
                const completeMsg = `Квест "${questToComplete.title}" завершен! Награды выданы.`;
                addNPCMessage(completeMsg);
                addNPCDialogMessage(npc.id, 'npc', completeMsg);
                setLocalMessages(prev => [...prev, { role: 'npc', content: completeMsg }]);
              }
            }
            break;
          }
            
          default:
            // 'talk' or 'idle' - no special action needed
            break;
        }
      }

      // Handle reputation changes based on emotion
      if (response.emotion) {
        switch (response.emotion) {
          case 'angry':
            changeNPCReputation(npc.id, -5);
            break;
          case 'happy':
            changeNPCReputation(npc.id, 5);
            break;
          case 'scared':
            changeNPCReputation(npc.id, -3);
            break;
          default:
            break;
        }
      }

      // Note: Quest generation is now handled in case 'offer_quest' using QuestGenerationService

      if (response.itemOffer && response.action === 'gift') {
        const { templateId, quantity } = response.itemOffer;
        const success = addItemToInventory(templateId, quantity);
        if (success && itemTemplates) {
          const template = itemTemplates.get(templateId);
          const itemName = template?.name || templateId;
          const giftMsg = `${npc.name} дарит вам ${itemName} x${quantity}`;
          addNPCMessage(giftMsg);
          addNPCDialogMessage(npc.id, 'npc', giftMsg);
          setLocalMessages(prev => [...prev, { role: 'npc', content: giftMsg }]);
          changeNPCReputation(npc.id, 5);
        }
      }
    } catch (err: any) {
      console.error('Dialog error:', err);
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const acceptQuest = () => {
    if (!pendingQuest || !npc) return;
    
    // Add the quest to game state with NPC as giver
    addQuestFromNPC({
      title: pendingQuest.title,
      description: pendingQuest.description,
      objectives: pendingQuest.objectives || [],
      rewards: pendingQuest.rewards || {},
      completionNPCId: pendingQuest.completionNPCId
    }, npc.id);
    
    const acceptMessage = 'Отлично! Возвращайся, когда выполнишь задание.';
    addNPCMessage(acceptMessage);
    addNPCDialogMessage(npc.id, 'npc', acceptMessage);
    setLocalMessages(prev => [...prev, { role: 'npc', content: acceptMessage }]);
    setShowQuestOffer(false);
    setPendingQuest(null);
  };

  const declineQuest = () => {
    const declineMessage = 'Жаль. Возможно, в другой раз.';
    addNPCMessage(declineMessage);
    addNPCDialogMessage(npc.id, 'npc', declineMessage);
    setLocalMessages(prev => [...prev, { role: 'npc', content: declineMessage }]);
    setShowQuestOffer(false);
    setPendingQuest(null);
  };

  if (!npc) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-fantasy-surface border-2 border-fantasy-accent rounded-lg w-full max-w-2xl h-[600px] flex flex-col shadow-2xl shadow-fantasy-accent/20">
        
        {/* Header */}
        <div className="p-4 border-b border-fantasy-accent/30 flex justify-between items-center bg-fantasy-dark/50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-fantasy-accent/20 flex items-center justify-center border border-fantasy-accent/40">
              <MessageCircle className="text-fantasy-accent" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-serif text-fantasy-accent">{npc.name}</h2>
              <p className="text-xs text-gray-400">{npc.description}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-fantasy-accent/20 rounded-lg transition-colors"
          >
            <X className="text-gray-400 hover:text-white" size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-fantasy-dark/30">
          {localMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'player' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] p-3 rounded-lg ${
                  msg.role === 'player'
                    ? 'bg-fantasy-accent/20 text-white border border-fantasy-accent/30'
                    : 'bg-fantasy-surface/80 text-gray-200 border border-fantasy-accent/20'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-fantasy-surface/80 p-3 rounded-lg border border-fantasy-accent/20">
                <div className="flex items-center gap-2 text-gray-400">
                  <Sparkles className="animate-pulse text-fantasy-accent" size={16} />
                  <span className="text-sm">Думает...</span>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-2 rounded text-sm">
                {error}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quest Offer - Inline in chat */}
        {showQuestOffer && pendingQuest && (
          <div className="mx-4 mb-4 p-4 bg-fantasy-surface border border-yellow-500/50 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-yellow-500" />
              <h3 className="text-lg font-serif text-yellow-500">📜 Предложение квеста</h3>
            </div>
            <div className="space-y-2 mb-4">
              <h4 className="text-white font-bold">{pendingQuest.title}</h4>
              <p className="text-gray-300 text-sm">{pendingQuest.description}</p>
              {pendingQuest.objectives && pendingQuest.objectives.length > 0 && (
                <div className="text-sm text-gray-400 mt-2">
                  <p className="font-semibold text-gray-300">Цели:</p>
                  <ul className="list-disc list-inside">
                    {pendingQuest.objectives.map((obj, idx) => (
                      <li key={idx}>{obj.target} x{obj.amount}</li>
                    ))}
                  </ul>
                </div>
              )}
              {pendingQuest.rewards && (
                <div className="text-sm text-gray-400 mt-2">
                  <p className="font-semibold text-gray-300">Награды:</p>
                  <div className="flex gap-3">
                    {pendingQuest.rewards.money && (
                      <span className="text-yellow-400">{pendingQuest.rewards.money} золота</span>
                    )}
                    {pendingQuest.rewards.essence && (
                      <span className="text-blue-400">{pendingQuest.rewards.essence} сущности</span>
                    )}
                    {pendingQuest.rewards.items && pendingQuest.rewards.items.length > 0 && (
                      <span className="text-green-400">{pendingQuest.rewards.items.length} предметов</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={acceptQuest}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors text-sm font-bold"
              >
                ✅ Принять
              </button>
              <button 
                onClick={declineQuest}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm"
              >
                ❌ Отказаться
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-fantasy-accent/30 bg-fantasy-dark/50 rounded-b-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Скажи что-нибудь..."
              className="flex-1 bg-fantasy-dark border border-fantasy-accent/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-fantasy-accent/60"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="fantasy-button px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
