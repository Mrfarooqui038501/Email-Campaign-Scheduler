const nodemailer = require('nodemailer');
const { DateTime } = require('luxon');
const EmailLog = require('../models/EmailLog');

const createTransporter = () => {
  console.log('SMTP Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS?.slice(0, 3) + '...',
  });
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Missing SMTP .env variables');
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  return transporter;
};

const getISTDate = () => {
  // Luxon: Convert to IST and format as JS date object
  return DateTime.now().setZone('Asia/Kolkata').toJSDate();
};

const sendEmail = async (campaign) => {
  const { _id, title, message, recipients } = campaign;
  const logs = [];
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('SMTP verified.');
    for (const recipient of recipients) {
      try {
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: recipient,
          subject: title,
          html: message,
        });
        console.log(`Sent to ${recipient}: ${info.messageId}`);
        logs.push({
          campaignId: _id,
          recipient,
          status: 'success',
          sentAt: getISTDate(), // Save IST timestamp
        });
      } catch (error) {
        console.error(`Failed to send to ${recipient}:`, error);
        logs.push({
          campaignId: _id,
          recipient,
          status: 'failed',
          error: error.message,
          sentAt: getISTDate(), // Save IST timestamp
        });
      }
    }
    if (logs.length > 0) await EmailLog.insertMany(logs);
    return logs;
  } catch (error) {
    console.error('Error sending campaign (all):', error);
    await EmailLog.insertMany(
      recipients.map((r) => ({
        campaignId: _id,
        recipient: r,
        status: 'failed',
        error: `SMTP Setup Error: ${error.message}`,
        sentAt: getISTDate(), // Save IST timestamp
      }))
    );
    throw error;
  }
};

module.exports = { sendEmail };
