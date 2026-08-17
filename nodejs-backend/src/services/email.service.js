const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtp.user || !env.smtp.pass) return null;
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
  return transporter;
}

async function sendOtpEmail(to, otp, typeName, expiryMinutes) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[EMAIL_DEV] OTP for ${to}: ${otp} (${typeName}, expires in ${expiryMinutes} minutes)`);
    return;
  }
  try {
    await transport.sendMail({
      from: env.smtp.from,
      to,
      subject: `Your Handmade Store ${typeName} OTP`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2>Handmade Store</h2>
          <p>Your ${typeName.toLowerCase()} code is:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${otp}</div>
          <p>This code is valid for ${expiryMinutes} minutes.</p>
        </div>`,
    });
    console.log(`[EMAIL] OTP email sent to ${to} (${typeName})`);
  } catch (err) {
    console.warn(`[EMAIL] Failed to send OTP email to ${to}: ${err.message}`);
  }
}

async function sendOrderStatusEmail(to, title, message) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[EMAIL_DEV] Notification for ${to}: ${title} - ${message}`);
    return;
  }
  try {
    await transport.sendMail({
      from: env.smtp.from,
      to,
      subject: title,
      text: message,
    });
  } catch (err) {
    console.warn(`[EMAIL] Failed to send notification to ${to}: ${err.message}`);
  }
}

module.exports = { sendOtpEmail, sendOrderStatusEmail };
