import React, { useState } from 'react';
import AdminFollowedSeries from './AdminFollowedSeries';
import AdminSeriesReviews from './AdminSeriesReviews';
import AdminListeningHistory from './AdminListeningHistory';
import './AdminAnalytics.css';

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState('listening');

  const tabs = [
    { id: 'listening', label: 'Listening History', component: AdminListeningHistory },
    { id: 'followed', label: 'Followed Series', component: AdminFollowedSeries },
    { id: 'reviews', label: 'Series Reviews', component: AdminSeriesReviews }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || AdminListeningHistory;

  return (
    <div className="admin-analytics">
      <h2>Admin Analytics Dashboard</h2>
      <div className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default AdminAnalytics;