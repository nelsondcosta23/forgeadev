# Forgea — AI-Powered PC Build Recommender

Forgea is a high-performance web application that helps users find their perfect PC build in under a minute. By answering a simple quiz about their goals, budget, and preferences, users receive professional, AI-generated build recommendations tailored to their specific needs.

## 🚀 Features

*   **1-Minute Quiz**: Streamlined questionnaire to capture technical requirements.
*   **AI Engine**: Powered by **Google Gemini 1.5 Flash** for intelligent, balanced, and compatible component selection.
*   **Multi-Store Support**: Dynamic regional links (Amazon.com, Amazon.es, etc.) based on user location.
*   **High-Fidelity PDF Export**: Professional build reports for offline reference.
*   **Administrative Panel**: Complete dashboard for managing prompts, store links, SEO, and viewing detailed project analytics.
*   **Real-time Telemetry**: Integrated tracking for user sessions and conversion metrics.

## 🛠️ Technology Stack

*   **Frontend**: React + Vite + TypeScript + Tailwind CSS (UI: shadcn/ui)
*   **Backend (BFF)**: Node.js + Express
*   **Database**: PocketBase (SQLite-based backend-as-a-service)
*   **AI Agent**: Google Gemini API
*   **Infrastructure**: Docker + Docker Compose

## 📦 Setup & Installation

### Prerequisites
*   [Docker](https://www.docker.com/) and Docker Compose installed.
*   A Google Gemini API Key.

### 1. Environment Configuration
Create a `.env` file in the root directory based on the `.env.example` provided:

```env
# Server Config
PORT=8085
INTERNAL_PROXY_KEY=your_secure_random_key_here

# PocketBase Config
POCKETBASE_URL=http://pb:8090
PB_ADMIN_EMAIL=admin@forgea.com
PB_ADMIN_PASSWORD=secure_password_here

# AI Config
GEMINI_API_KEY=your_google_gemini_key

# Frontend Build
VITE_INTERNAL_PROXY_KEY=your_secure_random_key_here
```

### 2. Run with Docker
Start the entire stack (PocketBase + BFF + Frontend) using:

```bash
docker compose up -d --build
```

The application will be available at `http://localhost:8085` and the PocketBase admin UI at `http://localhost:8090/_/`.

## 📂 Project Structure

*   `/src`: Frontend source code (React components, hooks, pages).
*   `/server.js`: BFF (Backend For Frontend) handle proxying to PocketBase and AI requests.
*   `/pb_data`: Local volume for PocketBase data storage (ignored by git).
*   `/public`: Static assets and icons.

## 🛡️ Security
*   Credentials and API keys are strictly managed via environment variables.
*   The BFF acts as a security proxy, preventing direct exposure of the database to the public web.
*   Sensitive files (backups, logs, local DBs) are excluded via `.gitignore`.

---
© 2026 Forgea. Created by building high-performance PC solutions.
