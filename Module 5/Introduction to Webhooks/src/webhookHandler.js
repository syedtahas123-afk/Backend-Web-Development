'use strict';

const crypto = require('node:crypto');
const { handleEvent } = require('./eventHandlers');

// Event IDs are kept for the lifetime of this process. In production, use a
// shared durable store (for example, a database UNIQUE constraint or Redis).
const _processedIds = new Set();

async function handleWebhook(req, res) {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || typeof secret !== 'string' || !secret || !Buffer.isBuffer(req.body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const match = /^sha256=([a-f0-9]{64})$/i.exec(signature);
  if (!match) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest();
  const received = Buffer.from(match[1], 'hex');

  // timingSafeEqual throws for unequal lengths; validate the digest length first.
  if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!event || typeof event.id !== 'string' || event.id.length === 0) {
    return res.status(400).json({ error: 'Missing event id' });
  }

  if (_processedIds.has(event.id)) {
    return res.status(200).json({ status: 'already_processed' });
  }

  // Mark before acknowledging/scheduling work so retries cannot enqueue twice.
  _processedIds.add(event.id);
  res.status(200).json({ status: 'received' });

  // Acknowledge the provider before running potentially slow event processing.
  setImmediate(() => {
    Promise.resolve(handleEvent(event)).catch((error) => {
      // Keep background failures from becoming unhandled rejections.
      console.error('Webhook event processing failed:', error);
    });
  });
}

module.exports = { handleWebhook, _processedIds };
