import React, { useEffect, useState, useRef } from 'react';
import { subscribeToProgress, addProgress, updateProgress, deleteDoc, doc, db, subscribeToSites } from '../services/database';
import { useUser } from './UserContext';
import * as XLSX from 'xlsx';

export default function ProgressList() {
  const { userData } = useUser();
  const isAdmin = userData && (userData.role === 'admin' || userData.role === 'master');
  const [progressList, setProgressList] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const fileInputRef = useRef();
  const [showAllList, setShowAllList] = useState(false);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRow, setModalRow] = useState(null);

  useEffect(() => {
    const unsub1 = subscribeToProgress(snapshot => {
      setProgressList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    const unsub2 = subscribeToSites(snapshot => {
      setSites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {unsub1();unsub2();};
  }, []);

  const handleAdd = async (row) => {
    try {
      await addProgress(row);
      setIsAdding(false);
    } catch (err) {
      setError('추가 실패: ' + (err.message || ''));
    }
  };
  const handleUpdate = async (row) => {
    try {
      await updateProgress(row.id, row);
      setEditRow(null);
    } catch (err) {
      setError('수정 실패: ' + (err.message || ''));
    }
  };
  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'progress', id));
    } catch (err) {
      setError('삭제 실패: ' + (err.message || ''));
    }
  };

  // 엑셀 다운로드
  const downloadExcel = () => {
    const data = progressList.map(row => ({
      '현장명': sites.find(s=>s.id===row.siteId)?.name || '',
      '기성월': row.month,
      '기성금액': row.amount,
      '비고': row.remarks||''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '기성현황');
    XLSX.writeFile(wb, '기성현황.xlsx');
  };
  // 엑셀 업로드
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      for (const row of rows) {
        const site = sites.find(s=>s.name===row['현장명']);
        if (!site) continue;
        await addProgress({
          siteId: site.id,
          month: row['기성월']||'',
          amount: row['기성금액']||'',
          remarks: row['비고']||''
        });
      }
      alert('엑셀 업로드 완료!');
      fileInputRef.current.value = '';
    } catch (err) {
      setError('엑셀 업로드 실패: ' + (err.message || ''));
    }
  };

  // 필터링
  const filteredProgress = progressList.filter(row => {
    const siteOk = selectedSite ? row.siteId === selectedSite : true;
    const monthOk = selectedMonth ? row.month === selectedMonth : true;
    return siteOk && monthOk;
  });

  // 모달 열기(추가/수정)
  const openModal = (row) => {
    setModalRow(row);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setModalRow(null);
  };

  // 전체리스트 테이블 렌더링
  if (showAllList) {
    return (
      <div className="progress-all-list-container">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <h2>전체 기성 리스트</h2>
          <button onClick={()=>setShowAllList(false)}>돌아가기</button>
        </div>
        <table className="progress-all-list-table">
          <thead>
            <tr>
              <th>현장명</th>
              <th>계약금액</th>
              <th>선급금</th>
              <th>전체기성</th>
              <th>기성월</th>
              <th>기성금액</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {progressList.map(row => {
              const site = sites.find(s=>s.id===row.siteId);
              return (
                <tr key={row.id}>
                  <td>{site?.name||''}</td>
                  <td>{site?.contractAmount ? Number(site.contractAmount).toLocaleString() : ''}</td>
                  <td>{site?.advanceAmount ? Number(site.advanceAmount).toLocaleString() : ''}</td>
                  <td>{site?.totalProgress ? Number(site.totalProgress).toLocaleString() : ''}</td>
                  <td>{row.month}</td>
                  <td>{Number(row.amount).toLocaleString()}</td>
                  <td>{row.remarks}</td>
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
        <div className="progress-list-container">
          <div className="progress-list-header">
            <h2>기성현황</h2>
            <div style={{display:'flex',gap:8}}>
              <select value={selectedSite} onChange={e=>setSelectedSite(e.target.value)}>
                <option value="">전체 현장</option>
                {sites.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
              <input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{height:36}} />
              <button onClick={()=>setShowAllList(true)}>전체리스트</button>
              {isAdmin && <button onClick={()=>openModal(null)}>+ 새 기성</button>}
              <button onClick={downloadExcel}>엑셀 다운로드</button>
              {isAdmin && <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{display:'none'}} onChange={handleExcelUpload} />}
              {isAdmin && <button onClick={()=>fileInputRef.current && fileInputRef.current.click()}>엑셀 업로드</button>}
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="progress-list">
            <table>
              <thead>
                <tr>
                  <th>현장명</th>
                  <th>계약금액</th>
                  <th>선급금</th>
                  <th>전체기성</th>
                  <th>기성월</th>
                  <th>기성금액</th>
                  <th>비고</th>
                  {isAdmin && <th>관리</th>}
                </tr>
              </thead>
              <tbody>
                {filteredProgress.map(row => {
                  const site = sites.find(s=>s.id===row.siteId);
                  return (
                    <tr key={row.id} style={{background:'#232837'}}>
                      <td>{site?.name||''}</td>
                      <td>{site?.contractAmount ? Number(site.contractAmount).toLocaleString() : ''}</td>
                      <td>{site?.advanceAmount ? Number(site.advanceAmount).toLocaleString() : ''}</td>
                      <td>{site?.totalProgress ? Number(site.totalProgress).toLocaleString() : ''}</td>
                      <td>{row.month}</td>
                      <td>{Number(row.amount).toLocaleString()}</td>
                      <td>{row.remarks}</td>
                      {isAdmin && <td>
                        <button onClick={()=>openModal(row)}>수정</button>
                        <button onClick={()=>handleDelete(row.id)}>삭제</button>
                      </td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="right-panel">
        {/* 입력/수정 모달 */}
        {modalOpen && (
          <ProgressModal
            row={modalRow}
            sites={sites}
            onSave={async (form) => {
              if (modalRow) await handleUpdate(form);
              else await handleAdd(form);
              closeModal();
            }}
            onCancel={closeModal}
          />
        )}
      </div>
      <style>{`
        @media (max-width: 700px) {
          table { font-size:0.97em; min-width:480px; }
          th, td { padding: 6px 4px; }
        }
      `}</style>
    </div>
  );
}

// 입력/수정 모달 컴포넌트
function ProgressModal({ row, sites, onSave, onCancel }) {
  const [form, setForm] = useState(row || {siteId:'',month:'',amount:'',remarks:''});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, id: row?.id });
    } catch (err) {
      setError('저장 실패: ' + (err.message || ''));
    }
    setSaving(false);
  };
  return (
    <div className="progress-modal-bg">
      <div className="progress-modal">
        <h3>{row ? '기성 수정' : '새 기성 등록'}</h3>
        <form onSubmit={handleSubmit}>
          <select name="siteId" value={form.siteId} onChange={handleChange} required>
            <option value="">현장 선택</option>
            {sites.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
          <input name="month" type="month" value={form.month} onChange={handleChange} required />
          <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="기성금액" required />
          <input name="remarks" value={form.remarks} onChange={handleChange} placeholder="비고" />
          {error && <div className="error-message">{error}</div>}
          <div className="modal-btns">
            <button type="submit" disabled={saving}>{row ? '수정' : '등록'}</button>
            <button type="button" onClick={onCancel}>취소</button>
          </div>
        </form>
      </div>
    </div>
  );
} 