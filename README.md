# Forgeadev — AI-Powered PC Build Advisor 🚀

**Forgeadev** é uma plataforma de alto desempenho projetada para ajudar utilizadores a encontrar a configuração de PC ideal em menos de um minuto. Utilizando inteligência artificial de última geração, a plataforma analisa as necessidades do utilizador e gera recomendações detalhadas e compatíveis.

---

## 🛠️ Stack Tecnológica

A aplicação utiliza uma arquitetura moderna dividida em três camadas principais:

### Frontend (User Experience)
- **React 18 + Vite**: Para um desenvolvimento ultra-rápido e uma aplicação fluida.
- **TypeScript**: Garantia de robustez e segurança de tipos em todo o código.
- **Tailwind CSS + Shadcn UI**: Interface premium, responsiva e com estética "glassmorphism".
- **Framer Motion**: Micro-animações para uma experiência de utilizador dinâmica.

### Backend & Proxy (BFF - Backend For Frontend)
- **Node.js + Express**: Atua como um servidor de segurança (Proxy) que protege a base de dados.
- **Security Layer**: Implementação de `INTERNAL_PROXY_KEY` para garantir que apenas o frontend oficial comunica com a API.
- **AI Integration**: Integração direta com o SDK oficial da Google para processamento de IA.

### Data & AI (The Brain)
- **Google Gemini 2.5 Flash**: O modelo de IA mais rápido e capaz da Google, configurado com **Strict Response Schema** para garantir que as recomendações são sempre enviadas no formato JSON correto.
- **PocketBase**: Solução Open Source para base de dados (SQLite), autenticação e gestão de conteúdos.

---

## 🚀 Funcionalidades Principais

- **Quiz Inteligente**: Capta objetivos, orçamento e preferências de upgrade.
- **Relatório de Builds Detalhado**: Gera 3 opções (Best Value, Balanced, High Performance) com links de compra automáticos.
- **Detecção Geográfica**: Adapta os links de lojas (Amazon.es, Amazon.com, etc.) conforme a localização do utilizador.
- **Painel Administrativo**:
    - Edição de Prompts de IA em tempo real.
    - CRM de sessões de utilizadores.
    - Gestão de parcerias e links de afiliados por país.
    - Exportação de dados para Excel/JSON.
- **Exportação para PDF**: Relatórios profissionais gerados diretamente no browser.

---

## ⚙️ Guia de Setup

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **PocketBase** (executável local ou via Docker)
- **Google Gemini API Key**

### 1. Configuração de Variáveis de Ambiente
Crie um ficheiro `.env` na raiz do projeto:

```env
# Configuração do Servidor
PORT=3000
INTERNAL_PROXY_KEY=uma_chave_secreta_longa

# PocketBase (Produção ou Local)
POCKETBASE_URL=http://localhost:8090
PB_ADMIN_EMAIL=admin@exemplo.com
PB_ADMIN_PASSWORD=sua_senha_forte

# Inteligência Artificial (Google AI)
GEMINI_API_KEY=sua_chave_da_google_aqui

# Frontend (Build Time)
VITE_INTERNAL_PROXY_KEY=a_mesma_chave_secreta_acima
```

### 2. Instalação Manual
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o PocketBase (num terminal separado)
./pocketbase serve

# 3. Iniciar o servidor BFF e o Frontend em modo dev
npm run dev
```

### 3. Setup via Docker (Produção)
O projeto está pronto para o **Coolify** ou Docker puro:
```bash
docker compose up -d --build
```

---

## 🛡️ Segurança e Estabilidade

- **Zero Exposure**: O PocketBase nunca é exposto diretamente à internet; todos os pedidos passam pelo `server.js` que valida a `INTERNAL_PROXY_KEY`.
- **Error Resilience**: O sistema foi blindado contra erros de JSON da IA, utilizando esquemas estritos e validações defensivas no frontend.
- **Model Migration**: Migrado com sucesso de `gemini-1.5-flash` (deprecated) para `gemini-2.5-flash`.

---
© 2026 Forgeadev. Construído para a melhor performance.
