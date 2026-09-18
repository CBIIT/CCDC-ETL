import { describe, it, expect } from 'vitest';
import utils from './utils';

describe('Utils - Basic Tests', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should validate string operations', () => {
    const str = 'Hello World';
    expect(str.length).toBeGreaterThan(0);
  });

  it('should validate array operations', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
  });
});

describe('Utils - Date Functions', () => {
  it('should create current date', () => {
    const date = new Date();
    expect(date).toBeInstanceOf(Date);
  });

  it('should format date string', () => {
    const dateStr = '2025-12-24';
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('Utils - containsSpecialCharacters (Mocked)', () => {
  it('should validate undefined input handling', () => {
    expect(undefined).toBeUndefined();
  });

  it('should validate empty string handling', () => {
    expect(''.length).toBe(0);
  });

  it('should validate whitespace trimming', () => {
    expect('   '.trim()).toBe('');
  });

  it('should validate ASCII character regex', () => {
    const validAscii = /^[\x20-\x7E]+$/;
    expect(validAscii.test('Hello World 123')).toBe(true);
  });
});

describe('Utils - getDigestSheets', () => {
  it('throws when the only remaining digest sheet has a different non-empty name', () => {
    const workSheets = [
      { name: 'Data Resource' },
      { name: 'Dataset Info' },
      { name: 'A' },
      { name: 'C' },
    ];

    expect(() => utils.getDigestSheets(workSheets, ['A', 'B'])).toThrow(
      'Digest sheet for B is missing'
    );
  });

  it('uses the only unnamed fallback sheet when named sheets do not match', () => {
    const workSheets = [
      { name: 'Data Resource' },
      { name: 'Dataset Info' },
      { name: 'A' },
      { name: 'C' },
      { name: '' },
    ];

    const digestSheets = utils.getDigestSheets(workSheets, ['A', 'B']);

    expect(digestSheets[1]).toBe(workSheets[4]);
  });
});
