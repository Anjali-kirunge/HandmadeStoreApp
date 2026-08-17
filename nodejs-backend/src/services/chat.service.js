const db = require('../config/db');
const env = require('../config/env');
const { AiServiceException } = require('../utils/errors');

const CATALOG_KEYWORDS = ['product', 'catalog', 'list', 'available', 'price', 'buy', 'purchase', 'item', 'handmade', 'you have', 'sell', 'show'];
const ORDER_KEYWORDS = ['order', 'delivery', 'track', 'deliver', 'shipped', 'cancel', 'refund', 'return'];
const ACCOUNT_KEYWORDS = ['login', 'sign in', 'account', 'register', 'sign up', 'otp', 'password'];

function hasAny(message, keywords) {
  const lower = message.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

async function catalogReply(message) {
  const rows = await db.query(
    "SELECT name, price, discount_price FROM products WHERE status = 'ACTIVE' ORDER BY rating DESC, review_count DESC LIMIT 5"
  );
  if (!rows.length) {
    return { reply: 'Our catalog is currently empty, but new handmade items are added regularly. Check back soon!' };
  }
  const lines = rows.map((r, i) => {
    const price = r.discount_price !== null && r.discount_price !== undefined ? r.discount_price : r.price;
    return `${i + 1}. ${r.name} - ₹${price}`;
  });
  return {
    reply: `Here are some popular handmade items available right now:\n${lines.join('\n')}\n\nYou can browse all products in our catalog or ask me about a specific one!`,
  };
}

function orderReply() {
  return {
    reply:
      'To check your orders, please log in and visit the "My Orders" section. You can track delivery status, cancel pending orders, and request returns there. Is there anything specific about an order you would like help with?',
  };
}

function accountReply() {
  return {
    reply:
      'To create an account or log in, use the buttons in the top navigation. If you forgot your password, click "Forgot Password" on the login page and we will send an OTP to your email. How can I help?',
  };
}

function friendlyFallback() {
  const responses = [
    'I can help you find handmade products, check prices, or answer questions about ordering and delivery. Could you try rephrasing your question?',
    "I'm your Handmade Store assistant. Ask me about our products, how to place an order, shipping, returns, or account help!",
    'I did not quite catch that. Try asking something like "Show me products under ₹500" or "How do I track my order?".',
  ];
  return { reply: responses[Math.floor(Math.random() * responses.length)] };
}

async function hfReply(message, history) {
  if (!env.hf.apiKey) {
    throw new Error('HUGGINGFACE_KEY_NOT_SET');
  }
  const messages = [
    {
      role: 'system',
      content:
        'You are a friendly customer support assistant for Handmade Store, an online marketplace for handmade products. Keep answers short, helpful, and in the same language as the user. If you do not know, suggest browsing the catalog or contacting support.',
    },
  ];
  const recent = Array.isArray(history) ? history.slice(-10) : [];
  for (const h of recent) {
    if (h && h.role && h.content) messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: String(h.content) });
  }
  messages.push({ role: 'user', content: message });

  for (const model of [env.hf.model, env.hf.fallbackModel]) {
    try {
      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.hf.apiKey}`,
        },
        body: JSON.stringify({ model, messages, max_tokens: 300, temperature: 0.6 }),
      });
      if (!response.ok) continue;
      const data = await response.json();
      const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (reply) return { reply: reply.trim() };
    } catch (err) {
      continue;
    }
  }
  throw new Error('HUGGINGFACE_UNAVAILABLE');
}

async function chat(message, history) {
  if (!message || !String(message).trim()) {
    throw new AiServiceException('Message is required');
  }
  const text = String(message);

  if (hasAny(text, CATALOG_KEYWORDS)) {
    return catalogReply();
  }
  if (hasAny(text, ORDER_KEYWORDS)) {
    return orderReply();
  }
  if (hasAny(text, ACCOUNT_KEYWORDS)) {
    return accountReply();
  }

  try {
    return await hfReply(text, history);
  } catch (err) {
    return friendlyFallback();
  }
}

module.exports = { chat };
