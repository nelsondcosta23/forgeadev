
Objetivo: resolver definitivamente a tela preta no publicado.

Diagnóstico confirmado (profundo):
- O problema não está mais no `LanguageProvider` (ele já renderiza `children` sem bloquear).
- Ambos os domínios públicos (`forgeadev.lovable.app` e `forgea.dev`) estão a servir HTML quebrado: apenas `<div id="root"></div>` sem scripts JS.
- Isso explica 100% a tela preta imediata e permanente: o React nunca é carregado.
- Testei também com query string (`?v=...`) e continua igual, então não parece cache simples do browser.

Do I know what the issue is?
- Sim: o build publicado está a ser servido sem os bundles JS (problema de artefacto/publicação), não um bug de lógica da app em runtime.

Plano de implementação:
1) Harden do `index.html` para diagnóstico e fallback visual
- Simplificar `index.html` para template Vite mínimo (head essencial + script module).
- Colocar conteúdo fallback dentro de `#root` (mensagem “A carregar aplicação…”) para nunca ficar ecrã totalmente preto se o JS falhar.

2) Sinal de boot da app (prova de montagem)
- Em `src/main.tsx`, adicionar marca de arranque (`document.documentElement.dataset.appBoot = "ok"` e log controlado).
- Em `App`/landing, mostrar versão curta visível (ex.: `V1.3.1`) para confirmar rapidamente se o deploy novo chegou aos clientes.

3) Publicação limpa e validação técnica imediata
- Publicar (Update).
- Validar por fetch/inspeção que o HTML publicado agora contém referências a `/assets/*.js` e `/assets/*.css`.
- Validar carregamento real em:
  - `https://forgeadev.lovable.app`
  - `https://forgea.dev`
- Confirmar que o fallback desaparece após mount (app carregada).

4) Se continuar sem scripts após publicação
- Fazer rollback para uma versão anterior estável via History e republicar.
- Reaplicar apenas mudanças pequenas (uma por vez) para identificar o commit que desencadeia o artefacto inválido.
- Manter fallback no `#root` para proteger utilizadores enquanto se isola a causa.

Ficheiros alvo:
- `index.html` (simplificação + fallback anti-black-screen)
- `src/main.tsx` (marcador de boot)
- `src/i18n/locales/*` ou componente footer (versão visível de deploy)

Critério de sucesso:
- “Ver código-fonte” no publicado mostra scripts de assets.
- Página deixa de abrir preta.
- Versão nova visível no rodapé para confirmar que clientes estão no deploy correto.
