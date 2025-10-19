const DEFAULT_PERSONA = 'Você é o assistente comercial da Agência Midas. Responda de forma objetiva, com foco em conversão e clareza.';

function includesAny(text, terms) {
  const normalized = text.toLowerCase();
  return terms.some((t) => normalized.includes(t));
}

export async function generateReply(userText, options = {}) {
  const persona = options.persona || process.env.AGENT_PERSONA || DEFAULT_PERSONA;
  const text = (userText || '').toLowerCase().trim();

  // Regras simples
  if (includesAny(text, ['preço', 'preco', 'valor', 'quanto', 'custa'])) {
    return 'Para te enviar uma proposta objetiva, me diga por favor: seu nicho, a meta em R$ e o prazo desejado. Com isso já te mando valores e próximos passos.';
  }

  if (includesAny(text, ['raspadinh', 'rifa'])) {
    return 'Temos um plano rápido de 7 dias para raspadinha/rifa, focado em conversão direta. Responda com "raspa 7d" se quiser começar agora.';
  }

  if (includesAny(text, ['bet', 'aposta', 'cassino'])) {
    return 'Para bet/apostas/cassino, indicamos um plano de 14 dias com campanhas otimizadas. Responda com "bet 14d" para receber o roteiro e valores.';
  }

  if (includesAny(text, ['proposta', 'fechar', 'contrato'])) {
    return 'Perfeito! Me passe um contato (e-mail/WhatsApp) e o melhor horário para alinharmos a proposta e o fechamento.';
  }

  // Fallback com persona
  return [
    `${persona}`,
    '',
    'Posso te ajudar com:',
    '- Proposta rápida (valores e prazos)',
    '- Método de trabalho',
    '- Cases e resultados',
    '',
    'Qual opção você prefere?'
  ].join('\n');
}

/*
// Integração futura com LLM (OpenAI) — Exemplo (NÃO usado ainda):
// import OpenAI from 'openai';
// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// export async function generateReplyLLM(userText, persona = DEFAULT_PERSONA) {
//   const prompt = `${persona}\nUsuário: ${userText}\nAssistente:`;
//   const { choices } = await client.chat.completions.create({
//     model: 'gpt-4o-mini',
//     messages: [
//       { role: 'system', content: persona },
//       { role: 'user', content: userText },
//     ],
//     temperature: 0.4,
//   });
//   return choices?.[0]?.message?.content?.trim() || '';
// }
*/
