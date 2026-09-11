import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations, LANGUAGES } from './translations.js';

const STORAGE_KEY = 'auralife.language';
const LanguageContext = createContext(null);

function resolve(dict, path) {
  return path.split('.').reduce((node, key) => (node && node[key] !== undefined ? node[key] : undefined), dict);
}

function readSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && translations[saved] ? saved : 'en';
  } catch {
    return 'en';
  }
}

/**
 * App-wide language selection.
 *
 * `t(key, vars)` looks up a dot-path in the current language's dictionary,
 * falling back to English for any key a translation hasn't reached yet — so a
 * missing string never renders blank, only in English. Selection persists to
 * localStorage the same way the hospital/patient choices already do.
 */
export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readSaved);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!translations[code]) return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* storage may be unavailable; the choice still applies for this session */
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const raw = resolve(translations[lang], key) ?? resolve(translations.en, key) ?? key;
      if (!vars) return raw;
      return Object.entries(vars).reduce(
        (str, [name, value]) => str.replace(new RegExp(`\\{${name}\\}`, 'g'), value),
        raw,
      );
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, languages: LANGUAGES }),
    [lang, setLang, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within <LanguageProvider>');
  return ctx;
}
