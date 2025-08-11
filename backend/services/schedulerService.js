const cron = require('node-cron');
const Campaign = require('../models/Campaign');
const { sendEmail } = require('./emailService');

const scheduledJobs = new Map();


const scheduleEmail = (campaign) => {
  const { _id, scheduledTime } = campaign;
  try {
    const date = new Date(scheduledTime);
    if (isNaN(date.getTime())) throw new Error('Invalid scheduledTime');

 
    if (date.getTime() < Date.now() - 5000) {
      Campaign.findByIdAndUpdate(_id, { status: 'failed' }).catch(console.error);
      return;
    }
    const delay = date.getTime() - Date.now();
    if (delay <= 120000) { // < 2 min
      const timeoutId = setTimeout(async () => {
        try {
          await sendEmail(campaign);
          await Campaign.findByIdAndUpdate(_id, { status: 'sent' });
        } catch (err) {
          await Campaign.findByIdAndUpdate(_id, { status: 'failed' });
        }
        scheduledJobs.delete(_id.toString());
      }, delay);
      scheduledJobs.set(_id.toString(), { type: 'timeout', id: timeoutId, destroy: () => clearTimeout(timeoutId) });
      return;
    }
    
    const cronExpression = `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;

    if (!cron.validate(cronExpression)) throw new Error(`Invalid cronExpr=${cronExpression}`);
    const job = cron.schedule(cronExpression, async () => {
      try {
        await sendEmail(campaign);
        await Campaign.findByIdAndUpdate(_id, { status: 'sent' });
      } catch (err) {
        await Campaign.findByIdAndUpdate(_id, { status: 'failed' });
      }
      if (scheduledJobs.has(_id.toString())) scheduledJobs.get(_id.toString()).destroy();
      scheduledJobs.delete(_id.toString());
    }, { scheduled: true, timezone: 'UTC', });
    scheduledJobs.set(_id.toString(), { type: 'cron', job, destroy: () => job.destroy() });
  } catch (err) {
    console.error(`Error scheduling campaign ${_id}:`, err);
    Campaign.findByIdAndUpdate(_id, { status: 'failed' }).catch(console.error);
  }
};


const initializeScheduler = async () => {
  try {
    const pending = await Campaign.find({ status: 'pending' });
    pending.forEach(scheduleEmail);
  } catch (e) { console.error('initializeScheduler', e); }
};

module.exports = { scheduleEmail, initializeScheduler };
