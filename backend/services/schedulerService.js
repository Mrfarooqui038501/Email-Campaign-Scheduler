const cron = require('node-cron');
const Campaign = require('../models/Campaign');
const { sendEmail } = require('./emailService');

const scheduledJobs = new Map();

const scheduleEmail = (campaign) => {
  const { _id, scheduledTime } = campaign;
  try {
    // Parse the scheduled time - treat the input as IST
    const scheduledDate = new Date(scheduledTime);
    if (isNaN(scheduledDate.getTime())) {
      console.error(`Invalid scheduledTime for campaign ${_id}: ${scheduledTime}`);
      Campaign.findByIdAndUpdate(_id, { status: 'failed' }).catch(console.error);
      return;
    }

    // Get current time
    const now = new Date();
    
    console.log(`Campaign ${_id}:`);
    console.log(`- Scheduled time (as received): ${scheduledTime}`);
    console.log(`- Scheduled Date object: ${scheduledDate.toISOString()}`);
    console.log(`- Current time: ${now.toISOString()}`);
    console.log(`- Scheduled IST display: ${scheduledDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`- Current IST display: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

    // Check if the scheduled time is in the past (with 10 second buffer)
    if (scheduledDate.getTime() < now.getTime() - 10000) {
      console.log(`Campaign ${_id} scheduled time is in the past, marking as failed`);
      Campaign.findByIdAndUpdate(_id, { status: 'failed' }).catch(console.error);
      return;
    }

    // Calculate delay in milliseconds
    const delay = scheduledDate.getTime() - now.getTime();
    
    console.log(`- Delay: ${Math.round(delay / 1000)} seconds`);

    // If delay is less than or equal to 0, execute immediately
    if (delay <= 0) {
      console.log(`Campaign ${_id} executing immediately`);
      setTimeout(async () => {
        try {
          console.log(`Executing campaign ${_id} immediately`);
          await sendEmail(campaign);
          await Campaign.findByIdAndUpdate(_id, { status: 'sent' });
        } catch (err) {
          console.error(`Campaign ${_id} failed:`, err);
          await Campaign.findByIdAndUpdate(_id, { status: 'failed' });
        }
      }, 1000); // 1 second delay to allow for response
      return;
    }

    // If delay is less than 2 minutes, use setTimeout for precision
    if (delay <= 120000) {
      const timeoutId = setTimeout(async () => {
        try {
          console.log(`Executing campaign ${_id} via setTimeout`);
          await sendEmail(campaign);
          await Campaign.findByIdAndUpdate(_id, { status: 'sent' });
        } catch (err) {
          console.error(`Campaign ${_id} failed:`, err);
          await Campaign.findByIdAndUpdate(_id, { status: 'failed' });
        }
        scheduledJobs.delete(_id.toString());
      }, delay);
      
      scheduledJobs.set(_id.toString(), { 
        type: 'timeout', 
        id: timeoutId, 
        destroy: () => clearTimeout(timeoutId) 
      });
      console.log(`Campaign ${_id} scheduled with setTimeout for ${Math.round(delay/1000)} seconds`);
      return;
    }

    // For longer delays, use cron scheduling
    // Since the input datetime is treated as IST, we need to schedule in IST timezone
    const cronExpression = `${scheduledDate.getMinutes()} ${scheduledDate.getHours()} ${scheduledDate.getDate()} ${scheduledDate.getMonth() + 1} *`;

    console.log(`- Cron expression: ${cronExpression}`);

    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }
    
    const job = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Executing campaign ${_id} via cron`);
        await sendEmail(campaign);
        await Campaign.findByIdAndUpdate(_id, { status: 'sent' });
      } catch (err) {
        console.error(`Campaign ${_id} failed:`, err);
        await Campaign.findByIdAndUpdate(_id, { status: 'failed' });
      }
      if (scheduledJobs.has(_id.toString())) {
        scheduledJobs.get(_id.toString()).destroy();
      }
      scheduledJobs.delete(_id.toString());
    }, { 
      scheduled: true, 
      timezone: 'Asia/Kolkata' // Use IST timezone directly
    });
    
    scheduledJobs.set(_id.toString(), { 
      type: 'cron', 
      job, 
      destroy: () => job.destroy() 
    });
    console.log(`Campaign ${_id} scheduled with cron in IST timezone`);
    
  } catch (err) {
    console.error(`Error scheduling campaign ${_id}:`, err);
    Campaign.findByIdAndUpdate(_id, { status: 'failed' }).catch(console.error);
  }
};

const initializeScheduler = async () => {
  try {
    console.log('Initializing scheduler...');
    console.log(`Current time: ${new Date().toISOString()}`);
    console.log(`Current IST: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    
    const pending = await Campaign.find({ status: 'pending' });
    console.log(`Found ${pending.length} pending campaigns`);
    
    pending.forEach(scheduleEmail);
  } catch (e) { 
    console.error('initializeScheduler error:', e); 
  }
};

const cancelScheduledJob = (campaignId) => {
  const jobId = campaignId.toString();
  if (scheduledJobs.has(jobId)) {
    scheduledJobs.get(jobId).destroy();
    scheduledJobs.delete(jobId);
    console.log(`Cancelled scheduled job for campaign ${campaignId}`);
    return true;
  }
  return false;
};

module.exports = { 
  scheduleEmail, 
  initializeScheduler,
  cancelScheduledJob
};