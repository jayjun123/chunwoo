import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import Login from './components/Login'
import StatusTabs from './components/StatusTabs'
import SiteList from './components/SiteList'
import ProgressList from './components/ProgressList'
import DiscussionList from './components/DiscussionList'
import UserList from './components/UserList'
import Calendar from './components/Calendar'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <AuthProvider>
      <AppContent activeTab={activeTab} setActiveTab={setActiveTab} />
    </AuthProvider>
  );
}

function AppContent({ activeTab, setActiveTab }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="app">
        <Login />
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <StatusTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'all' && <SiteList />}
        {activeTab === 'progress' && <ProgressList />}
        {activeTab === 'discussion' && <DiscussionList />}
        {activeTab === 'users' && <UserList />}
        {activeTab === 'calendar' && <Calendar />}
      </main>
    </div>
  );
}

export default App 