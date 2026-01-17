import { useEffect, useState } from 'react';
import { useI18n } from '../context/LanguageContext';
import { authAPI } from '../utils/api';

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

interface AuthModalProps {
  open: boolean;
  mode: AuthMode | null;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onLoginSuccess: () => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthModal({ open, mode, onClose, onModeChange, onLoginSuccess }: AuthModalProps) {
  const { t } = useI18n();
  const [loginAadhar, setLoginAadhar] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', aadhar: '', password: '', confirm: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetForm, setResetForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  useEffect(() => {
    setError('');
    setInfo('');
  }, [mode, open]);

  let title = '';
  if (mode === 'login') title = t('modalTitleLogin');
  else if (mode === 'register') title = t('modalTitleRegister');
  else if (mode === 'forgot') title = t('modalTitleForgot');
  else if (mode === 'reset') title = t('modalTitleReset');

  if (!open || !mode) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    try {
      if (!/^\d{12}$/.test(loginAadhar)) {
        setError('Please enter a valid 12-digit Aadhar Card Number');
        return;
      }
      if (!loginPassword) {
        setError(t('password'));
        return;
      }

      // Call backend login API
      const response = await authAPI.login({
        email: loginAadhar,
        password: loginPassword,
      });

      // Save user data to localStorage
      if (response.user) {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
      }

      setInfo(t('successLogin') || 'Login successful!');
      
      // Reset form
      setLoginAadhar('');
      setLoginPassword('');

      // Close modal and call success callback after a short delay
      setTimeout(() => {
        onClose();
        onLoginSuccess();
      }, 1000);
    } catch (err: any) {
      setError(err.message || t('loginFailed') || 'Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    try {
      if (!registerForm.name) {
        setError(t('name') + ' ' + t('required'));
        return;
      }
      // Accept either email format or mobile number (10 digits)
      const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
      const mobileRegex = /^\d{10}$/;
      if (!emailRegex.test(registerForm.email) && !mobileRegex.test(registerForm.email)) {
        setError('Please enter a valid email or 10-digit mobile number');
        return;
      }
      if (!/^\d{12}$/.test(registerForm.aadhar)) {
        setError(t('aadharInvalid'));
        return;
      }
      if (registerForm.password !== registerForm.confirm) {
        setError(t('passwordMismatch'));
        return;
      }

      // Call backend register API
      await authAPI.register({
        name: registerForm.name,
        email: registerForm.email,
        aadhar: registerForm.aadhar,
        password: registerForm.password,
      });

      setInfo(t('successRegistration') || 'Registration successful!');
      
      // Reset form
      setRegisterForm({ name: '', email: '', aadhar: '', password: '', confirm: '' });

      // Switch to login mode after success
      setTimeout(() => {
        onModeChange('login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailRegex.test(forgotEmail)) {
      setError(t('invalidEmail'));
      return;
    }
    setInfo(t('resetLinkSent'));
    onModeChange('reset');
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (resetForm.password !== resetForm.confirm) {
      setError(t('passwordMismatch'));
      return;
    }
    setInfo(t('successReset'));
    onModeChange('login');
  };

  const renderLogin = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Card Number</label>
        <input
          type="text"
          value={loginAadhar}
          onChange={(e) => setLoginAadhar(e.target.value.replace(/\D/g, '').slice(0, 12))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="123456789012"
          maxLength={12}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
        <input
          type="password"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <div className="text-right mt-1 text-sm">
          <button
            type="button"
            onClick={() => onModeChange('forgot')}
            className="text-green-700 hover:underline"
          >
            {t('forgotPassword')}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-green-700">{info}</p>}
      <button
        type="submit"
        className="w-full py-2.5 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors"
      >
        {t('signIn')}
      </button>
      <p className="text-sm text-center text-gray-700">
        {t('noAccount')}{' '}
        <button type="button" onClick={() => onModeChange('register')} className="text-green-700 font-semibold hover:underline">
          {t('registerLink')}
        </button>
      </p>
    </form>
  );

  const renderRegister = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
        <input
          value={registerForm.name}
          onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email/Mobile No.</label>
        <input
          type="text"
          value={registerForm.email}
          onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Enter email or mobile number"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('aadhar')}</label>
        <input
          value={registerForm.aadhar}
          onChange={(e) => setRegisterForm((prev) => ({ ...prev, aadhar: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="123456789012"
          maxLength={12}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
        <input
          type="password"
          value={registerForm.password}
          onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmPassword')}</label>
        <input
          type="password"
          value={registerForm.confirm}
          onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirm: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-green-700">{info}</p>}
      <button
        type="submit"
        className="w-full py-2.5 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors"
      >
        {t('register')}
      </button>
      <p className="text-sm text-center text-gray-700">
        {t('alreadyAccount')}{' '}
        <button type="button" onClick={() => onModeChange('login')} className="text-green-700 font-semibold hover:underline">
          {t('loginLink')}
        </button>
      </p>
    </form>
  );

  const renderForgot = () => (
    <form onSubmit={handleForgot} className="space-y-4">
      <p className="text-sm text-gray-600">{t('forgotInstructions')}</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
        <input
          type="email"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-green-700">{info}</p>}
      <button
        type="submit"
        className="w-full py-2.5 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors"
      >
        {t('sendResetLink')}
      </button>
      <p className="text-sm text-center text-gray-700">
        <button type="button" onClick={() => onModeChange('login')} className="text-green-700 font-semibold hover:underline">
          {t('backToLogin')}
        </button>
      </p>
    </form>
  );

  const renderReset = () => (
    <form onSubmit={handleReset} className="space-y-4">
      <p className="text-sm text-gray-600">{t('sendLinkNote')}</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('newPassword')}</label>
        <input
          type="password"
          value={resetForm.password}
          onChange={(e) => setResetForm((prev) => ({ ...prev, password: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmNewPassword')}</label>
        <input
          type="password"
          value={resetForm.confirm}
          onChange={(e) => setResetForm((prev) => ({ ...prev, confirm: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-green-700">{info}</p>}
      <button
        type="submit"
        className="w-full py-2.5 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors"
      >
        {t('resetPassword')}
      </button>
      <p className="text-sm text-center text-gray-700">
        <button type="button" onClick={() => onModeChange('login')} className="text-green-700 font-semibold hover:underline">
          {t('backToLogin')}
        </button>
      </p>
    </form>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '28rem',
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.1)',
          padding: '1.5rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label={t('close')}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '1.5rem',
            lineHeight: 1,
            border: 'none',
            background: 'none'
          }}
        >
          ×
        </button>
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '0.5rem'
        }}>{title}</h2>
        <p style={{
          fontSize: '0.875rem',
          color: '#4b5563',
          marginBottom: '1rem'
        }}>
          {mode === 'login' && t('headerSubtitle')}
          {mode === 'register' && t('heroSubtitle')}
          {mode === 'forgot' && t('forgotInstructions')}
          {mode === 'reset' && t('sendLinkNote')}
        </p>
        {mode === 'login' && renderLogin()}
        {mode === 'register' && renderRegister()}
        {mode === 'forgot' && renderForgot()}
        {mode === 'reset' && renderReset()}
      </div>
    </div>
  );
}
