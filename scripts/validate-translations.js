#!/usr/bin/env node

/**
 * Translation Validation Script
 * 
 * Valida que todas as chaves de tradução existem em todos os idiomas
 * e identifica traduções em falta ou extras.
 * 
 * Uso: node scripts/validate-translations.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Idiomas suportados
const languages = ['en-US', 'en-GB', 'pt-PT', 'pt-BR', 'es', 'fr', 'de'];

// Caminho para os arquivos de tradução
const localesPath = join(__dirname, '../src/i18n/locales');

/**
 * Extrai todas as chaves de um objeto de tradução de forma recursiva
 */
function extractKeys(obj, prefix = '') {
  let keys = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(extractKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * Carrega um arquivo de tradução
 */
function loadTranslation(lang) {
  try {
    const filePath = join(localesPath, `${lang}.json`);
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Erro ao carregar ${lang}.json:${colors.reset}`, error.message);
    return null;
  }
}

/**
 * Compara chaves entre idiomas
 */
function compareTranslations() {
  console.log(`${colors.bold}${colors.cyan}🔍 Validação de Traduções${colors.reset}\n`);
  console.log(`Idiomas: ${languages.join(', ')}\n`);
  
  // Carregar todas as traduções
  const translations = {};
  const allKeys = {};
  
  for (const lang of languages) {
    const translation = loadTranslation(lang);
    if (translation) {
      translations[lang] = translation;
      allKeys[lang] = extractKeys(translation).sort();
    }
  }
  
  // Usar en-US como referência
  const referenceKeys = allKeys['en-US'];
  
  if (!referenceKeys) {
    console.error(`${colors.red}❌ Erro: Não foi possível carregar en-US.json como referência${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.blue}📋 Total de chaves em en-US (referência): ${referenceKeys.length}${colors.reset}\n`);
  
  let hasErrors = false;
  const results = {};
  
  // Validar cada idioma
  for (const lang of languages) {
    if (lang === 'en-US') continue; // Pular a referência
    
    const langKeys = allKeys[lang];
    
    if (!langKeys) {
      console.log(`${colors.red}❌ ${lang}: Arquivo não encontrado ou inválido${colors.reset}\n`);
      hasErrors = true;
      continue;
    }
    
    // Encontrar chaves em falta
    const missingKeys = referenceKeys.filter(key => !langKeys.includes(key));
    
    // Encontrar chaves extras
    const extraKeys = langKeys.filter(key => !referenceKeys.includes(key));
    
    results[lang] = {
      total: langKeys.length,
      missing: missingKeys,
      extra: extraKeys
    };
    
    // Output para este idioma
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(`${colors.green}✓ ${lang}: Completo (${langKeys.length} chaves)${colors.reset}`);
    } else {
      hasErrors = true;
      console.log(`${colors.yellow}⚠ ${lang}: ${langKeys.length} chaves${colors.reset}`);
      
      if (missingKeys.length > 0) {
        console.log(`  ${colors.red}${missingKeys.length} chaves em falta:${colors.reset}`);
        missingKeys.slice(0, 10).forEach(key => {
          console.log(`    - ${key}`);
        });
        if (missingKeys.length > 10) {
          console.log(`    ... e mais ${missingKeys.length - 10} chaves`);
        }
      }
      
      if (extraKeys.length > 0) {
        console.log(`  ${colors.yellow}${extraKeys.length} chaves extras (não existem em en-US):${colors.reset}`);
        extraKeys.slice(0, 10).forEach(key => {
          console.log(`    - ${key}`);
        });
        if (extraKeys.length > 10) {
          console.log(`    ... e mais ${extraKeys.length - 10} chaves`);
        }
      }
    }
    
    console.log('');
  }
  
  // Resumo final
  console.log(`${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  if (!hasErrors) {
    console.log(`${colors.green}${colors.bold}✓ Todas as traduções estão completas!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}✗ Foram encontrados problemas nas traduções${colors.reset}\n`);
    
    // Sumário de chaves em falta por idioma
    const languagesWithMissing = Object.entries(results)
      .filter(([_, data]) => data.missing.length > 0);
    
    if (languagesWithMissing.length > 0) {
      console.log(`${colors.yellow}Resumo de chaves em falta:${colors.reset}`);
      languagesWithMissing.forEach(([lang, data]) => {
        console.log(`  ${lang}: ${data.missing.length} chaves`);
      });
      console.log('');
    }
    
    process.exit(1);
  }
}

// Executar validação
compareTranslations();
