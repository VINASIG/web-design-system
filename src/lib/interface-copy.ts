import dictionary from '../locales/runtime-vi.json' with { type: 'json' };
import { translateCopy } from './localization';

const patterns = Object.entries(dictionary)
  .filter(([key]) => /\{\d+\}/.test(key))
  .sort(([first], [second]) => second.length - first.length)
  .map(([key, value]) => {
    const indices: number[] = [];
    const parts = key.split(/(\{\d+\})/).map((part) => {
      if (/^\{\d+\}$/.test(part)) {
        indices.push(Number(part.slice(1, -1)));
        return '(.*?)';
      }
      return part.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
    });
    const preserveValues = /^(?:Saved |Reset to |Use |No projects found|.*recipients\.)/.test(key);
    return { expression: new RegExp('^' + parts.join('') + '$'), value, indices, preserveValues };
  });

/** Localize authored interface output, preserving interpolated user input. */
export function interfaceCopy(input: string | null | undefined): string {
  const value = input ?? '';
  if (typeof document === 'undefined' || document.documentElement.lang !== 'vi') return value;
  const exact = translateCopy(value, dictionary);
  if (exact !== value) return exact;
  for (const pattern of patterns) {
    const match = pattern.expression.exec(value);
    if (!match) continue;
    return pattern.value.replace(/\{(\d+)\}/g, (_placeholder, index: string) => {
      const position = pattern.indices.indexOf(Number(index));
      const captured = position < 0 ? '' : match[position + 1] ?? '';
      return pattern.preserveValues ? captured : translateCopy(captured, dictionary);
    });
  }
  return value;
}
