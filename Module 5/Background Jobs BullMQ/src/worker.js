'use strict';

const { Worker } = require('bullmq');
const { connection } = require('./queue');
const { transporter } = require('./email');

const worker = new Worker('email', async (job) => {
  if (job.name === 'otp') {
    const { to, otp } = job.data || {};
    if (!to || !/^\d{6}$/.test(String(otp))) {
      throw new Error('OTP email job requires a recipient and a 6-digit OTP');
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Threadbase <no-reply@threadbase.local>',
      to,
      subject: 'Your Threadbase verification code',
      text: `Your email verification code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your email verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });
    return;
  }

  throw new Error(`Unsupported email job: ${job.name}`);
}, {
  connection,
});

worker.on('completed', (job) => {
  console.log(`Email job ${job.id} (${job.name}) completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id ?? 'unknown'} failed: ${err.message}`);
});

module.exports = worker;
