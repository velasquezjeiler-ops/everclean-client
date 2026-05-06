'use client';
import { useState, useEffect, useCallback } from 'react';

import en from './en.json';
import es from './es.json';
import zh from './zh.json';
import tl from './tl.json';
import vi from './vi.json';
import ar from './ar.json';
import fr from './fr.json';
import ko from './ko.json';
import ru from './ru.json';
import pt from './pt.json';

const LANGS: Record<string, any> = { en, es, zh, tl, vi, ar, fr, ko, ru, pt };

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'zh', label: '中文', short: 'ZH' },
  { code: 'tl', label: 'Tagalog', short: 'TL' },
  { code: 'vi', label: 'Tiếng Việt', short: 'VI' },
  { code: 'ar', label: 'العربية', short: 'AR' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'ko', label: '한국어', short: 'KO' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'pt', label: 'Português', short: 'PT' },
];

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
      if (code && LANGS[code]) setLangState(code);
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
    if (LANGS[code]) {
      setLangState(code);
      localStorage.setItem('lang', code);
      window.dispatchEvent(new CustomEvent('everclean:language-change', { detail: code }));
    }
  }, []);

  const t = useCallback((key: string): string => {
    const translation = getNestedValue(LANGS[lang], key);
    if (translation !== key) return translation;
    return getNestedValue(LANGS.en, key);
  }, [lang]);

  return { t, lang, setLang };
}
