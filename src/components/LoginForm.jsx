import React, { useState } from 'react';
import { login, sendPasswordReset } from '../services/auth';
import SignupForm from './SignupForm';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showSignup, setShowSignup] = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      await login(email, pw);
    } catch (err) {
      setError('로그인 실패: ' + (err.message || ''));
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('비밀번호 재설정할 이메일을 입력하세요.');
      return;
    }
    try {
      await sendPasswordReset(email);
      setInfo('비밀번호 재설정 메일이 전송되었습니다. 메일함을 확인하세요.');
    } catch (err) {
      setError('재설정 메일 전송 실패: ' + (err.message || ''));
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
      <button className="reset-btn" type="button" onClick={handleResetPassword}>비밀번호 재설정</button>
      {error && <div className="error-msg">{error}</div>}
      {info && <div className="info-msg">{info}</div>}
    </form>
  );
}

export default LoginForm; 