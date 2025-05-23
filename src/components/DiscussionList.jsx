import React, { useState, useEffect } from 'react';
import { 
  subscribeToSites, 
  subscribeToDiscussions, 
  addDiscussion, 
  updateDiscussion, 
  deleteDiscussion 
} from '../services/database';
import '../styles/DiscussionList.css';

function DiscussionList() {
  const [sites, setSites] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingDiscussion, setIsAddingDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    siteId: '',
    title: '',
    content: '',
    status: '진행중'
  });

  useEffect(() => {
    const unsubscribeSites = subscribeToSites((snapshot) => {
      const sitesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSites(sitesData);
    });

    const unsubscribeDiscussions = subscribeToDiscussions((snapshot) => {
      const discussionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDiscussions(discussionsData);
      setLoading(false);
    });

    return () => {
      unsubscribeSites();
      unsubscribeDiscussions();
    };
  }, []);

  const handleAddDiscussion = async (e) => {
    e.preventDefault();
    try {
      const selectedSite = sites.find(site => site.id === newDiscussion.siteId);
      await addDiscussion({
        ...newDiscussion,
        siteName: selectedSite.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setNewDiscussion({
        siteId: '',
        title: '',
        content: '',
        status: '진행중'
      });
      setIsAddingDiscussion(false);
    } catch (err) {
      setError('협의사항 추가에 실패했습니다.');
    }
  };

  const handleUpdateDiscussion = async (id, data) => {
    try {
      await updateDiscussion(id, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      setError('협의사항 업데이트에 실패했습니다.');
    }
  };

  const handleDeleteDiscussion = async (id) => {
    if (window.confirm('정말로 이 협의사항을 삭제하시겠습니까?')) {
      try {
        await deleteDiscussion(id);
      } catch (err) {
        setError('협의사항 삭제에 실패했습니다.');
      }
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="discussion-list-container">
      <div className="discussion-list-header">
        <h2>협의사항</h2>
        <button 
          className="add-discussion-btn"
          onClick={() => setIsAddingDiscussion(true)}
        >
          협의사항 추가
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isAddingDiscussion && (
        <form className="add-discussion-form" onSubmit={handleAddDiscussion}>
          <select
            value={newDiscussion.siteId}
            onChange={(e) => setNewDiscussion({...newDiscussion, siteId: e.target.value})}
            required
          >
            <option value="">현장 선택</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="제목"
            value={newDiscussion.title}
            onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})}
            required
          />
          <textarea
            placeholder="내용"
            value={newDiscussion.content}
            onChange={(e) => setNewDiscussion({...newDiscussion, content: e.target.value})}
            required
          />
          <select
            value={newDiscussion.status}
            onChange={(e) => setNewDiscussion({...newDiscussion, status: e.target.value})}
          >
            <option value="진행중">진행중</option>
            <option value="완료">완료</option>
            <option value="보류">보류</option>
          </select>
          <div className="form-buttons">
            <button type="submit">추가</button>
            <button type="button" onClick={() => setIsAddingDiscussion(false)}>취소</button>
          </div>
        </form>
      )}

      <div className="discussion-list">
        {discussions.map(discussion => (
          <div key={discussion.id} className="discussion-card">
            <div className="discussion-header">
              <h3>{discussion.title}</h3>
              <span className={`status-badge ${discussion.status}`}>
                {discussion.status}
              </span>
            </div>
            <div className="discussion-info">
              <span className="site-name">{discussion.siteName}</span>
              <span className="date">
                {new Date(discussion.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="discussion-content">{discussion.content}</p>
            <div className="discussion-actions">
              <select
                value={discussion.status}
                onChange={(e) => handleUpdateDiscussion(discussion.id, { status: e.target.value })}
              >
                <option value="진행중">진행중</option>
                <option value="완료">완료</option>
                <option value="보류">보류</option>
              </select>
              <button
                className="delete-btn"
                onClick={() => handleDeleteDiscussion(discussion.id)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DiscussionList; 