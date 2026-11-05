'use strict';
// routes/payments.js
// POST /payments is protected against duplicate charges by an Idempotency-Key.

const router = require('express').Router();
const { charges, idempotency, nextChargeId } = require('../store');

router.post('/', (req, res) => {
  const key = req.headers['idempotency-key'];

  // A request without a key cannot be safely deduplicated.
  if (!key) {
    return res.status(400).json({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'The Idempotency-Key header is required.'
      }
    });
  }

  // Replay the exact response for a previously processed operation.
  const saved = idempotency.get(key);
  if (saved) {
    return res.status(saved.status).json(saved.body);
  }

  // First request for this key: perform the charge exactly once.
  const amount = req.body && req.body.amount;
  const charge = {
    id: nextChargeId(),
    amount,
    status: 'charged'
  };
  charges.push(charge);

  const status = 201;
  const body = {
    id: charge.id,
    amount: charge.amount,
    status: charge.status
  };

  // Cache both status and body so retries receive an identical response.
  idempotency.set(key, { status, body });

  return res.status(status).json(body);
});

module.exports = router;
