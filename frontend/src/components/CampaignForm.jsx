import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css'; 

function CampaignForm() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipients: '',
    scheduledTime: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [currentISTTime, setCurrentISTTime] = useState('');

  // Helper function to get current IST time in datetime-local format
  const getCurrentISTDateTime = () => {
    const now = new Date();
    // Convert to IST (UTC + 5:30)
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const year = istTime.getUTCFullYear();
    const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istTime.getUTCDate()).padStart(2, '0');
    const hours = String(istTime.getUTCHours()).padStart(2, '0');
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to display current IST time
  const getDisplayISTTime = () => {
    const now = new Date();
    return now.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Update current time display every second
  useEffect(() => {
    const updateTime = () => {
      setCurrentISTTime(getDisplayISTTime());
    };
    
    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Set minimum datetime to current IST time
  useEffect(() => {
    const datetimeInput = document.getElementById('scheduledTime');
    if (datetimeInput) {
      datetimeInput.min = getCurrentISTDateTime();
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setMessageType('');

    try {
      // Validate that scheduled time is in the future
      const scheduledDate = new Date(formData.scheduledTime);
      const now = new Date();
      
      if (scheduledDate.getTime() <= now.getTime()) {
        setMessage('Scheduled time must be in the future!');
        setMessageType('error');
        return;
      }

      // The datetime-local input gives us local time, which we treat as IST
      // No conversion needed - backend will handle IST interpretation
      await axios.post('https://email-campaign-scheduler-1.onrender.com/api/campaigns', {
        ...formData,
        recipients: formData.recipients.split(',').map((email) => email.trim()),
      });
      
      setMessage('Campaign created successfully! It will be sent at the specified IST time.');
      setMessageType('success');
      setFormData({ title: '', message: '', recipients: '', scheduledTime: '' });
      
      // Reset the minimum time for the input
      const datetimeInput = document.getElementById('scheduledTime');
      if (datetimeInput) {
        datetimeInput.min = getCurrentISTDateTime();
      }
    } catch (error) {
      setMessage('Error creating campaign: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
      console.error('Error creating campaign:', error);
    }
  };

  return (
    <div className="campaign-form"> 
      <h2>Create New Campaign</h2>
      
      <div className="current-time-display">
        <strong>Current IST Time:</strong> {currentISTTime}
      </div>
      
      {message && (
        <div className={`message-box ${messageType}`}> 
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label htmlFor="message">Message (HTML):</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows="6"
          />
        </div>
        
        <div>
          <label htmlFor="recipients">Recipients (comma-separated):</label>
          <input
            type="text"
            id="recipients"
            name="recipients"
            value={formData.recipients}
            onChange={handleChange}
            placeholder="email1@example.com, email2@example.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="scheduledTime">
            Scheduled Time (IST):
            <small style={{display: 'block', color: '#666', fontSize: '0.9em', marginTop: '2px'}}>
              Select date and time when the campaign should be sent (Indian Standard Time)
            </small>
          </label>
          <input
            type="datetime-local"
            id="scheduledTime"
            name="scheduledTime"
            value={formData.scheduledTime}
            onChange={handleChange}
            min={getCurrentISTDateTime()}
            required
          />
        </div>
        
        <button type="submit">Schedule Campaign</button>
      </form>
    </div>
  );
}

export default CampaignForm;