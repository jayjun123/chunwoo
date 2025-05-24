import React, { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import Login from './components/Login'
import StatusTabs from './components/StatusTabs'
import SiteList from './components/SiteList'
import ProgressList from './components/ProgressList'
import DiscussionList from './components/DiscussionList'
import UserList from './components/UserList'
import Calendar from './components/Calendar'
import LoginForm from './components/LoginForm'
import DeleteExampleData from './components/DeleteExampleData'
import { subscribeAuthState } from './services/auth'
import { UserProvider, useUser } from './components/UserContext'
import './App.css'

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeAuthState(setUser);
    return () => unsubscribe();
  }, []);

  if (!user) return <LoginForm />;
  return <SiteList />;
}

function AppContent({ activeTab, setActiveTab }) {
  const { currentUser } = useAuth();
  const { user, userData, loading, logout } = useUser();

  if (loading) return <div>로딩 중...</div>;
  if (!user) return <LoginForm />;
  if (!userData) return <div>회원 정보 불러오는 중...</div>;
  if (userData.status !== '승인') return <div>관리자 승인 대기 중입니다.</div>;

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
        {userData.role === 'admin' && <DeleteExampleData />}
      </main>
      <button onClick={logout}>로그아웃</button>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <UserProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </UserProvider>
  );
} 
