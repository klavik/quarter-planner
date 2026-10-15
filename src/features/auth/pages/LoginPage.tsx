import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { Zap } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    const demoEmail = 'demo@mars.com';
    const demoPass = '123456';
    
    try {
      // Пытаемся войти
      await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      navigate('/');
    } catch (err: any) {
      // Если юзера нет в эмуляторе — создаем его
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          navigate('/');
        } catch (regErr: any) {
          setError(regErr.message || 'Ошибка демо-регистрации');
        }
      } else {
        setError(err.message || 'Ошибка демо-входа');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Quarter Planner</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Вход в систему</p>

        {/* ДЕМО-ВХОД */}
        <button 
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md py-3 font-medium hover:opacity-90 flex items-center justify-center gap-2 shadow-sm transition-opacity disabled:opacity-50"
        >
          <Zap className="w-5 h-5 fill-white" />
          Войти как Demo-пользователь
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-400">или вручную</span></div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">{error}</div>}

        {/* СТАНДАРТНАЯ ФОРМА */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gray-800 text-white rounded-md py-2 hover:bg-gray-900 transition-colors disabled:opacity-50">
            {loading ? 'Загрузка...' : (isRegistering ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-blue-600 hover:underline">
            {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
}
