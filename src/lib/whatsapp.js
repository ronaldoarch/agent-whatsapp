import axios from 'axios';

const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || '';
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || '';

const http = axios.create({
  baseURL: `https://graph.facebook.com/v20.0/${WA_PHONE_NUMBER_ID}`,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
  },
  timeout: 10000,
});

export async function sendText(to, body) {
  try {
    if (!WA_ACCESS_TOKEN || !WA_PHONE_NUMBER_ID) {
      console.warn('[WhatsApp] WA_ACCESS_TOKEN/WA_PHONE_NUMBER_ID ausentes');
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: String(to),
      type: 'text',
      text: { body: String(body) },
    };

    const response = await http.post('/messages', payload);
    return response?.data;
  } catch (err) {
    // Log detailed error
    if (err?.response) {
      console.error('[WhatsApp] Falha no envio:', {
        status: err.response.status,
        data: err.response.data,
      });
    } else {
      console.error('[WhatsApp] Erro no envio:', err?.message || err);
    }
    throw err;
  }
}
