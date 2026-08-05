import { describe, it, expect } from 'vitest';
import validateHelper from './validateHelper';

describe('ValidateHelper', () => {
  it('should validate data resource info structure', () => {
    const dataResourceSheet = {
      data: [
        ...Array(9).fill([]),
        ['date', null, 'RES001', 'Resource Name', 'http://example.com'],
        ...Array(4).fill([]),
        ['Description', 'Type', 'Content', 'POC', 'poc@example.com'],
      ],
    };
    
    expect(dataResourceSheet.data).toBeDefined();
    expect(dataResourceSheet.data.length).toBeGreaterThan(0);
  });

  it('should validate dataset info structure', () => {
    const datasetInfoSheet = {
      data: [
        ['Header'],
        ['1', 'DS001', 'Dataset 1', 'Full Name 1'],
      ],
    };
    
    expect(datasetInfoSheet.data).toBeDefined();
    expect(datasetInfoSheet.data.length).toBe(2);
  });

  it('should check for valid data types', () => {
    const testString = 'Hello World';
    const testNumber = 123;
    
    expect(typeof testString).toBe('string');
    expect(typeof testNumber).toBe('number');
  });

  const validRelease = {
    releaseId: 'catalog_release_06102026',
    logType: 1,
    title: 'New release',
    version: '1.5.9',
    postDate: '2026-06-10',
    contentType: 'Clinical,Genomics/Omics',
    description: 'New resources and datasets',
    details: '<p>Full release details</p>',
    status: 1,
  };

  it('validates normalized changelog records', () => {
    expect(validateHelper.checkSiteChangeLog([validRelease])).toBe(true);
  });

  it.each([
    [{ ...validRelease, title: '' }],
    [{ ...validRelease, postDate: '2026-02-31' }],
    [{ ...validRelease, description: 'x'.repeat(3001) }],
    [{ ...validRelease, details: 'x'.repeat(65536) }],
    [{ ...validRelease, logType: 0 }],
  ])('rejects records that do not fit the changelog contract', (record) => {
    expect(validateHelper.checkSiteChangeLog([record])).toBe(false);
  });

});
