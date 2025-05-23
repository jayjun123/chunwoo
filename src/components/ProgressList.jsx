import React, { useState, useEffect } from 'react';
import { 
  subscribeToSites, 
  subscribeToProgress, 
  addProgress, 
  updateProgress, 
  deleteProgress 
} from '../services/database';
import '../styles/ProgressList.css';

function ProgressList() {
  const [sites, setSites] = useState([]);
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [newProgress, setNewProgress] = useState({
    siteId: '',
    date: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    const unsubscribeSites = subscribeToSites((snapshot) => {
      const sitesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSites(sitesData);
    });

    const unsubscribeProgress = subscribeToProgress((snapshot) => {
      const progressData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProgressList(progressData);
      setLoading(false);
    });

    return () => {
      unsubscribeSites();
      unsubscribeProgress();
    };
  }, []);

  const handleAddProgress = async (e) => {
    e.preventDefault();
    try {
      const selectedSite = sites.find(site => site.id === newProgress.siteId);
      await addProgress({
        ...newProgress,
        siteName: selectedSite.name,
        contractAmount: selectedSite.contractAmount,
        startDate: selectedSite.startDate,
        endDate: selectedSite.endDate
      });
      setNewProgress({
        siteId: '',
        date: '',
        amount: '',
        description: ''
      });
      setIsAddingProgress(false);
    } catch (err) {
      setError('기성현황 추가에 실패했습니다.');
    }
  };

  const handleUpdateProgress = async (id, data) => {
    try {
      await updateProgress(id, data);
    } catch (err) {
      setError('기성현황 업데이트에 실패했습니다.');
    }
  };

  const handleDeleteProgress = async (id) => {
    if (window.confirm('정말로 이 기성현황을 삭제하시겠습니까?')) {
      try {
        await deleteProgress(id);
      } catch (err) {
        setError('기성현황 삭제에 실패했습니다.');
      }
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="progress-list-container">
      <div className="progress-list-header">
        <h2>기성현황</h2>
        <button 
          className="add-progress-btn"
          onClick={() => setIsAddingProgress(true)}
        >
          기성현황 추가
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isAddingProgress && (
        <form className="add-progress-form" onSubmit={handleAddProgress}>
          <select
            value={newProgress.siteId}
            onChange={(e) => setNewProgress({...newProgress, siteId: e.target.value})}
            required
          >
            <option value="">현장 선택</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.contractAmount.toLocaleString()}원)
              </option>
            ))}
          </select>
          <input
            type="date"
            value={newProgress.date}
            onChange={(e) => setNewProgress({...newProgress, date: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="기성금액"
            value={newProgress.amount}
            onChange={(e) => setNewProgress({...newProgress, amount: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="설명"
            value={newProgress.description}
            onChange={(e) => setNewProgress({...newProgress, description: e.target.value})}
          />
          <div className="form-buttons">
            <button type="submit">추가</button>
            <button type="button" onClick={() => setIsAddingProgress(false)}>취소</button>
          </div>
        </form>
      )}

      <div className="progress-list">
        <table>
          <thead>
            <tr>
              <th>현장명</th>
              <th>공사기간</th>
              <th>계약금액</th>
              <th>기성일자</th>
              <th>기성금액</th>
              <th>설명</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {progressList.map(progress => (
              <tr key={progress.id}>
                <td>{progress.siteName}</td>
                <td>{`${progress.startDate} ~ ${progress.endDate}`}</td>
                <td>{Number(progress.contractAmount).toLocaleString()}원</td>
                <td>{progress.date}</td>
                <td>{Number(progress.amount).toLocaleString()}원</td>
                <td>{progress.description}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteProgress(progress.id)}
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

export default ProgressList; 