import React, { useState, useEffect } from 'react';
import { subscribeToSites, addSite, updateSite, deleteSite } from '../services/database';
import '../styles/SiteList.css';

function SiteList() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [newSite, setNewSite] = useState({
    name: '',
    startDate: '',
    endDate: '',
    contractAmount: '',
    status: '진행중'
  });

  useEffect(() => {
    const unsubscribe = subscribeToSites((snapshot) => {
      const sitesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSites(sitesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddSite = async (e) => {
    e.preventDefault();
    try {
      await addSite(newSite);
      setNewSite({
        name: '',
        startDate: '',
        endDate: '',
        contractAmount: '',
        status: '진행중'
      });
      setIsAddingSite(false);
    } catch (err) {
      setError('현장 추가에 실패했습니다.');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateSite(id, { status: newStatus });
    } catch (err) {
      setError('상태 업데이트에 실패했습니다.');
    }
  };

  const handleDeleteSite = async (id) => {
    if (window.confirm('정말로 이 현장을 삭제하시겠습니까?')) {
      try {
        await deleteSite(id);
      } catch (err) {
        setError('현장 삭제에 실패했습니다.');
      }
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="site-list-container">
      <div className="site-list-header">
        <h2>전체현장리스트</h2>
        <button 
          className="add-site-btn"
          onClick={() => setIsAddingSite(true)}
        >
          현장 추가
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isAddingSite && (
        <form className="add-site-form" onSubmit={handleAddSite}>
          <input
            type="text"
            placeholder="현장명"
            value={newSite.name}
            onChange={(e) => setNewSite({...newSite, name: e.target.value})}
            required
          />
          <input
            type="date"
            value={newSite.startDate}
            onChange={(e) => setNewSite({...newSite, startDate: e.target.value})}
            required
          />
          <input
            type="date"
            value={newSite.endDate}
            onChange={(e) => setNewSite({...newSite, endDate: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="계약금액"
            value={newSite.contractAmount}
            onChange={(e) => setNewSite({...newSite, contractAmount: e.target.value})}
            required
          />
          <select
            value={newSite.status}
            onChange={(e) => setNewSite({...newSite, status: e.target.value})}
          >
            <option value="진행중">진행중</option>
            <option value="보류">보류</option>
            <option value="예정">예정</option>
            <option value="완료">완료</option>
          </select>
          <div className="form-buttons">
            <button type="submit">추가</button>
            <button type="button" onClick={() => setIsAddingSite(false)}>취소</button>
          </div>
        </form>
      )}

      <div className="site-list">
        <table>
          <thead>
            <tr>
              <th>현장명</th>
              <th>공사기간</th>
              <th>계약금액</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {sites.map(site => (
              <tr key={site.id}>
                <td>{site.name}</td>
                <td>{`${site.startDate} ~ ${site.endDate}`}</td>
                <td>{Number(site.contractAmount).toLocaleString()}원</td>
                <td>
                  <select
                    value={site.status}
                    onChange={(e) => handleUpdateStatus(site.id, e.target.value)}
                  >
                    <option value="진행중">진행중</option>
                    <option value="보류">보류</option>
                    <option value="예정">예정</option>
                    <option value="완료">완료</option>
                  </select>
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteSite(site.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SiteList; 