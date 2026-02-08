import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import ptBR from '../locales/pt-BR.json';
import enUS from '../locales/en-US.json';
import zhCN from '../locales/zh-CN.json';
import esES from '../locales/es-ES.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'zh-CN': { translation: zhCN },
  'es-ES': { translation: esES },
};

// Get saved language or default to pt-BR
const savedLanguage = localStorage.getItem('app-language') || 'pt-BR';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
  });

// Listen for language changes and persist to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('app-language', lng);
});

export default i18n;
