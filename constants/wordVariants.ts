export type ParentCategory = 'mum' | 'dad';

export interface LanguageVariants {
  [language: string]: {
    mum: string[];
    dad: string[];
  };
}

export const WORD_VARIANTS: LanguageVariants = {
  en: {
    mum: ['mum', 'mummy', 'mama', 'mom', 'mommy', 'ma', 'mamma'],
    dad: ['dad', 'daddy', 'papa', 'da', 'dada', 'pappy', 'father', 'pop'],
  },
  es: {
    mum: ['mamá', 'mama', 'mami', 'amá'],
    dad: ['papá', 'papa', 'papi', 'apá'],
  },
  fr: {
    mum: ['maman', 'maman', 'moma'],
    dad: ['papa', 'papa', 'dada'],
  },
  de: {
    mum: ['mama', 'mama', 'mutti'],
    dad: ['papa', 'papa', 'vati'],
  },
  it: {
    mum: ['mamma', 'mama'],
    dad: ['papà', 'papa', 'babbo'],
  },
  pt: {
    mum: ['mamãe', 'mãe', 'mama'],
    dad: ['papai', 'pai', 'papa'],
  },
  nl: {
    mum: ['mama', 'mam', 'moeder'],
    dad: ['papa', 'pap', 'vader'],
  },
  tr: {
    mum: ['anne', 'ana', 'mama'],
    dad: ['baba', 'dada'],
  },
};

export const DEFAULT_LANGUAGE = 'en';

export function getVariantsForLanguage(language: string): { mum: string[]; dad: string[] } {
  const langCode = language.split('-')[0].toLowerCase();
  return WORD_VARIANTS[langCode] ?? WORD_VARIANTS[DEFAULT_LANGUAGE];
}

export function getAllContextualStrings(language: string): string[] {
  const variants = getVariantsForLanguage(language);
  return [...variants.mum, ...variants.dad];
}
