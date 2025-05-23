import React from 'react';
import '../styles/StatusTabs.css';

function StatusTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'all', label: '전체' },
    { id: 'active', label: '활성' },
    { id: 'inactive', label: '비활성' },
    { id: 'error', label: '오류' }
  ];

  return (
    <div className="status-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`status-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default StatusTabs; 