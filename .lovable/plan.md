

# Diagnostico e Correcao: Build Publicado Sem Scripts

## Estado Atual Confirmado

| Site | HTML | Screenshot |
|------|------|-----------|
| `forgeadev.lovable.app` | So `<div id="root">` - deploy antigo | Tela preta |
| `forgea.dev` | Tem `root-fallback` (deploy novo) mas SEM `<head>`, SEM `<script>` | "Loading application..." permanente |

O `forgea.dev` confirma que o ultimo publish **chegou** (tem o fallback novo), mas o HTML esta corrompido: todo o `<head>` e o `<script>` foram removidos pelo processo de build.

## Causa Provavel

O `vite.config.ts` tem `manualChunks` que divide pacotes em chunks separados. Se algum desses pacotes falhar durante o build (incompatibilidade de versao, import circular), o Rollup pode produzir um artefacto incompleto silenciosamente, resultando num `index.html` sem referencias a assets.

## Plano

### 1. Simplificar `vite.config.ts`
Remover a configuracao `manualChunks` e `chunkSizeWarningLimit` do build. Deixar o Vite/Rollup fazer o code-splitting automatico (que e mais robusto). Isto elimina a causa mais provavel de falha de build.

### 2. Republicar e validar
Apos a mudanca, republicar e verificar por fetch que o HTML publicado contem `<script>` tags com referencias a `/assets/*.js`.

### Ficheiro a modificar
- `vite.config.ts` -- remover `build.rollupOptions.output.manualChunks` e `chunkSizeWarningLimit`

