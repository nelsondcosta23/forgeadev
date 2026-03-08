

## Diagnostico

O HTML servido em `forgea.dev` continua completamente sem `<head>` e sem `<script>`:

```html
<html lang="en">
  <body>
    <div id="root"></div>
    <div id="root-fallback">Loading application…</div>
  </body>
</html>
```

O fallback novo aparece (confirma que o deploy do `index.html` chegou), mas os assets JS/CSS foram **removidos pelo processo de build**. A remoção do `manualChunks` no `vite.config.ts` pode ainda não ter sido publicada.

## Proximo Passo

### Opcao A: Republicar agora
Se ainda nao clicaste **Publish → Update** depois da ultima alteracao, faz isso agora. A simplificacao do `vite.config.ts` pode resolver o build corrompido.

### Opcao B: Se ja republicaste e continua igual
O problema esta no pipeline de build da plataforma Lovable. Nesse caso:

1. **Tentar rollback** — ir ao History do projeto, voltar a uma versao que funcionava no publicado, e republicar.
2. **Contactar suporte Lovable** — reportar que o build publicado esta a gerar HTML sem scripts (artefacto corrompido). O preview funciona, o publicado nao.
3. **Workaround temporario** — se tiveres acesso ao GitHub, podes fazer deploy manual via Vercel/Netlify enquanto o problema e resolvido.

Nenhuma alteracao de codigo e necessaria neste momento. O problema e de infraestrutura de deploy.

