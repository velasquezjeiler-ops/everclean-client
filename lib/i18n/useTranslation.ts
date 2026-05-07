'use client';
import { useState, useEffect, useCallback } from 'react';

import en from './en.json';
import es from './es.json';

const LANGS: Record<string, any> = { en, es };

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'es', label: 'Espanol', short: 'ES' },
];

function normalizeLang(code: string | null) {
  return code && LANGS[code] ? code : 'en';
}

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return path;
    current = current[key];
  }
  return typeof current === 'string' ? current : path;
}

export function useTranslation() {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    const applyLanguage = (code: string | null) => {
      const next = normalizeLang(code);
      setLangState(next);
      if (code !== next) localStorage.setItem('lang', next);
    };

    applyLanguage(localStorage.getItem('lang'));

    const handleLanguageChange = (event: Event) => {
      applyLanguage((event as CustomEvent<string>).detail || localStorage.getItem('lang'));
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'lang') applyLanguage(event.newValue);
    };

    window.addEventListener('everclean:language-change', handleLanguageChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('everclean:language-change', handleLanguageChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setLang = useCallback((code: string) => {
    const next = normalizeLang(code);
    setLangState(next);
    localStorage.setItem('lang', next);
    window.dispatchEvent(new CustomEvent('everclean:language-change', { detail: next }));
  }, []);

  const t = useCallback((key: string): string => {
    const translation = getNestedValue(LANGS[lang], key);
    if (translation !== key) return translation;
    return getNestedValue(LANGS.en, key);
  }, [lang]);

  return { t, lang, setLang };
}
