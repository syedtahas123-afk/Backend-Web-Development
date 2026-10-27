require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json({ limit: '16kb' }));
app.use('/auth', authRoutes);

// Do not log raw database/authentication errors or expose implementation details.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API listening on ${port}`));
