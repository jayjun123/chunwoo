import React from 'react';
import '../styles/StatusTabs.css';

function StatusTabs({ activeTab, onTabChange }) {
  const tabs = [
    { key: 'main', label: '건설NEWS' },
    { key: 'all', label: '공사현황' },
    { key: 'progress', label: '기성현황' },
    { key: 'discussion', label: '협의하기' },
    { key: 'users', label: '회원관리' },
    { key: 'calendar', label: '달력' }
  ];

  return (
    <nav className="status-tabs">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={activeTab === tab.key ? 'active' : ''}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default StatusTabs; 