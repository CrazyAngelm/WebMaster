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
  const [role, setRole] = useState<'USER' | 'ADMIN' | 'OWNER'>('USER');
  const [error, setError] = useState('');
  
  const { login: loginAction, register: registerAction } = useGameStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ed9326f9-e391-494c-aca3-eda4169daf85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthView.tsx:18',message:'handleSubmit called',data:{isLogin,loginLength:login.length,passwordLength:password.length,role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    try {
      if (isLogin) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ed9326f9-e391-494c-aca3-eda4169daf85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthView.tsx:24',message:'Calling loginAction',data:{login},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        await loginAction(login, password);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ed9326f9-e391-494c-aca3-eda4169daf85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthView.tsx:27',message:'loginAction completed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      } else {
        await registerAction(login, password, role);
      }
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ed9326f9-e391-494c-aca3-eda4169daf85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthView.tsx:29',message:'Auth error caught',data:{errorMessage:err?.message,errorType:err?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Роль (тест)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-fantasy-dark border border-fantasy-border p-2 text-white focus:border-fantasy-accent outline-none"
              >
                <option value="USER">Игрок</option>
                <option value="ADMIN">Администратор</option>
                <option value="OWNER">Владелец (Owner)</option>
              </select>
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

