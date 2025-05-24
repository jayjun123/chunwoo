import React, { useState } from 'react';
import { signup } from '../services/auth';

function SignupForm({ onBack }) {
  const [form, setForm] = useState({ email: '', password: '', name: '', org: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignup = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await signup(form);
      setSuccess('회원가입 신청 완료! 관리자의 승인을 기다려주세요.');
    } catch (err) {
      setError('회원가입 실패: ' + (err.message || ''));
    }
  };

  return (
    <form className="login-box" onSubmit={handleSignup}>
      <h2>회원가입</h2>
      <input name="email" value={form.email} onChange={handleChange} placeholder="이메일" autoComplete="username" />
      <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="비밀번호" autoComplete="new-password" />
      <input name="name" value={form.name} onChange={handleChange} placeholder="이름" />
      <input name="org" value={form.org} onChange={handleChange} placeholder="소속" />
      <button className="login-btn" type="submit">회원가입</button>
      <button className="signup-btn" type="button" onClick={onBack}>로그인으로</button>
      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}
    </form>
  );
}

export default SignupForm; 