import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../context/LanguageContext';

export function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(t('submit'));
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('login')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder={t('email')}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder={t('password')}
            required
          />
          <div className="text-right mt-1 text-sm">
            <Link to="/forgot-password" className="text-green-700 hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-2.5 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors"
        >
          {t('login')}
        </button>
        <div className="text-sm text-center">
          {t('registerLink')}{' '}
          <Link to="/register" className="text-green-700 font-semibold hover:underline">
            {t('register')}
          </Link>
        </div>
      </form>
    </div>
  );
}
