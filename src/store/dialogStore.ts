// 📁 src/store/dialogStore.ts - Dialog/NPC conversation state
// 🎯 Core function: Manages NPC dialog state and history
// 🔗 Key dependencies: zustand, types/ai, types/game
// 💡 Usage: Used by NPCDialog component

import { create } from 'zustand';
import { ConversationMessage, NPCData, NPCResponse } from '../types/ai';
import { Location } from '../types/game';

interface DialogState {
  isOpen: boolean;
  currentNPC: NPCData | null;
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  openDialog: (npc: NPCData) => void;
  closeDialog: () => void;
  addPlayerMessage: (content: string) => void;
  addNPCMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  isOpen: false,
  currentNPC: null,
  messages: [],
  isLoading: false,
  error: null,

  openDialog: (npc) => {
    const greeting: ConversationMessage = {
      role: 'npc',
      content: npc.dialogueGreeting || `Приветствую, путник. Я ${npc.name}.`
    };
    
    set({ 
      isOpen: true, 
      currentNPC: npc, 
      messages: [greeting],
      error: null
    });
  },

  closeDialog: () => {
    set({ 
      isOpen: false, 
      currentNPC: null, 
      messages: [],
      error: null
    });
  },

  addPlayerMessage: (content) => {
    const message: ConversationMessage = {
      role: 'player',
      content
    };
    set(state => ({ 
      messages: [...state.messages, message] 
    }));
  },

  addNPCMessage: (content) => {
    const message: ConversationMessage = {
      role: 'npc',
      content
    };
    set(state => ({ 
      messages: [...state.messages, message] 
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearMessages: () => set({ messages: [] })
}));
