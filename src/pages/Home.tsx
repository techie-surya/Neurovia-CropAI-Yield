import { AuthMode } from '../components/AuthModal';
import { useI18n } from '../context/LanguageContext';

interface HomeProps {
  onOpenAuth: (mode: AuthMode) => void;
}

export function Home({ onOpenAuth }: HomeProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-16">
      <h1 className="text-3xl font-bold text-gray-800">{t('heroTitle')}</h1>
      <p className="text-gray-600 max-w-xl">{t('heroSubtitle')}</p>
      <div className="flex gap-4">
        <button
          onClick={() => onOpenAuth('login')}
          className="px-5 py-3 rounded-lg bg-green-600 text-white font-semibold shadow-md hover:bg-green-700 transition-colors"
        >
          {t('landingLogin')}
        </button>
        <button
          onClick={() => onOpenAuth('register')}
          className="px-5 py-3 rounded-lg border border-green-600 text-green-700 font-semibold bg-white hover:bg-green-50 transition-colors"
        >
          {t('landingRegister')}
        </button>
      </div>
    </div>
  );
}
