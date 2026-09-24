# Forgeadev — AI-Powered PC Build Advisor

Forgeadev is a high-performance platform designed to help users find their ideal PC configuration in under a minute. Using state-of-the-art artificial intelligence, the platform analyzes user needs and generates detailed, compatible, and optimized hardware recommendations.

---

## Technical Stack

The application utilizes a modern architecture divided into three main layers:

### Frontend (User Experience)
- React 18 + Vite: For ultra-fast development and a fluid user interface.
- TypeScript: Ensuring robustness and type safety throughout the codebase.
- Tailwind CSS + Shadcn UI: Premium, responsive interface with a modern aesthetic.
- Framer Motion: Dynamic micro-animations for an enhanced user experience.

### Backend & Proxy (BFF - Backend For Frontend)
- Node.js + Express: Acts as a security proxy server that protects the database.
- Security Layer: JWT authentication proxy with superuser and admin role verification, rate limiting, and collection whitelisting.
- AI Integration: Dual-engine architecture with Mistral AI (Primary) and Google Gemini (Fallback).

### Data & AI (The Engine)
- Mistral AI (`mistral-large-latest`): Primary AI engine delivering frontier-grade reasoning, hardware synergy, and strict JSON output.
- Google Gemini 2.5 Flash: Automated resilient fallback engine guaranteeing 100% uptime even during rate limits or provider downtime.
- PocketBase: Open-source backend solution providing SQLite database, authentication, and content management.

---

## Core Features

- Intelligent Quiz: Captures user goals, budget, and upgrade preferences.
- Detailed Build Reports: Generates three unique options (Best Value, Balanced, High Performance) with automated component lists.
- Geographic Awareness: Adapts store links based on the user's location (e.g., Amazon.es, Amazon.com).
- Administrative Panel:
    - Real-time AI prompt management.
    - CRM for user session tracking.
    - Affiliate link management by country.
    - Data export functionality (Excel/JSON).
- PDF Export: High-fidelity build reports generated directly in the browser.

---

## Setup Guide

### Prerequisites
- Node.js (v18 or higher)
- PocketBase (local executable or via Docker)
- Mistral AI API Key (Primary)
- Google Gemini API Key (Fallback)

### 1. Environment Configuration
Create a .env file in the project root:

```env
# Server Configuration
PORT=8085

# PocketBase (Production or Local)
POCKETBASE_URL=http://localhost:8090

# Artificial Intelligence (Primary: Mistral AI)
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_MODEL=mistral-large-latest

# Artificial Intelligence (Fallback: Google Gemini)
GEMINI_API_KEY=your_google_ai_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### 2. Manual Installation
```bash
# 1. Install dependencies
npm install

# 2. Start PocketBase (in a separate terminal)
./pocketbase serve

# 3. Start the BFF server and Frontend in dev mode
npm run dev
```

### 3. Docker Setup (Production)
The project is ready for Docker-based deployment:
```bash
docker compose up -d --build
```

---

## Legacy Supabase Migration & Key Revocation Guide

The project has completely transitioned from Supabase to an internal PocketBase instance with a hardened Express BFF proxy.

> [!WARNING]
> If you previously provisioned or ran this project with Supabase:
> 1. **Revoke Old API Keys**: Access your Supabase project dashboard, navigate to `Project Settings -> API`, and revoke or rotate all legacy `anon` and `service_role` keys.
> 2. **Clean Environment Files**: Verify your local `.env` and deployment secrets contain no `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` variables.
> 3. **Delete Stale Supabase Projects**: If the cloud database is no longer in use, delete the database instance to eliminate orphaned cloud attack surfaces.

---

## Security and Stability

- Zero Exposure Architecture: PocketBase is never directly exposed to the internet; all requests are proxied via server.js with strict collection whitelisting and administrative role enforcement.
- Error Resilience: The system is hardened against AI-generated JSON errors using strict schemas and defensive frontend validations.
- Model Integrity: Successfully migrated to Gemini 2.5 Flash for superior reasoning and reliability.

---
© 2026 Forgeadev. Built for peak performance.
