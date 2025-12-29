// 📁 src/components/CharacterSelectionView.tsx - Character selection screen
// 🎯 Core function: View, select, or create characters
// 🔗 Key dependencies: React, useGameStore, src/data/races
// 💡 Usage: Shown after auth if no character is selected

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { StaticDataService } from '../services/StaticDataService';
import { Plus, Trash2, Shield, User, Zap } from 'lucide-react';

export const CharacterSelectionView: React.FC = () => {
  const { userCharacters, selectCharacter, createCharacter, deleteCharacter, logout } = useGameStore();
  const races = StaticDataService.getAllRaces();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedRace, setSelectedRace] = useState(races[0]?.id || '');
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createCharacter(newName, selectedRace);
      setShowCreate(false);
      setNewName('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Вы уверены, что хотите удалить персонажа ${name}?`)) {
      try {
        await deleteCharacter(id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  if (showCreate) {
    if (races.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="fantasy-panel p-8 w-full max-w-xl text-center">
            <h2 className="text-3xl font-serif text-fantasy-accent mb-4 uppercase tracking-widest">
              Загрузка данных...
            </h2>
            <p className="text-gray-500">Пожалуйста, подождите, пока загрузятся данные о расах.</p>
            <button
              onClick={() => setShowCreate(false)}
              className="fantasy-button mt-6"
            >
              Назад
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="fantasy-panel p-8 w-full max-w-xl">
          <h2 className="text-3xl font-serif text-fantasy-accent mb-8 text-center uppercase tracking-widest">
            Создание героя
          </h2>
          
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Имя персонажа</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-fantasy-dark border border-fantasy-border p-3 text-white focus:border-fantasy-accent outline-none font-serif text-lg"
                placeholder="Минимум 4 символа"
                required
              />
            </div>
            
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-3">Выберите расу</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {races.map(race => (
                  <div
                    key={race.id}
                    onClick={() => setSelectedRace(race.id)}
                    className={`p-4 border cursor-pointer transition-all ${
                      selectedRace === race.id 
                        ? 'bg-fantasy-accent/10 border-fantasy-accent' 
                        : 'bg-fantasy-dark border-fantasy-border hover:border-fantasy-accent/50'
                    }`}
                  >
                    <div className="text-fantasy-accent font-serif mb-1">{race.name}</div>
                    <div className="text-[10px] text-gray-400 italic">{race.description}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {error && (
              <div className="text-red-500 text-xs italic text-center bg-red-950/20 py-2 rounded border border-red-900/30">
                {error}
              </div>
            )}
            
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="fantasy-button flex-1 opacity-50 hover:opacity-100"
              >
                Отмена
              </button>
              <button type="submit" className="fantasy-button flex-1">
                Создать
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-4xl px-4">
        <div className="flex justify-between items-end mb-8 border-b border-fantasy-border pb-4">
          <div>
            <h2 className="text-4xl font-serif text-fantasy-accent uppercase tracking-tighter">Ваши герои</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-1">Выберите своего чемпиона</p>
          </div>
          <button onClick={logout} className="text-[10px] text-gray-500 hover:text-red-500 uppercase tracking-widest transition-colors mb-1">
            Выйти из аккаунта
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userCharacters.map((char) => (
            <div
              key={char.id}
              onClick={() => selectCharacter(char).catch(err => console.error('Failed to select character:', err))}
              className="fantasy-panel p-6 cursor-pointer hover:border-fantasy-accent transition-all group relative overflow-hidden"
            >
              {/* Background accent on hover */}
              <div className="absolute inset-0 bg-fantasy-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-fantasy-dark border border-fantasy-border flex items-center justify-center text-fantasy-accent">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif text-white group-hover:text-fantasy-accent transition-colors">
                      {char.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest bg-fantasy-dark px-2 py-0.5 rounded">
                        {races.find(r => r.id === char.raceId)?.name || 'Неизвестно'}
                      </span>
                      <span className="text-[10px] text-fantasy-accent uppercase tracking-widest">
                        Ранг: {char.rankId}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => handleDelete(e, char.id, char.name)}
                  className="text-gray-600 hover:text-red-500 transition-colors p-2"
                  title="Удалить персонажа"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-6 relative">
                <div className="flex flex-col items-center p-2 bg-fantasy-dark/50 border border-fantasy-border/30">
                  <Shield size={14} className="text-blue-400 mb-1" />
                  <span className="text-[10px] text-gray-500 uppercase">Сущность</span>
                  <span className="text-xs text-white">{char.stats.essence.current}/{char.stats.essence.max}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-fantasy-dark/50 border border-fantasy-border/30">
                  <Zap size={14} className="text-yellow-400 mb-1" />
                  <span className="text-[10px] text-gray-500 uppercase">Энергия</span>
                  <span className="text-xs text-white">{char.stats.energy.current}/{char.stats.energy.max}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-fantasy-dark/50 border border-fantasy-border/30">
                  <Plus size={14} className="text-green-400 mb-1" />
                  <span className="text-[10px] text-gray-500 uppercase">Золото</span>
                  <span className="text-xs text-white">{char.money}</span>
                </div>
              </div>
            </div>
          ))}

          {userCharacters.length < 10 && (
            <div
              onClick={() => setShowCreate(true)}
              className="fantasy-panel p-6 cursor-pointer border-dashed border-fantasy-border hover:border-fantasy-accent transition-all flex flex-col items-center justify-center min-h-[160px] group"
            >
              <div className="w-12 h-12 rounded-full border border-fantasy-border group-hover:border-fantasy-accent flex items-center justify-center text-gray-500 group-hover:text-fantasy-accent transition-all mb-3">
                <Plus size={24} />
              </div>
              <span className="text-[10px] text-gray-500 group-hover:text-fantasy-accent uppercase tracking-widest transition-all font-bold">
                Создать нового героя
              </span>
              <span className="text-[9px] text-gray-600 mt-1">
                ({userCharacters.length} / 10)
              </span>
            </div>
          )}
        </div>
        
        {userCharacters.length === 0 && !showCreate && (
          <div className="mt-12 text-center text-gray-600 italic">
            У вас пока нет героев. Самое время создать первого!
          </div>
        )}
      </div>
    </div>
  );
};

