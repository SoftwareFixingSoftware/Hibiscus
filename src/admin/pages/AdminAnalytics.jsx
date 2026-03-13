import React, { useState } from 'react';
import AdminFollowedSeries from './AdminFollowedSeries';
import AdminListeningHistory from './AdminListeningHistory';
import AdminSeriesReviews from './AdminSeriesReviews';
import '../styles/admin-analytics.css'; // will use global classes

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState('followed');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'followed':
        return <AdminFollowedSeries />;
      case 'listening':
        return <AdminListeningHistory />;
      case 'reviews':
        return <AdminSeriesReviews />;
      default:
        return <AdminFollowedSeries />;
    }
  };

  return (
    <div className="adm-analytics-section">
      <h3>Analytics</h3>
      <div className="adm-tab-bar">
        <button
          className={`adm-tab-button ${activeTab === 'followed' ? 'adm-active' : ''}`}
          onClick={() => setActiveTab('followed')}
        >
          Followed Series
        </button>
        <button
          className={`adm-tab-button ${activeTab === 'listening' ? 'adm-active' : ''}`}
          onClick={() => setActiveTab('listening')}
        >
          Listening History
        </button>
        <button
          className={`adm-tab-button ${activeTab === 'reviews' ? 'adm-active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Series Reviews
        </button>
      </div>
      <div className="adm-tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminAnalytics;