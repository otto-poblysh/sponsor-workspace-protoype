#!/usr/bin/env node

/**
 * tools/validate-catalogs.js
 * 
 * Validates translation catalog schema and contents (R1):
 * - Rejects non-string values.
 * - Rejects empty translation values ("").
 * - Rejects stale keys (keys not found in English source strings set).
 * - Rejects placeholder token mismatch (e.g. {name} vs {nom}).
 * - Verifies keys are sorted alphabetically.
 */

const fs = require('node:fs');
const path = require('node:path');

/**
 * Extracts unique sorted placeholder names from a string (e.g. "{name}" -> ["name"]).
 * @param {string} str 
 * @returns {string[]}
 */
function extractPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{([a-zA-Z0-9_]+)\}/g);
  if (!matches) return [];
  const names = new Set(matches.map((m) => m.slice(1, -1)));
  return Array.from(names).sort();
}

/**
 * Validates a catalog object in-memory.
 * @param {Record<string, unknown>} catalog 
 * @param {Set<string>|string[]|null} [sourceStrings] 
 * @param {{ filePath?: string }} [options] 
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCatalog(catalog, sourceStrings = null, options = {}) {
  const errors = [];
  const filePrefix = options.filePath ? `${options.filePath}: ` : '';

  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
    return {
      valid: false,
      errors: [`${filePrefix}Catalog must be a non-null object`]
    };
  }

  const keys = Object.keys(catalog);
  const sourceSet = sourceStrings
    ? (sourceStrings instanceof Set ? sourceStrings : new Set(sourceStrings))
    : null;

  // Check 1: Key sorting (alphabetical ascending)
  const sortedKeys = [...keys].sort();
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] !== sortedKeys[i]) {
      errors.push(
        `${filePrefix}Catalog keys must be sorted alphabetically. Expected '${sortedKeys[i]}' at index ${i}, found '${keys[i]}'.`
      );
      break;
    }
  }

  // Check 2: Entries validation
  for (const [key, value] of Object.entries(catalog)) {
    // Check non-string values
    if (typeof value !== 'string') {
      const typeDesc = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
      errors.push(
        `${filePrefix}Value for key '${key}' must be a string, received ${typeDesc}.`
      );
      continue;
    }

    // Check empty translation values
    if (value.trim() === '') {
      errors.push(
        `${filePrefix}Empty translation value for key '${key}'. Untranslated strings must be omitted, not empty strings.`
      );
    }

    // Check stale keys
    if (sourceSet && !sourceSet.has(key)) {
      errors.push(
        `${filePrefix}Stale translation key '${key}' not found in English source strings.`
      );
    }

    // Check placeholder mismatch
    const sourcePlaceholders = extractPlaceholders(key);
    const targetPlaceholders = extractPlaceholders(value);
    
    if (
      sourcePlaceholders.length !== targetPlaceholders.length ||
      sourcePlaceholders.some((token, idx) => token !== targetPlaceholders[idx])
    ) {
      errors.push(
        `${filePrefix}Placeholder mismatch for key '${key}': expected [${sourcePlaceholders.join(', ')}], found [${targetPlaceholders.join(', ')}].`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a catalog JSON file on disk.
 * @param {string} filePath 
 * @param {Set<string>|string[]|null} [sourceStrings] 
 * @param {object} [options] 
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCatalogFile(filePath, sourceStrings = null, options = {}) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const catalog = JSON.parse(raw);
    return validateCatalog(catalog, sourceStrings, { ...options, filePath });
  } catch (err) {
    return {
      valid: false,
      errors: [`${filePath}: Failed to read or parse JSON: ${err.message}`]
    };
  }
}

/**
 * Validates all catalog JSON files in a directory.
 * @param {string} dirPath 
 * @param {Set<string>|string[]|null} [sourceStrings] 
 * @returns {{ valid: boolean, errors: string[], fileCount: number }}
 */
function validateAllCatalogs(dirPath, sourceStrings = null) {
  if (!fs.existsSync(dirPath)) {
    return { valid: true, errors: [], fileCount: 0 };
  }

  const files = fs.readdirSync(dirPath).filter((f) => {
    return f.endsWith('.json') && f !== 'do-not-translate.json';
  });

  const allErrors = [];
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const res = validateCatalogFile(fullPath, sourceStrings);
    if (!res.valid) {
      allErrors.push(...res.errors);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    fileCount: files.length
  };
}

// CLI runner
if (require.main === module) {
  const args = process.argv.slice(2);
  let totalErrors = [];
  let checkedCount = 0;

  if (args.length > 0) {
    for (const target of args) {
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
        const res = validateAllCatalogs(target);
        checkedCount += res.fileCount;
        totalErrors.push(...res.errors);
      } else {
        checkedCount += 1;
        const res = validateCatalogFile(target);
        totalErrors.push(...res.errors);
      }
    }
  } else {
    const defaultDir = path.join(process.cwd(), 'i18n');
    if (fs.existsSync(defaultDir)) {
      const res = validateAllCatalogs(defaultDir);
      checkedCount = res.fileCount;
      totalErrors = res.errors;
    } else {
      console.log('No i18n directory found to validate. Pass file or directory paths as arguments.');
      process.exit(0);
    }
  }

  if (totalErrors.length > 0) {
    console.error(`Catalog validation failed with ${totalErrors.length} error(s) across ${checkedCount} file(s):`);
    for (const err of totalErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  } else {
    console.log(`✓ All ${checkedCount} catalog(s) passed validation.`);
    process.exit(0);
  }
}

module.exports = {
  extractPlaceholders,
  validateCatalog,
  validateCatalogFile,
  validateAllCatalogs
};
