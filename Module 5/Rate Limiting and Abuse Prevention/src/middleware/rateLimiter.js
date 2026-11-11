'use strict';

// Shared limiter for the login, register, and refresh routes.
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Allow at most five attempts per IP in each window.
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Production scaling note:
// The default MemoryStore keeps counters inside this Node.js process. Behind a
// load balancer, each application instance would therefore maintain a separate
// counter, allowing a client to exceed the intended limit by spreading requests
// across instances. Install and configure rate-limit-redis, then pass a shared
// RedisStore through the store option (with every instance connected to the
// same Redis deployment). All instances will then increment the same counters
// and enforce one consistent limit across the cluster.

module.exports = authLimiter;
