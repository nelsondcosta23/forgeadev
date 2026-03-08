

# Plano de Implementacao -- Correcao de Bugs e Melhorias Forgea

Este plano cobre todos os bugs identificados, melhorias UX/UI, performance, seguranca e SEO listados.

---

## FASE 1: Bugs Criticos (7 bugs)

### Bug 1: QuestionCard nao reseta estado
- Em `Quiz.tsx` linha 494, adicionar `key={currentQuestion.id}` ao `<QuestionCard>` para forcar re-mount quando a pergunta muda.

### Bug 2: SharedResults mapeamento quebrado
- Em `SharedResults.tsx`, substituir o `questionMap` hardcoded (linhas 83-104) por um mapa baseado nas translation keys usadas em `questions.ts` (ex: `"questions.country.question": "country"`). Isto porque `question_text` e guardado como a translation key, nao o texto traduzido.

### Bug 3: Textos hardcoded nao traduzidos
Ficheiros a atualizar:
- **Quiz.tsx**: "Back" (l.474), "Initializing session..." (l.491), "Analysis Error" (l.348), "Try Again" (l.356), "View Results Without AI" (l.374), footer "© 2025" e links (l.507-515)
- **QuestionCard.tsx**: "Continue" (l.117)
- **CountrySelect.tsx**: "Select your country..." (l.80), "Search country..." (l.91), "No country found." (l.93)
- **AIResultsView.tsx**: Todos os textos PT hardcoded ("A gerar PDF...", etc.) e textos EN
- **ShareDialog.tsx**: Titulo, descricao, mensagens de partilha em PT hardcoded
- **Results.tsx**: "Invalid Session", "Restart Quiz", "Your Custom PC Builds", etc.

Adicionar todas as chaves necessarias aos 7 ficheiros de locale (`en-US`, `en-GB`, `pt-PT`, `pt-BR`, `es`, `fr`, `de`).

### Bug 4: Progress bar fixa em 10
- Em `Quiz.tsx`, remover `fixedTotalQuestions` e calcular dinamicamente: `const totalQuestions = currentQuestions.length` usando o array filtrado por condicoes. Atualizar sempre que `answers` mudam.

### Bug 5: Edge function usa OpenAI directamente
- Em `supabase/functions/analyze-quiz/index.ts`, substituir chamada a `api.openai.com` por `https://ai.gateway.lovable.dev/v1/chat/completions` com `LOVABLE_API_KEY`. Usar modelo `google/gemini-2.5-flash` por defeito. Manter tool calling schema. Adicionar tratamento de erros 429/402.

### Bug 6: Currency maps duplicados
- Criar `src/lib/currency.ts` com o mapa centralizado exportado.
- Importar em `Quiz.tsx` (substituir `getCurrencyInfo`).
- Criar `supabase/functions/_shared/currency.ts` para a edge function (ou manter inline na edge function dado que nao pode importar de `src/`).
- Na edge function, manter o mapa localmente mas marcar com comentario de referencia.

### Bug 7: Copyright 2025
- Atualizar para "2026" em: `Quiz.tsx` (l.507), `Index.tsx` footer via translation key `landing.copyright`, e todos os ficheiros de locale.

---

## FASE 2: Melhorias UX/UI (8 items)

### 1. Progress bar dinamica por branch
- Ja resolvido no Bug 4 acima.

### 2. Animacao de transicao entre perguntas
- Adicionar CSS transition com opacity/transform no `QuestionCard` wrapper em `Quiz.tsx`. Usar `key={currentQuestion.id}` com classes CSS `animate-fade-in`.

### 3. Botao Back visivel em mobile
- Mover o botao "Back" para dentro da area de conteudo do quiz (abaixo da progress bar) com visibilidade mobile, alem do header.

### 4. Budget slider inicia correctamente
- Em `QuestionCard.tsx`, mudar `useState<number>(question.min || 0)` para `useState<number>(question.min ?? 0)` -- ja funciona dado que min=300, mas garantir que o valor inicial reflete a moeda.

### 5. Dark/Light mode toggle
- Configurar `ThemeProvider` do `next-themes` no `App.tsx`.
- Adicionar botao de toggle (Sun/Moon icon) no header do `Index.tsx` e `Quiz.tsx`.
- Persistir preferencia automaticamente (next-themes faz isto).

### 6. Landing page -- social proof
- Adicionar seccao com 3 metricas (ex: "10,000+ builds criados", "50+ paises", "AI-powered") e/ou testemunhos ficticios abaixo do "How It Works".

### 7. BuildCard com motherboard, case, cooler
- Em `BuildCard.tsx`, adicionar campos para motherboard, case e cooler no rendering. Estes ja existem no schema da AI (`ComponentDetail`), so falta renderizar.

### 8. Skeleton loaders
- Substituir spinners basicos por `Skeleton` components (ja existe `skeleton.tsx`) no loading state do quiz e resultados.

---

## FASE 3: Performance (2 items)

### 1. Reduzir tool calling schema
- Simplificar o schema na edge function: usar um unico `build` object com `additionalProperties` em vez de 3 builds x 5 componentes hardcoded. Reduz de ~75 para ~15 propriedades.

### 2. Cache de recomendacoes
- Na `Results.tsx` e `SharedResults.tsx`, verificar primeiro se existe `ai_recommendations` para o session antes de chamar a edge function (ja parcialmente implementado no 409 handler).

---

## FASE 4: Seguranca (2 items)

### 1. Session IDs com UUID
- Substituir `session_${Date.now()}_${random}` por `crypto.randomUUID()` em `Quiz.tsx` (linhas 43, 418).

### 2. Rate limiting no quiz
- Adicionar rate limiting basico na edge function `analyze-quiz`: verificar quantas sessoes foram criadas pelo mesmo IP nas ultimas 24h usando uma query ao `quiz_sessions`. Limitar a 10 quizzes/dia por IP.

---

## FASE 5: SEO (1 item)

### SharedResults meta tags dinamicas
- Na edge function `meta-tags`, adicionar logica para `/build/:sessionId`: buscar dados da sessao e recomendacao, gerar OG tags com titulo "PC Build by Forgea" e descricao com componentes principais.

---

## Resumo de ficheiros a modificar

| Ficheiro | Alteracoes |
|---|---|
| `src/components/Quiz.tsx` | Bug 1,3,4,7 + UX 2,3,5 + Seg 1 |
| `src/components/quiz/QuestionCard.tsx` | Bug 3 + UX 4 |
| `src/components/quiz/CountrySelect.tsx` | Bug 3 |
| `src/components/quiz/AIResultsView.tsx` | Bug 3 + UX 7,8 |
| `src/components/quiz/ShareDialog.tsx` | Bug 3 |
| `src/components/quiz/Results.tsx` | Bug 3 + UX 8 |
| `src/components/quiz/BuildCard.tsx` | UX 7 |
| `src/pages/SharedResults.tsx` | Bug 2 |
| `src/pages/Index.tsx` | Bug 7 + UX 5,6 |
| `src/lib/currency.ts` | Bug 6 (novo) |
| `src/App.tsx` | UX 5 (ThemeProvider) |
| `supabase/functions/analyze-quiz/index.ts` | Bug 5,6 + Perf 1 + Seg 2 |
| `supabase/functions/meta-tags/index.ts` | SEO |
| 7 ficheiros de locale (`src/i18n/locales/*.json`) | Bug 3,7 |

