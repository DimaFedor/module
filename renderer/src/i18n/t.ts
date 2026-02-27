import { ukDictionary, type UkKey } from './uk';

export function t(key: UkKey, vars?: Record<string, string | number>): string {
  let value = ukDictionary[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}

