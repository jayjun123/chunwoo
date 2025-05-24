import React from 'react';

function Header({ user, onLogout }) {
  return (
    <header className="header">
      <span className="logo">Chunwoo Dashboard</span>
      <span className="user-info">
        {user?.email}
        <button onClick={onLogout}>로그아웃</button>
      </span>
    </header>
  );
}

export default Header; 