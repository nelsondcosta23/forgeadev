

# Bugs Encontrados -- Teste Completo da Aplicacao

## Bugs Identificados

### Bug 1 (Critico): Botao "Continue" nao aparece na pergunta de pais
**Problema**: Quando o quiz inicia, o pais e auto-detectado (ex: "United States") e o `CountrySelect` define o valor internamente via `defaultValue`. Porem, o `CountrySelect` nunca chama `onSelect` para o valor default -- so chama quando o utilizador muda manualmente. Isso significa que `selectedOption` no `QuestionCard` permanece `null`, e o botao "Continue" (linha 109) nunca aparece.

**Correcao**: No `CountrySelect.tsx`, adicionar um `useEffect` que chame `onSelect(defaultValue)` quando o `defaultValue` e definido na montagem. Ou no `QuestionCard.tsx`, inicializar `selectedOption` com `defaultValue` quando `question.id === "country"`.

---

### Bug 2 (Menor): Light mode -- background gradient da hero section quase invisivel
**Problema**: Em light mode, as radial gradients na hero section (`from-primary/10`, `hsl(195 92% 55% / 0.15)`) sao quase invisiveis contra o fundo branco. O resultado e uma pagina visualmente "vazia" comparada com dark mode.

**Correcao**: Em `Index.tsx`, usar classes condicionais `dark:` para os gradients, ou aumentar a opacidade dos gradients em light mode no CSS (ex: `0.25` em vez de `0.15`).

---

### Bug 3 (Menor): FAQ page sem ThemeToggle
**Problema**: A pagina FAQ nao tem o botao de dark/light mode toggle, ao contrario da landing page e do quiz.

**Correcao**: Adicionar `<ThemeToggle />` ao header da pagina FAQ. Verificar tambem Privacy e Terms.

---

### Bug 4 (Menor): React Router v6 deprecation warning
**Problema**: Console mostra warning sobre `v7_relativeSplatPath`. Nao e um bug funcional mas polui os logs.

**Correcao**: Adicionar `future={{ v7_relativeSplatPath: true }}` ao `<BrowserRouter>` em `App.tsx`.

---

## Resumo

| Bug | Severidade | Ficheiros |
|---|---|---|
| Continue button nao aparece (pais auto-detectado) | Critico | `CountrySelect.tsx` ou `QuestionCard.tsx` |
| Light mode hero gradients fracas | Menor | `Index.tsx` |
| FAQ/Privacy/Terms sem ThemeToggle | Menor | `FAQ.tsx`, `PrivacyPolicy.tsx`, `TermsAndConditions.tsx` |
| React Router deprecation warning | Menor | `App.tsx` |

### Ficheiros a modificar
- `src/components/quiz/CountrySelect.tsx` -- chamar `onSelect` para defaultValue
- `src/pages/Index.tsx` -- melhorar gradients em light mode
- `src/pages/FAQ.tsx` -- adicionar ThemeToggle
- `src/pages/PrivacyPolicy.tsx` -- adicionar ThemeToggle
- `src/pages/TermsAndConditions.tsx` -- adicionar ThemeToggle
- `src/App.tsx` -- future flags React Router

