import React, { useEffect, useState } from 'react';
import { subscribeToDiscussions, addDiscussion, updateDoc, deleteDoc, doc, db, subscribeToSites, updateDiscussion, uploadDiscussionImage } from '../services/database';
import { useUser } from './UserContext';
import '../styles/DiscussionList.css';

const STATUS_TYPES = ['진행중', '완료', '보류'];

export default function DiscussionList() {
  const { userData } = useUser();
  const isAdmin = userData && (userData.role === 'admin' || userData.role === 'master');
  const [discussions, setDiscussions] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAllList, setShowAllList] = useState(false);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const chatListRef = React.useRef();
  const [editId, setEditId] = useState(null);

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

  // 입력창 활성화 조건
  const canWrite = !!selectedSite && userData && (userData.role === 'admin' || userData.role === 'master' || userData.role === 'user');

  // 메시지 전송/수정
  const handleSend = async () => {
    if (!input.trim()) return;
    let imageUrl = null;
    if (file) {
      imageUrl = await uploadDiscussionImage(file, userData.email);
    }
    if (editId) {
      await updateDiscussion(editId, {
        content: input,
        ...(imageUrl ? { imageUrl } : {}),
      });
      setEditId(null);
    } else {
      await handleAdd({
        siteId: selectedSite,
        content: input,
        status: '진행중',
        ...(imageUrl ? { imageUrl } : {}),
      });
    }
    setInput("");
    setFile(null);
    setFilePreview(null);
    setEditId(null);
    setTimeout(() => {
      if (chatListRef.current) chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }, 100);
  };

  // 엔터로 전송
  const handleInputKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 파일 첨부
  const handleFileChange = e => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFilePreview(URL.createObjectURL(f));
    } else {
      setFile(null);
      setFilePreview(null);
    }
  };

  // 삭제 권한
  const canDelete = (row) => isAdmin || (userData && (row.writerEmail === userData.email));

  // 수정 버튼 클릭
  const handleEdit = (row) => {
    setEditId(row.id);
    setInput(row.content);
    setFilePreview(row.imageUrl || null);
    setFile(null);
  };
  // 수정 취소
  const handleEditCancel = () => {
    setEditId(null);
    setInput("");
    setFile(null);
    setFilePreview(null);
  };

  if (showAllList) {
    return (
      <div className="discussion-all-list-container">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <h2>협의 전체리스트</h2>
          <button onClick={()=>setShowAllList(false)}>돌아가기</button>
        </div>
        <table className="discussion-all-list-table">
          <thead>
            <tr>
              <th>현장명</th>
              <th>글 수</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {sites.map(site => {
              const count = discussions.filter(d => d.siteId === site.id).length;
              return (
                <tr key={site.id}>
                  <td>{site.name}</td>
                  <td>{count}</td>
                  <td>{site.remarks || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="layout-split">
      <div className="left-panel">
        <div className="discussion-site-list">
          {sites.map(site => (
            <div
              key={site.id}
              className={`discussion-site-item${selectedSite === site.id ? ' selected' : ''}`}
              onClick={() => setSelectedSite(site.id)}
            >
              <div style={{fontWeight:700}}>{site.name}</div>
              <div style={{fontSize:'0.95em', color:'#b3b8c5'}}>글 수: {discussions.filter(d=>d.siteId===site.id).length}</div>
              <div style={{fontSize:'0.92em', color:'#888'}}>비고: {site.remarks||''}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="right-panel">
        <div className="discussion-list-container">
          <div className="discussion-list-header">
            <h2>협의하기</h2>
            <button onClick={()=>setShowAllList(true)} style={{marginLeft:8}}>전체리스트</button>
          </div>
          {error && <div className="error-message">{error}</div>}
          {isAdding && isAdmin && (
            <DiscussionEditForm sites={sites} onSave={handleAdd} onCancel={()=>setIsAdding(false)} />
          )}
          <div className="discussion-chat-list" ref={chatListRef}>
            {filteredDiscussions.length === 0 && <div>협의 내역이 없습니다.</div>}
            {filteredDiscussions.map(row => (
              <div className="discussion-chat-item" key={row.id}>
                <div className="chat-meta">
                  <span className="chat-writer">{row.writerName||row.writerEmail}</span>
                  <span className="chat-time">{row.createdAt ? new Date(row.createdAt.seconds*1000).toLocaleString() : ''}</span>
                  <span className={`status-badge ${row.status}`}>{row.status}</span>
                </div>
                {row.imageUrl && <img src={row.imageUrl} alt="첨부이미지" className="chat-image" />}
                <div className="chat-content">{row.content}</div>
                <div className="chat-actions">
                  {isAdmin && (
                    <select value={row.status} onChange={e=>handleStatusChange(row.id, e.target.value)}>
                      {STATUS_TYPES.map(type=>(<option key={type} value={type}>{type}</option>))}
                    </select>
                  )}
                  {canDelete(row) && <>
                    <button className="delete-btn" onClick={()=>handleDelete(row.id)}>삭제</button>
                    <button className="chat-edit-btn" onClick={()=>handleEdit(row)}>수정</button>
                  </>}
                </div>
              </div>
            ))}
          </div>
          <div className="discussion-chat-input-box">
            <input
              type="text"
              className="chat-input"
              placeholder="메시지를 입력하세요"
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={!canWrite}
            />
            <label className="chat-file-label">
              <input
                type="file"
                className="chat-file-input"
                style={{display:'none'}}
                onChange={handleFileChange}
                disabled={!canWrite}
                accept="image/*"
              />
              <span role="img" aria-label="파일첨부">📎</span>
            </label>
            <button className="chat-send-btn" onClick={handleSend} disabled={!canWrite || !input.trim()}>{editId ? '수정' : '전송'}</button>
            {editId && <button className="chat-cancel-btn" onClick={handleEditCancel}>취소</button>}
          </div>
          {filePreview && (
            <div style={{marginTop:8}}>
              <img src={filePreview} alt="미리보기" className="chat-image" />
              <button className="delete-btn" style={{marginLeft:8}} onClick={()=>{setFile(null);setFilePreview(null);}}>첨부취소</button>
            </div>
          )}
        </div>
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