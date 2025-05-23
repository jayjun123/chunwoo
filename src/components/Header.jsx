import React, { useState } from 'react';
import '../styles/Header.css';

function Header() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const currentDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <header>
      <div className="header-left">
        <div className="logo">Chunwoo</div>
        <button className="nav-toggle" onClick={toggleNav}>
          ☰
        </button>
      </div>
      <nav className={isNavOpen ? 'nav-open' : ''}>
        <a href="/" className="active">대시보드</a>
        <a href="/sites">사이트</a>
        <a href="/analytics">분석</a>
        <a href="/settings">설정</a>
      </nav>
      <div className="header-right">
        <span className="date">{currentDate}</span>
        <button className="logout-btn">로그아웃</button>
      </div>
    </header>
  );
}

export default Header; 