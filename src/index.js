import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import { sendText } from './lib/whatsapp.js';
import { generateReply } from './lib/reply.js';

const app = express();

// Basic security headers without extra dependencies
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Logging
const isProduction = process.env.NODE_ENV === 'production';
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Body parsing
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Env
// GARANTE QUE ESTAMOS OUVINDO NA PORTA CERTA (Coolify usa PORT)
const PORT = process.env.PORT || 3000;
const WA_VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || '';
const AGENT_PERSONA = process.env.AGENT_PERSONA || 'Você é um assistente comercial objetivo e claro.';

// ---- ROUTES FOR READINESS / HEALTH -----------------------------
// Página raiz (útil pro Traefik / ver no navegador)
app.get('/', (req, res) => {
  res.status(200).send('WhatsApp Agent is running ✅');
});

// Healthcheck simples (útil pro Coolify se quiser configurar)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
// ----------------------------------------------------------------

// Webhook verification endpoint
app.get('/webhooks/whatsapp', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === WA_VERIFY_TOKEN) {
      console.log('[Webhook][GET] Verificado com sucesso');
      return res.status(200).send(challenge);
    }

    console.warn('[Webhook][GET] Falha na verificação: token ou mode inválidos');
    return res.sendStatus(403);
  } catch (err) {
    console.error('[Webhook][GET] Erro inesperado na verificação:', err?.message || err);
    return res.sendStatus(403);
  }
});

// Webhook receiver endpoint
app.post('/webhooks/whatsapp', async (req, res) => {
  try {
    // Always acknowledge first to avoid retries? We still want to try to process quickly.
    // However, to follow the requirement "sempre 200 no webhook", we will process fast and end with 200 regardless.

    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      console.log('[Webhook][POST] Evento recebido sem mensagens.');
      return res.sendStatus(200);
    }

    const messageType = message.type;
    if (messageType === 'text') {
      const from = message.from; // WhatsApp ID (phone without +)
      const userText = message.text?.body || '';

      console.log(`[Webhook][POST] Mensagem de ${from}: ${userText}`);

      try {
        const replyText = await generateReply(userText, { persona: AGENT_PERSONA });
        if (replyText && replyText.trim().length > 0) {
          await sendText(from, replyText);
          console.log(`[Webhook][POST] Resposta enviada para ${from}`);
        } else {
          console.log('[Webhook][POST] Resposta vazia, nada enviado');
        }
      } catch (innerErr) {
        console.error('[Webhook][POST] Erro ao gerar/enviar resposta:', innerErr?.message || innerErr);
      }
    } else {
      console.log(`[Webhook][POST] Tipo de mensagem não suportado: ${messageType}`);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error('[Webhook][POST] Erro inesperado:', err?.message || err);
    return res.sendStatus(200);
  }
});

// (rota raiz já definida acima)
// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Use 0.0.0.0 para aceitar conexões externas no container
app.listen(PORT, '0.0.0.0', () => {
  console.log(`agent-whatsapp ouvindo em http://0.0.0.0:${PORT}`);
});

// Basic process-level error logging
process.on('unhandledRejection', (reason) => {
  console.error('[Process] UnhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Process] UncaughtException:', err);
});
