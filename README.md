## agent-whatsapp

Agente comercial via mensagem usando WhatsApp Cloud API. MVP pronto para deploy no Coolify (Nixpacks). Objetivo: receber webhooks do WhatsApp Cloud e responder mensagens de texto com regras simples e persona configurável.

### Como funciona
- Exponde endpoints:
  - `GET /webhooks/whatsapp` para verificação (retorna `hub.challenge` com `hub.mode=subscribe` e `hub.verify_token` correto).
  - `POST /webhooks/whatsapp` para processar mensagens recebidas e responder textos.
- Persona ajustável via variável de ambiente `AGENT_PERSONA`.
- Logs claros, robustez mínima com try/catch e retorno 200 sempre no webhook (evita reentrega do Meta).

### Stack
- Node 18+ (ESM `"type": "module"`).
- Express + Axios + Morgan + Body-parser.
- Sem banco de dados (neste MVP).
- Compatível com Coolify/Nixpacks (sem Dockerfile).
- Porta configurável via `PORT`, bind em `0.0.0.0`.

### Estrutura
```
agent-whatsapp/
  src/
    index.js
    lib/
      whatsapp.js
      reply.js
  package.json
  .env.sample
  README.md
  .gitignore
```

### Variáveis de ambiente
Copie o `.env.sample` para `.env` e ajuste os valores:

```
PORT=3000
NODE_ENV=production

# WhatsApp Cloud
WA_VERIFY_TOKEN=troque_por_um_token_unico
WA_ACCESS_TOKEN=EAAX...  # Page Access Token (long-lived)
WA_PHONE_NUMBER_ID=000000000000000

# Persona opcional (texto curto e direto)
AGENT_PERSONA=Você é o assistente comercial da Agência Midas. Responda de forma objetiva, com foco em conversão e clareza.

# (Opcional, para respostas mais “inteligentes” no futuro)
OPENAI_API_KEY=
```

Em desenvolvimento local, as variáveis do `.env` são carregadas automaticamente via `dotenv`. Em produção no Coolify, defina as variáveis no painel do app.

### Rodar local
```
npm ci
npm run dev
```
Aplicação sobe em `http://localhost:3000`.

### Testes rápidos
- Verificação do webhook:
  - `GET /webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=123`
  - Se `SEU_TOKEN` for igual a `WA_VERIFY_TOKEN`, retorna `123` com status 200.

### Deploy no Coolify (Nixpacks)
1) Criar aplicação: Application → From Git Repository (aponte para este repositório).
2) Build Pack: Nixpacks.
3) Install Command:
```
npm ci --no-audit --prefer-offline || npm install
```
4) Build Command: (deixe em branco)
5) Start Command:
```
npm run start
```
6) Env vars: preencha `PORT=3000`, `WA_VERIFY_TOKEN`, `WA_ACCESS_TOKEN`, `WA_PHONE_NUMBER_ID`, `AGENT_PERSONA` (opcional) e `NODE_ENV=production`.
7) Domain: ex. `api.agenciamidas.com` (ou outro). Crie um A-record na sua DNS (Hostinger) apontando para o IP da VPS. Habilite SSL no Coolify.

### Configurar WhatsApp Cloud (Meta)
No `Meta Developers → WhatsApp → Configuration → Webhooks`:
- URL: `https://api.seu-dominio.com/webhooks/whatsapp`
- Verify Token: valor de `WA_VERIFY_TOKEN`
- Assine o evento: `messages`
- Phone Number ID: copie para `WA_PHONE_NUMBER_ID`
- Access Token (long-lived): cole em `WA_ACCESS_TOKEN`

### Rotas
- `GET /webhooks/whatsapp` (verificação)
- `POST /webhooks/whatsapp` (mensagens)
- `GET /health` (healthcheck simples)

### Erros comuns
- 403 no verify: `WA_VERIFY_TOKEN` divergente ou `hub.mode` diferente de `subscribe`.
- 401/403 ao enviar mensagem: `WA_ACCESS_TOKEN` inválido/expirado ou `WA_PHONE_NUMBER_ID` incorreto.
- 400 no Graph: payload fora do padrão (verifique `to`, `type`, `text.body`).

### Próximos passos
- Persistir conversas em banco de dados.
- Configurar persona via painel.
- Integrar LLM para respostas mais inteligentes.

---

## Scripts
- `npm run dev`: executa `node --watch src/index.js`.
- `npm run start`: executa `node src/index.js`.

## Licença
MIT
