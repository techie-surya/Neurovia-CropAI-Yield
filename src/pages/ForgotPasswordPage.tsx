import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../context/LanguageContext';

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/reset-password');
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">{t('forgotPassword')}</h2>
      <p className="text-sm text-gray-600 mb-4">{t('forgotInstructions')}</p>
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
        <button
          type="submit"
          className="w-full py-2.5 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors"
        >
          {t('sendResetLink')}
        </button>
        <div className="text-sm text-center">
          <Link to="/login" className="text-green-700 font-semibold hover:underline">
            {t('backToLogin')}
          </Link>
        </div>
      </form>
    </div>
  );
}
