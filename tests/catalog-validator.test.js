const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {
  validateCatalog,
  validateCatalogFile,
  extractPlaceholders
} = require('../tools/validate-catalogs.js');

describe('Catalog Validator (R1)', () => {
  const sampleSourceStrings = new Set([
    'Labour Market Portal',
    'Registered Employers',
    'Export Report',
    'Search employers',
    'Are you sure you want to suspend access for {name}? A comment is required to proceed.',
    'Please enter a comment before submitting.',
    'Suspend Employer',
    'Return Employer Registration'
  ]);

  describe('extractPlaceholders', () => {
    it('extracts placeholder tokens correctly from strings', () => {
      assert.deepEqual(extractPlaceholders('Hello {name}, welcome to {city}!'), ['city', 'name']);
      assert.deepEqual(extractPlaceholders('Static string without placeholders'), []);
      assert.deepEqual(extractPlaceholders('Repeated {id} and {id} tokens'), ['id']);
    });
  });

  describe('validateCatalog in-memory checks', () => {
    // Spec Test 1: validator rejects a stale key (R1)
    it('Spec Test 1: rejects a stale key not present in English source strings', () => {
      const catalog = {
        'Export Report': 'Exporter le rapport',
        'Stale Nonexistent Key': 'Clé inexistante'
      };

      const result = validateCatalog(catalog, sampleSourceStrings);
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((err) => err.includes('Stale') && err.includes('Stale Nonexistent Key')),
        `Expected error mentioning stale key, got: ${JSON.stringify(result.errors)}`
      );
    });

    // Spec Test 2: validator rejects placeholder mismatch (R1)
    it('Spec Test 2: rejects placeholder mismatch between source and translation', () => {
      const catalog = {
        'Are you sure you want to suspend access for {name}? A comment is required to proceed.':
          'Êtes-vous sûr de vouloir suspendre l\'accès pour {nom} ? Un commentaire est requis pour continuer.'
      };

      const result = validateCatalog(catalog, sampleSourceStrings);
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((err) => err.includes('Placeholder mismatch') && err.includes('{name}')),
        `Expected placeholder mismatch error, got: ${JSON.stringify(result.errors)}`
      );
    });

    // Spec Test 3: validator rejects an empty value (R1)
    it('Spec Test 3: rejects empty translation values ("")', () => {
      const catalog = {
        'Export Report': '',
        'Registered Employers': 'Employeurs enregistrés'
      };

      const result = validateCatalog(catalog, sampleSourceStrings);
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((err) => err.includes('Empty translation value') && err.includes('Export Report')),
        `Expected empty translation error, got: ${JSON.stringify(result.errors)}`
      );
    });

    it('rejects non-string translation values (numbers, objects, null, arrays)', () => {
      const catalog = {
        'Export Report': 12345,
        'Registered Employers': null,
        'Search employers': { nested: 'value' },
        'Suspend Employer': ['Suspendre']
      };

      const result = validateCatalog(catalog, sampleSourceStrings);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((err) => err.includes('must be a string') && err.includes('Export Report')));
      assert.ok(result.errors.some((err) => err.includes('must be a string') && err.includes('Registered Employers')));
      assert.ok(result.errors.some((err) => err.includes('must be a string') && err.includes('Search employers')));
      assert.ok(result.errors.some((err) => err.includes('must be a string') && err.includes('Suspend Employer')));
    });

    it('rejects unsorted catalog keys', () => {
      const catalog = {
        'Search employers': 'Rechercher des employeurs',
        'Export Report': 'Exporter le rapport',
        'Labour Market Portal': 'Portail du Marché du Travail'
      };

      const result = validateCatalog(catalog, sampleSourceStrings);
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((err) => err.includes('must be sorted alphabetically')),
        `Expected sort order error, got: ${JSON.stringify(result.errors)}`
      );
    });

    it('accepts a valid sorted catalog with valid strings and matching placeholders', () => {
      const catalog = {
        'Are you sure you want to suspend access for {name}? A comment is required to proceed.':
          'Êtes-vous sûr de vouloir suspendre l\'accès pour {name} ? Un commentaire est requis pour continuer.',
        'Export Report': 'Exporter le rapport',
        'Labour Market Portal': 'Portail du Marché du Travail',
        'Registered Employers': 'Employeurs enregistrés'
      };

      const result = validateCatalog(catalog, sampleSourceStrings);
      assert.equal(result.valid, true);
      assert.deepEqual(result.errors, []);
    });
  });

  describe('validateCatalogFile with fixture catalogs', () => {
    const fixturesDir = path.join(__dirname, 'fixtures', 'catalogs');

    it('accepts valid.fr.json fixture', () => {
      const filePath = path.join(fixturesDir, 'valid.fr.json');
      const result = validateCatalogFile(filePath);
      assert.equal(result.valid, true, `Expected valid.fr.json to pass, errors: ${result.errors.join('; ')}`);
    });

    it('rejects stale.fr.json fixture when validated against mini.html source strings', () => {
      const filePath = path.join(fixturesDir, 'stale.fr.json');
      const result = validateCatalogFile(filePath, sampleSourceStrings);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((err) => err.includes('Old Nonexistent String Key')));
    });

    it('rejects mismatch.fr.json fixture due to placeholder mismatch', () => {
      const filePath = path.join(fixturesDir, 'mismatch.fr.json');
      const result = validateCatalogFile(filePath, sampleSourceStrings);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((err) => err.includes('Placeholder mismatch')));
    });

    it('rejects empty.fr.json fixture due to empty string value', () => {
      const filePath = path.join(fixturesDir, 'empty.fr.json');
      const result = validateCatalogFile(filePath, sampleSourceStrings);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((err) => err.includes('Empty translation value')));
    });
  });
});
