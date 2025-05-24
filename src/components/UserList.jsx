import React, { useEffect, useState } from 'react';
import { subscribeToUsers, updateUser } from '../services/database';
import { useUser } from './UserContext';

const ROLE_LABELS = { master: '마스터', admin: '관리자', user: '일반회원' };
const STATUS_LABELS = { 승인: '승인', 요청: '요청', 거절: '거절' };

function UserList() {
  const { userData } = useUser();
  const isAdmin = userData && (userData.role === 'admin' || userData.role === 'master');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = subscribeToUsers(snapshot => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe && unsubscribe();
  }, [isAdmin]);

  const handleChangeRole = async (id, role) => {
    try {
      await updateUser(id, { role });
    } catch (err) {
      setError('권한 변경 실패: ' + (err.message || ''));
    }
  };
  const handleChangeStatus = async (id, status) => {
    try {
      await updateUser(id, { status });
    } catch (err) {
      setError('승인/거절 변경 실패: ' + (err.message || ''));
    }
  };

  if (!isAdmin) return <div className="container card"><h2>회원관리</h2><div>관리자/마스터만 접근 가능합니다.</div></div>;

  return (
    <div className="container card">
      <h2>회원관리</h2>
      {error && <div className="error-message">{error}</div>}
      <table style={{width:'100%',marginTop:16}}>
        <thead>
          <tr>
            <th>이메일</th>
            <th>이름</th>
            <th>소속</th>
            <th>권한</th>
            <th>승인상태</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{background:u.role==='master'?'#232837':'',color:u.role==='master'?'#3b82f6':''}}>
              <td>{u.email}</td>
              <td>{u.name}</td>
              <td>{u.org}</td>
              <td>
                <select value={u.role} onChange={e=>handleChangeRole(u.id, e.target.value)} disabled={u.role==='master'}>
                  <option value="master">마스터</option>
                  <option value="admin">관리자</option>
                  <option value="user">일반회원</option>
                </select>
              </td>
              <td>
                <select value={u.status} onChange={e=>handleChangeStatus(u.id, e.target.value)} disabled={u.role==='master'}>
                  <option value="승인">승인</option>
                  <option value="요청">요청</option>
                  <option value="거절">거절</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{color:'#b3b8c5',fontSize:'0.98em',marginTop:12}}>
        마스터는 항상 1명, 권한/승인 변경 불가. <br />
        승인된 회원만 로그인 가능. <br />
        권한/승인 변경 시 실시간 반영됩니다.
      </div>
    </div>
  );
}

export default UserList; 