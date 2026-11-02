# Forgeadev — AI-Powered PC Build Advisor

Forgeadev is a high-performance platform designed to help users find their ideal PC configuration in under a minute. Using state-of-the-art artificial intelligence, the platform analyzes user needs and generates detailed, compatible, and optimized hardware recommendations.

---

## Technical Stack

The application utilizes a modern architecture divided into three main layers:

### Frontend (User Experience)
- **React 18 + Vite**: Ultra-fast development and fluid, high-performance rendering.
- **TypeScript**: Complete type safety throughout the codebase.
- **Tailwind CSS + Shadcn UI**: Modern, accessible, responsive interface.
- **Framer Motion**: Dynamic micro-animations for high-fidelity user feedback.
- **Sentry React SDK**: Frontend telemetry and error tracking routed via backend tunnel.

### Backend & Proxy (BFF - Backend For Frontend)
- **Node.js + Express**: Reverse proxy securing the database and isolating API keys.
- **Security Layer**:
  - Strict Content Security Policy (CSP) blocking `unsafe-eval`.
  - PocketBase BFF proxy with strict collection whitelisting and filter sanitization.
  - Granular rate limiting on admin logins (`loginLimiter`) and AI generation (`aiLimiter`).
  - Internal geolocation (`/api/geo`) eliminating third-party IP leaks (`ipapi.co`).
  - CSV formula injection sanitization for administrative data exports.
  - Safe error masking preventing internal stack and database leakage.
- **Monitoring & Tunnel**: Reverse Sentry tunnel (`/api/sentry-tunnel`) ensuring 100% telemetry capture immune to client-side ad-blockers.

### Data & AI (Anthropic Claude Engine)
- **Anthropic Claude (`claude-sonnet-4-6`)**: Premier AI reasoning engine delivering world-class PC hardware architecture analysis and strict JSON recommendations. Multi-model resilience (`claude-sonnet-4-6` -> `claude-haiku-4-5-20251001` -> `claude-sonnet-4-5-20250929`).
- **PocketBase**: Local SQLite-powered backend managing sessions, recommendations, affiliate store links, and administrative settings.

---

## Core Features

- **Intelligent Quiz**: 1-minute assessment capturing user goals, budget, country, and upgrade path.
- **Automated 3-Tier Builds**: Produces 3 balanced configurations (*Best Value*, *Balanced*, *High Performance*) with component breakdown and estimated pricing.
- **Localized Store Intelligence**: Adapts component purchase links based on the user's country (Amazon, Global Data, PC Componentes, etc.).
- **Interactive Results & Sharing**: Unique shareable permalinks (`/build/:sessionId`) with dynamic OpenGraph meta tags.
- **Administrative Panel**:
  - Real-time AI system prompt editor.
  - User session tracking and conversion analytics.
  - Country store and affiliate link management.
  - Sanitized CSV export functionality.
- **Client-Side PDF Generation**: High-fidelity PDF build sheets generated directly in the browser.

---

## Setup & Configuration

### Prerequisites
- Node.js (v18 or higher)
- PocketBase (local executable or Docker container)
- Anthropic Claude API Key (`ANTHROPIC_API_KEY`)
- Self-Hosted Sentry DSN (Monitoring)

### 1. Environment Variables (`.env`)
Create a `.env` file in the project root:

```env
# Server Configuration
PORT=8085
INTERNAL_PROXY_KEY=your_stack_proxy_secret

# PocketBase (Internal or Docker URL)
POCKETBASE_URL=http://pb:8090
PB_ADMIN_EMAIL=admin@forgea.dev
PB_ADMIN_PASSWORD=your_secure_password

# Artificial Intelligence (Anthropic Claude AI)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-6

# Monitoring (Self-Hosted Sentry)
SENTRY_DSN=https://994ebcb62592da248c0fa74514c61fa7@sentry.beecard.ovh/8
VITE_SENTRY_DSN=https://994ebcb62592da248c0fa74514c61fa7@sentry.beecard.ovh/8
```

### 2. Local Development
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Start development server (Frontend + BFF)
npm run dev
```

### 3. Production Deployment (Docker / Coolify)
The application includes a hardened multi-stage `Dockerfile` and `docker-compose.yml`:
```bash
docker compose up -d --build
```

---

## Health Check & Diagnostics

The server exposes a zero-leak health check endpoint for monitoring uptime and AI engines:
```bash
curl https://forgea.dev/api/health
```
Response:
```json
{
  "status": "ok",
  "primary_ai": "claude",
  "claude_model": "claude-sonnet-4-6",
  "sentry_configured": true,
  "sentry_host": "https://sentry.beecard.ovh"
}
```

---

## Security Hardening & Zero Exposure

- **Zero Exposure PocketBase**: PocketBase is not exposed to public traffic. All requests pass through the Express BFF with route whitelisting, authentication token validation, and rate limiting.
- **Privacy-First Geolocation**: Visitor IP addresses are resolved internally and never transmitted to external third-party services.
- **Claude Multi-Tier Resilience**: Automated fallback cascade between Claude models (`claude-3-7-sonnet` -> `claude-3-5-sonnet` -> `claude-3-5-haiku`) executes seamlessly on the backend without user disruption.

---
© 2026 Forgeadev. Built for peak performance.
