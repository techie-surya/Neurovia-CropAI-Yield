import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useI18n } from '../context/LanguageContext';

export function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError(t('confirmNewPassword'));
      return;
    }
    window.alert(t('successReset'));
    navigate('/login');
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('resetPassword')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('newPassword')}</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder={t('newPassword')}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmNewPassword')}</label>
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder={t('confirmNewPassword')}
            required
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-2.5 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors"
        >
          {t('resetPassword')}
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
