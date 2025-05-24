import React, { useState } from 'react';
import { login } from '../services/auth';
import SignupForm from './SignupForm';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [showSignup, setShowSignup] = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    try {
      await login(email, pw);
    } catch (err) {
      setError('로그인 실패: ' + (err.message || ''));
    }
  };

  if (showSignup) return <SignupForm onBack={() => setShowSignup(false)} />;

  return (
    <form className="login-box" onSubmit={handleLogin}>
      <h2>로그인</h2>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="이메일" autoComplete="username" />
      <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호" autoComplete="current-password" />
      <button className="login-btn" type="submit">로그인</button>
      <button className="signup-btn" type="button" onClick={() => setShowSignup(true)}>회원가입</button>
      {error && <div className="error-msg">{error}</div>}
    </form>
  );
}

export default LoginForm; 