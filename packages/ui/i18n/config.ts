import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import ptBR from '../locales/pt-BR.json';
import enUS from '../locales/en-US.json';
import zhCN from '../locales/zh-CN.json';
import esES from '../locales/es-ES.json';

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en-US', 'es-ES', 'zh-CN'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const DEFAULT_LANGUAGE: SupportedLanguage = 'pt-BR';
const LANGUAGE_STORAGE_KEY = 'app-language';

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'zh-CN': { translation: zhCN },
  'es-ES': { translation: esES },
};

const LANGUAGE_BY_BASE: Record<string, SupportedLanguage> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  zh: 'zh-CN',
};

function resolveSupportedLanguage(candidate: string | null | undefined): SupportedLanguage | null {
  if (!candidate) return null;

  const normalized = candidate.trim();
  if (!normalized) return null;

  const exact = SUPPORTED_LANGUAGES.find(
    (language) => language.toLowerCase() === normalized.toLowerCase(),
  );
  if (exact) return exact;

  const base = normalized.toLowerCase().split('-')[0];
  return LANGUAGE_BY_BASE[base] ?? null;
}

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  try {
    const stored = resolveSupportedLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // ignore storage access errors (privacy mode, restricted contexts)
  }

  const browserCandidates = [
    ...(Array.isArray(window.navigator.languages) ? window.navigator.languages : []),
    window.navigator.language,
  ];

  for (const candidate of browserCandidates) {
    const resolved = resolveSupportedLanguage(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return DEFAULT_LANGUAGE;
}

const initialLanguage = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: {
      escapeValue: false,
    },
  });

// Listen for language changes and persist to localStorage
i18n.on('languageChanged', (lng) => {
  if (typeof window === 'undefined') return;
  const resolved = resolveSupportedLanguage(lng) ?? DEFAULT_LANGUAGE;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, resolved);
  } catch {
    // ignore storage write errors
  }
});

export default i18n;
