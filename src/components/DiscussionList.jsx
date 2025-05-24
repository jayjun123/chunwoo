import React, { useEffect, useState } from 'react';
import { subscribeToDiscussions, addDiscussion, updateDoc, deleteDoc, doc, db, subscribeToSites } from '../services/database';
import { useUser } from './UserContext';
import '../styles/DiscussionList.css';

const STATUS_TYPES = ['진행중', '완료', '보류'];

function DiscussionList() {
  const { userData } = useUser();
  const isAdmin = userData && (userData.role === 'admin' || userData.role === 'master');
  const [discussions, setDiscussions] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsub1 = subscribeToDiscussions(snapshot => {
      setDiscussions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    const unsub2 = subscribeToSites(snapshot => {
      setSites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {unsub1();unsub2();};
  }, []);

  const filteredDiscussions = selectedSite
    ? discussions.filter(d => d.siteId === selectedSite)
    : discussions;

  const handleAdd = async (row) => {
    try {
      await addDiscussion(row);
      setIsAdding(false);
    } catch (err) {
      setError('추가 실패: ' + (err.message || ''));
    }
  };
  const handleStatusChange = async (id, status) => {
    try {
      await updateDoc(doc(db, 'discussions', id), { status });
    } catch (err) {
      setError('상태 변경 실패: ' + (err.message || ''));
    }
  };
  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'discussions', id));
    } catch (err) {
      setError('삭제 실패: ' + (err.message || ''));
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="discussion-list-container">
      <div className="discussion-list-header">
        <h2>협의하기</h2>
        <div>
          <select value={selectedSite} onChange={e=>setSelectedSite(e.target.value)}>
            <option value="">전체 현장</option>
            {sites.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
          {isAdmin && <button className="add-discussion-btn" onClick={()=>setIsAdding(true)}>+ 새 협의</button>}
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {isAdding && isAdmin && (
        <DiscussionEditForm sites={sites} onSave={handleAdd} onCancel={()=>setIsAdding(false)} />
      )}
      <div className="discussion-list">
        {filteredDiscussions.length === 0 && <div>협의 내역이 없습니다.</div>}
        {filteredDiscussions.map(row => (
          <div className="discussion-card" key={row.id}>
            <div className="discussion-header">
              <h3>{sites.find(s=>s.id===row.siteId)?.name||''}</h3>
              <span className={`status-badge ${row.status}`}>{row.status}</span>
            </div>
            <div className="discussion-info">
              <span>작성자: {row.writerName||row.writerEmail}</span>
              <span>{row.createdAt ? new Date(row.createdAt.seconds*1000).toLocaleString() : ''}</span>
            </div>
            <div className="discussion-content">{row.content}</div>
            <div className="discussion-actions">
              {isAdmin && (
                <select value={row.status} onChange={e=>handleStatusChange(row.id, e.target.value)}>
                  {STATUS_TYPES.map(type=>(<option key={type} value={type}>{type}</option>))}
                </select>
              )}
              {isAdmin && <button className="delete-btn" onClick={()=>handleDelete(row.id)}>삭제</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscussionEditForm({ sites, onSave, onCancel }) {
  const { userData } = useUser();
  const [form, setForm] = useState({siteId:'', content:'', status:'진행중'});
  const [saving, setSaving] = useState(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      writerEmail: userData.email,
      writerName: userData.name||'',
      createdAt: new Date(),
    });
    setSaving(false);
  };
  return (
    <form className="add-discussion-form" onSubmit={handleSubmit}>
      <select name="siteId" value={form.siteId} onChange={handleChange} required>
        <option value="">현장 선택</option>
        {sites.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
      </select>
      <textarea name="content" value={form.content} onChange={handleChange} placeholder="협의 내용" required />
      <div className="form-buttons">
        <button type="submit" disabled={saving}>저장</button>
        <button type="button" onClick={onCancel}>취소</button>
      </div>
    </form>
  );
}

export default DiscussionList; 