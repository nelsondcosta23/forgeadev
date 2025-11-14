# Scripts de Validação

## Validação de Traduções

### Como executar

```bash
node scripts/validate-translations.js
```

### O que faz

Este script valida automaticamente todas as traduções do projeto:

1. ✅ **Verifica chaves em falta**: Identifica chaves que existem em `en-US.json` (referência) mas não existem nos outros idiomas
2. ⚠️ **Identifica chaves extras**: Encontra chaves que existem em um idioma mas não na referência
3. 📊 **Gera relatório completo**: Mostra estatísticas e lista detalhada de problemas

### Idiomas validados

- `en-US` (Inglês EUA - referência)
- `en-GB` (Inglês Reino Unido)
- `pt-PT` (Português de Portugal)
- `pt-BR` (Português do Brasil)
- `es` (Espanhol)
- `fr` (Francês)
- `de` (Alemão)

### Exemplo de saída

```
🔍 Validação de Traduções

Idiomas: en-US, en-GB, pt-PT, pt-BR, es, fr, de

📋 Total de chaves em en-US (referência): 156

✓ en-GB: Completo (156 chaves)
✓ pt-PT: Completo (156 chaves)
⚠ pt-BR: 154 chaves
  2 chaves em falta:
    - questions.fps.question
    - questions.streaming.yesDesc

✓ es: Completo (156 chaves)
✓ fr: Completo (156 chaves)
✓ de: Completo (156 chaves)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✗ Foram encontrados problemas nas traduções

Resumo de chaves em falta:
  pt-BR: 2 chaves
```

### Integração CI/CD

Você pode adicionar este script ao seu pipeline de CI/CD adicionando ao `package.json`:

```json
{
  "scripts": {
    "validate:translations": "node scripts/validate-translations.js"
  }
}
```

E depois executar em seu workflow:

```yaml
- name: Validate translations
  run: npm run validate:translations
```

### Quando executar

- ✅ Antes de fazer commit de novas traduções
- ✅ Durante code review
- ✅ Em pipeline de CI/CD
- ✅ Após adicionar novos idiomas
- ✅ Após adicionar novas features que incluem textos
