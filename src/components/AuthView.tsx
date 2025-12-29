// 📁 src/components/AuthView.tsx - Authentication component
// 🎯 Core function: Login and Registration forms
// 🔗 Key dependencies: React, useGameStore
// 💡 Usage: Shown when user is not authenticated

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  
  const { login: loginAction, register: registerAction } = useGameStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await loginAction(login, password);
      } else {
        await registerAction(login, password, isAdmin ? 'ADMIN' : 'USER');
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="fantasy-panel p-8 w-full max-w-md">
        <h2 className="text-3xl font-serif text-fantasy-accent mb-6 text-center uppercase tracking-widest">
          {isLogin ? 'Вход в мир' : 'Регистрация'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Логин</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full bg-fantasy-dark border border-fantasy-border p-2 text-white focus:border-fantasy-accent outline-none"
              placeholder="Введите логин"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-fantasy-dark border border-fantasy-border p-2 text-white focus:border-fantasy-accent outline-none"
              placeholder="Введите пароль"
              required
            />
          </div>
          
          {!isLogin && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="admin-check"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="accent-fantasy-accent"
              />
              <label htmlFor="admin-check" className="text-[10px] text-gray-500 uppercase tracking-widest">
                Аккаунт администратора (тест)
              </label>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-xs italic text-center bg-red-950/20 py-2 rounded border border-red-900/30">
              {error}
            </div>
          )}
          
          <button type="submit" className="fantasy-button w-full py-3 mt-4">
            {isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] text-fantasy-accent/60 hover:text-fantasy-accent uppercase tracking-widest transition-colors"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-gray-600 text-[10px] uppercase tracking-[0.2em] animate-pulse">
        Где сталь встречается с сущностью...
      </p>
    </div>
  );
};

