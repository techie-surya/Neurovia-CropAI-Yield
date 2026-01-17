import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../context/LanguageContext';
import { authAPI } from '../utils/api';

export function RegisterPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', aadhar: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateEmail = (email: string) => {
    // Accept either email format or mobile number (10 digits)
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    const mobileRegex = /^\d{10}$/;
    return emailRegex.test(email) || mobileRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name) {
      setError('Name is required');
      return;
    }
    if (!validateEmail(form.email)) {
      setError(t('email'));
      return;
    }
    if (!/^\d{12}$/.test(form.aadhar)) {
      setError(t('aadhar'));
      return;
    }
    if (form.password !== form.confirm) {
      setError(t('confirmPassword'));
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.register({
        name: form.name,
        email: form.email,
        aadhar: form.aadhar,
        password: form.password
      });

      if (result.access_token) {
        // Store user data
        if (result.user) {
          localStorage.setItem('currentUser', JSON.stringify(result.user));
        }
        window.alert(t('successRegistration'));
        // Give localStorage a moment to be read, then redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('register')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
          <input
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder={t('name')}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email/Mobile No.</label>
          <input
            type="text"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder="Enter email or mobile number"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('aadhar')}</label>
          <input
            value={form.aadhar}
            onChange={(e) => handleChange('aadhar', e.target.value.replace(/\D/g, '').slice(0, 12))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder="123456789012"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder={t('password')}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmPassword')}</label>
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => handleChange('confirm', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder={t('confirmPassword')}
            required
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : t('register')}
        </button>
        <div className="text-sm text-center">
          {t('loginLink')}{' '}
          <Link to="/login" className="text-green-700 font-semibold hover:underline">
            {t('login')}
          </Link>
        </div>
      </form>
    </div>
  );
}
