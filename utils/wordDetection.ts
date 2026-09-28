import { getVariantsForLanguage, type ParentCategory } from '@/constants/wordVariants';

export interface WordDetectionResult {
  word: ParentCategory;
  variant: string;
  count: number;
  positions: number[];
}

export interface WordDetectionSummary {
  mumCount: number;
  dadCount: number;
  totalDetections: number;
  detectedWords: string[];
}

const DEFAULT_LANGUAGE = 'en';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPattern(variants: string[]): RegExp {
  const sorted = [...variants].sort((a, b) => b.length - a.length);
  const alternation = sorted.map(escapeRegex).join('|');
  return new RegExp(`(?:^|[^a-zà-öø-ÿ])(${alternation})(?=[^a-zà-öø-ÿ]|$)`, 'gi');
}

export function detectTargetWords(transcript: string, language: string = DEFAULT_LANGUAGE): WordDetectionResult[] {
  const variants = getVariantsForLanguage(language);
  const normalizedTranscript = transcript.toLowerCase();
  const results: WordDetectionResult[] = [];

  (['mum', 'dad'] as ParentCategory[]).forEach(category => {
    const wordList = variants[category];
    const pattern = buildPattern(wordList);
    const positions: number[] = [];
    let match: RegExpExecArray | null;

    pattern.lastIndex = 0;
    while ((match = pattern.exec(normalizedTranscript)) !== null) {
      positions.push(match.index + match[0].length - match[1].length);
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex++;
      }
    }

    if (positions.length > 0) {
      results.push({
        word: category,
        variant: '',
        count: positions.length,
        positions,
      });
    }
  });

  return results;
}

export function getWordDetectionSummary(
  transcript: string,
  language: string = DEFAULT_LANGUAGE
): WordDetectionSummary {
  const results = detectTargetWords(transcript, language);

  let mumCount = 0;
  let dadCount = 0;
  const detectedWords: string[] = [];

  results.forEach(result => {
    if (result.word === 'mum') {
      mumCount += result.count;
      for (let i = 0; i < result.count; i++) {
        detectedWords.push('mum');
      }
    } else if (result.word === 'dad') {
      dadCount += result.count;
      for (let i = 0; i < result.count; i++) {
        detectedWords.push('dad');
      }
    }
  });

  return {
    mumCount,
    dadCount,
    totalDetections: mumCount + dadCount,
    detectedWords,
  };
}
