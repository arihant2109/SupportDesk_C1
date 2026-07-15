import { describe, expect, it } from 'vitest';
import { formatDate, safeRedirect } from '@/lib/utils';

describe('safeRedirect', () => {
  it('allows internal paths', () => {
    expect(safeRedirect('/tickets')).toBe('/tickets');
    expect(safeRedirect('/tickets/abc')).toBe('/tickets/abc');
  });

  it('blocks external and protocol-relative URLs', () => {
    expect(safeRedirect('https://evil.com')).toBe('/tickets');
    expect(safeRedirect('//evil.com')).toBe('/tickets');
    expect(safeRedirect(null)).toBe('/tickets');
  });
});

describe('formatDate', () => {
  it('returns fallback for invalid dates', () => {
    expect(formatDate('')).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('formats valid ISO dates', () => {
    expect(formatDate('2025-01-15T10:00:00.000Z')).toContain('2025');
  });
});
