// 📁 src/components/CraftingView.tsx - Crafting interface
// 🎯 Core function: Display recipes and allow item creation
// 🔗 Key dependencies: src/store/gameStore.ts, src/types/game.ts
// 💡 Usage: Integrated into App/Layout as a main view

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ProfessionType, Rarity, UUID } from '../types/game';
import { Hammer, Scissors, FlaskConical, Scroll, Utensils, Zap, Check, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { ProfessionService } from '../services/ProfessionService';
import { StaticDataService } from '../services/StaticDataService';

export const CraftingView: React.FC = () => {
  const { character, inventory, recipes, itemTemplates, craftItem } = useGameStore();
  const [selectedProfession, setSelectedProfession] = useState<ProfessionType | null>(null);

  if (!character || !inventory) return null;

  const professions: { type: ProfessionType; label: string; icon: any }[] = [
    { type: ProfessionType.BLACKSMITH, label: 'Кузнец', icon: Hammer },
    { type: ProfessionType.TAILOR, label: 'Портной', icon: Scissors },
    { type: ProfessionType.POTION_MAKER, label: 'Зельевар', icon: FlaskConical },
    { type: ProfessionType.ALCHEMIST, label: 'Алхимик', icon: Zap },
    { type: ProfessionType.SCRIBE, label: 'Начертатель', icon: Scroll },
    { type: ProfessionType.COOK, label: 'Повар', icon: Utensils },
  ];

  const getProfessionData = (type: ProfessionType) => {
    return character.professions?.find(p => p.type === type) || { exp: 0, rank: 1 };
  };

  const filteredRecipes = selectedProfession 
    ? recipes.filter(r => r.profession === selectedProfession)
    : [];

  const checkIngredients = (recipeIngredients: { templateId: UUID; quantity: number }[]) => {
    return recipeIngredients.every(ing => {
      const invItem = inventory.items.find(i => i.templateId === ing.templateId);
      return invItem && invItem.quantity >= ing.quantity;
    });
  };

  const canCraft = (recipe: any) => {
    const prof = getProfessionData(recipe.profession);
    const hasIngredients = checkIngredients(recipe.ingredients);
    const isCorrectRank = prof.rank >= recipe.rankRequired;

    // * Check workstation presence in current building if recipe requires it
    let hasWorkstation = true;
    if (recipe.stationRequired) {
      const building = character.location.buildingId
        ? StaticDataService.getBuilding(character.location.buildingId)
        : null;
      hasWorkstation = !!building?.workstations?.includes(recipe.stationRequired);
    }

    return hasIngredients && isCorrectRank && hasWorkstation;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-fantasy-accent uppercase tracking-widest flex items-center gap-2">
          <Hammer size={24} /> Ремесло
        </h2>
      </div>

      {/* Profession Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {professions.map((prof) => {
          const charProf = getProfessionData(prof.type);
          const isSelected = selectedProfession === prof.type;
          const Icon = prof.icon;

          return (
            <button
              key={prof.type}
              onClick={() => setSelectedProfession(prof.type)}
              className={clsx(
                "p-3 rounded border-2 transition-all flex flex-col items-center gap-2",
                isSelected 
                  ? "bg-fantasy-accent/20 border-fantasy-accent text-fantasy-accent shadow-lg shadow-fantasy-accent/10" 
                  : "bg-fantasy-surface/50 border-fantasy-border/30 text-gray-500 hover:border-fantasy-border hover:text-gray-300"
              )}
            >
              <Icon size={24} />
              <div className="text-[10px] uppercase font-bold tracking-tighter">{prof.label}</div>
              <div className="text-[9px] opacity-70">Ранг {charProf.rank} ({charProf.exp} XP)</div>
            </button>
          );
        })}
      </div>

      {/* Recipe List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedProfession ? (
          filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => {
              const resultTemplate = itemTemplates.get(recipe.resultTemplateId);
              if (!resultTemplate) return null;

              const isCraftable = canCraft(recipe);
              const profData = getProfessionData(recipe.profession);

              return (
                <div 
                  key={recipe.id}
                  className={clsx(
                    "p-4 rounded border-2 bg-fantasy-surface/30 flex flex-col gap-4",
                    isCraftable ? "border-fantasy-border/50" : "border-fantasy-blood/20 opacity-70"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-serif text-fantasy-accent uppercase">{resultTemplate.name}</h3>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                        Ранг {recipe.rankRequired} • {ProfessionService.getRankName(recipe.rankRequired)}
                      </div>
                    </div>
                    {!isCraftable && (
                      <div className="text-fantasy-blood flex items-center gap-1 text-[10px] uppercase font-bold">
                        <AlertCircle size={14} /> Недоступно
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] uppercase font-bold text-gray-500 tracking-tighter">Ингредиенты:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {recipe.ingredients.map((ing) => {
                        const ingTemplate = itemTemplates.get(ing.templateId);
                        const invItem = inventory.items.find(i => i.templateId === ing.templateId);
                        const hasEnough = invItem && invItem.quantity >= ing.quantity;
                        
                        return (
                          <div key={ing.templateId} className="flex items-center justify-between text-xs p-1 bg-black/20 rounded border border-fantasy-border/20">
                            <span className={hasEnough ? "text-gray-300" : "text-fantasy-blood"}>
                              {ingTemplate?.name || ing.templateId}
                            </span>
                            <span className={clsx("font-bold", hasEnough ? "text-fantasy-accent" : "text-fantasy-blood")}>
                              {invItem?.quantity || 0} / {ing.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {recipe.stationRequired && (
                    <div className="text-[10px] text-gray-400 italic flex items-center gap-1">
                      <Zap size={12} className="text-yellow-500" />
                      Требуется: {recipe.stationRequired}
                    </div>
                  )}

                  <button
                    disabled={!isCraftable}
                    onClick={() => craftItem(recipe.id)}
                    className={clsx(
                      "mt-auto py-2 rounded text-xs uppercase font-bold tracking-widest transition-all",
                      isCraftable 
                        ? "bg-fantasy-accent text-fantasy-dark hover:bg-fantasy-accent-bright" 
                        : "bg-gray-800 text-gray-600 cursor-not-allowed"
                    )}
                  >
                    Создать предмет
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-12 text-center text-gray-500 border-2 border-dashed border-fantasy-border/30 rounded font-serif">
              Рецепты для данной профессии ещё не изучены...
            </div>
          )
        ) : (
          <div className="col-span-full p-12 text-center text-gray-500 border-2 border-dashed border-fantasy-border/30 rounded font-serif italic">
            Выберите профессию выше, чтобы увидеть доступные чертежи и рецепты
          </div>
        )}
      </div>
    </div>
  );
};

