import React, { useState } from 'react';
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setMessageType('');

    try {
      await axios.post('http://localhost:5000/api/campaigns', {
        ...formData,
        recipients: formData.recipients.split(',').map((email) => email.trim()),
      });
      setMessage('Campaign created successfully!');
      setMessageType('success');
      setFormData({ title: '', message: '', recipients: '', scheduledTime: '' });
    } catch (error) {
      setMessage('Error creating campaign: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
      console.error('Error creating campaign:', error);
    }
  };

  return (
    <div className="campaign-form"> 
      <h2>Create New Campaign</h2>
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
            required
          />
        </div>
        <div>
          <label htmlFor="scheduledTime">Scheduled Time:</label>
          <input
            type="datetime-local"
            id="scheduledTime"
            name="scheduledTime"
            value={formData.scheduledTime}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Schedule Campaign</button>
      </form>
    </div>
  );
}

export default CampaignForm;
