const express = require('express');
const router = express.Router();


router.get('/test', (req, res) => {
  res.json({ message: 'Campaign routes are working!' });
});


console.log('Importing controller functions...');
const { createCampaign, getCampaigns } = require('../controllers/campaignController');


console.log('createCampaign:', typeof createCampaign);
console.log('getCampaigns:', typeof getCampaigns);


if (typeof createCampaign === 'function') {
  router.post('/', createCampaign);
  console.log('✅ POST route added');
} else {
  console.error('❌ createCampaign is not a function:', createCampaign);
}

if (typeof getCampaigns === 'function') {
  router.get('/', getCampaigns);
  console.log('✅ GET route added');
} else {
  console.error('❌ getCampaigns is not a function:', getCampaigns);
}

module.exports = router;
