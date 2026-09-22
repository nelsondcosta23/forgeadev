import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config();

const SENTRY_DSN = (process.env.SENTRY_DSN || 'http://994ebcb62592da248c0fa74514c61fa7@localhost:9000/8').trim();

if (SENTRY_DSN && process.env.NODE_ENV !== 'test' && !Sentry.isInitialized()) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 1.0,
  });
  console.log('[Monitoring] Sentry instrumented for Node.js ESM backend.');
}
