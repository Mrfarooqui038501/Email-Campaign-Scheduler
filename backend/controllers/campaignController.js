const Campaign = require('../models/Campaign');
const EmailLog = require('../models/EmailLog');
const { scheduleEmail } = require('../services/schedulerService'); 

const createCampaign = async (req, res) => {
  try {
    const { title, message, recipients, scheduledTime } = req.body;
    const campaign = new Campaign({
      title, message, recipients, scheduledTime,
    });
    await campaign.save();
    
    scheduleEmail(campaign);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: error.message });
  }
};

const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    // Attach logs
    const campaignsWithLogs = await Promise.all(
      campaigns.map(async (campaign) => {
        const logs = await EmailLog.find({ campaignId: campaign._id });
        return { ...campaign.toObject(), logs };
      })
    );
    res.json(campaignsWithLogs);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createCampaign, getCampaigns };
