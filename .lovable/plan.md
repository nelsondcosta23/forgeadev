

# Correcao: Tela Preta em Producao

## Causa Raiz

Dois problemas combinados:

1. **Build publicado incompleto** -- O HTML da versao publicada nao inclui os bundles JavaScript. O React nunca monta. Isto resolve-se republicando.

2. **LanguageProvider bloqueia toda a app** -- O componente retorna `null` enquanto espera pela resposta do `detect-country`. Se a edge function falhar, demorar, ou der timeout, a app fica permanentemente preta sem qualquer feedback ao utilizador. Este e o problema de design que torna isto fragil.

## Correcao

### Ficheiro: `src/components/LanguageProvider.tsx`

Remover o bloqueio de renderizacao. Em vez de retornar `null` enquanto espera, renderizar os children imediatamente e mudar o idioma em background quando a deteccao completar. Adicionar um timeout de seguranca (3 segundos) para garantir que nunca fica preso.

Mudancas concretas:
- Remover o estado `isReady` e o `return null`
- Renderizar `{children}` sempre, independentemente do estado da deteccao
- Adicionar `AbortController` com timeout de 3s na chamada ao edge function
- Manter a logica de deteccao de idioma, mas como side-effect nao-bloqueante

### Apos implementacao: Republicar

Depois das alteracoes, e necessario clicar em **Publish > Update** para que as mudancas cheguem a producao. Mudancas de frontend nao se propagam automaticamente.

## Ficheiros a modificar
- `src/components/LanguageProvider.tsx` -- remover bloqueio de renderizacao, adicionar timeout

