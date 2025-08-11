import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../App.css'; 

function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/campaigns');
        setCampaigns(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError('Failed to load campaigns. Please ensure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  // Check scroll position and update button states
  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  // Update scroll buttons when campaigns load
  useEffect(() => {
    if (campaigns.length > 0) {
      setTimeout(() => {
        checkScrollButtons();
      }, 100);
    }
  }, [campaigns]);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -350, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 300);
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 350, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 300);
    }
  };

  return (
    <div className="campaign-list-container">
      <div className="campaign-logs-header">
        <h2 className="campaign-list-title">Campaigns</h2>
        {!loading && campaigns.length > 0 && (
          <div className="campaign-count-badge">
            {campaigns.length} Campaign{campaigns.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      {loading && <p className="status-message">Loading campaigns...</p>}
      {error && <p className="status-message error-message">{error}</p>}
      
      {!loading && campaigns.length === 0 && !error && (
        <div className="no-campaigns-message">
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            <h3>No Campaigns Yet</h3>
            <p>Create your first email campaign to get started!</p>
          </div>
        </div>
      )}
      
      <div className="campaign-cards-container">
        {campaigns.length > 0 && (
          <>
            <button
              className={`scroll-btn scroll-btn-left ${!canScrollLeft ? 'disabled' : ''}`}
              onClick={scrollLeft}
              disabled={!canScrollLeft}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <button
              className={`scroll-btn scroll-btn-right ${!canScrollRight ? 'disabled' : ''}`}
              onClick={scrollRight}
              disabled={!canScrollRight}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </>
        )}
        <div 
          className="campaign-cards-row"
          ref={scrollContainerRef}
          onScroll={checkScrollButtons}
        >
          {campaigns.map((campaign) => (
            <div key={campaign._id} className="campaign-card">
              <div className="campaign-card-header">
                <h3>{campaign.title}</h3>
                <div className={`status-badge status-${campaign.status}`}>
                  {campaign.status}
                </div>
              </div>
              
              <div className="campaign-details">
                <div className="detail-item">
                  <strong>Scheduled Time</strong>
                  <div>{new Date(campaign.scheduledTime).toLocaleString()}</div>
                </div>
                
                <div className="detail-item">
                  <strong>Recipients</strong>
                  <div className="recipients-list">
                    {campaign.recipients.slice(0, 3).map((recipient, index) => (
                      <span key={index} className="recipient-tag">
                        {recipient}
                      </span>
                    ))}
                    {campaign.recipients.length > 3 && (
                      <span className="recipient-tag more">
                        +{campaign.recipients.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="logs-block">
                <div className="logs-header">
                  <strong>Email Logs</strong>
                  {campaign.logs && campaign.logs.length > 0 && (
                    <span className="logs-count">{campaign.logs.length}</span>
                  )}
                </div>
                
                {campaign.logs && campaign.logs.length > 0 ? (
                  <ul className="logs-list">
                    {campaign.logs.slice(0, 4).map((log, index) => (
                      <li key={index} className="log-item">
                        <span className="log-recipient">{log.recipient}</span>
                        <span className={`log-status log-status-${log.status}`}>
                          {log.status}
                        </span>
                        {log.error && (
                          <span className="log-error">({log.error})</span>
                        )}
                      </li>
                    ))}
                    {campaign.logs.length > 4 && (
                      <li className="log-item more-logs">
                        +{campaign.logs.length - 4} more logs
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="no-logs">No logs available yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CampaignList;