import React, { useEffect, useState, useRef } from 'react';
import { subscribeToProgress, addProgress, updateProgress, deleteDoc, doc, db, subscribeToSites } from '../services/database';
import { useUser } from './UserContext';
import * as XLSX from 'xlsx';

function ProgressList() {
  const { userData } = useUser();
  const isAdmin = userData && (userData.role === 'admin' || userData.role === 'master');
  const [progressList, setProgressList] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const fileInputRef = useRef();

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

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="container card">
      <h2>기성현황</h2>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {isAdmin && <button onClick={()=>setIsAdding(true)}>+ 새 기성</button>}
        <button onClick={downloadExcel}>엑셀 다운로드</button>
        {isAdmin && <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{display:'none'}} onChange={handleExcelUpload} />}
        {isAdmin && <button onClick={()=>fileInputRef.current && fileInputRef.current.click()}>엑셀 업로드</button>}
      </div>
      {error && <div className="error-message">{error}</div>}
      <table style={{width:'100%',marginTop:8,minWidth:600}}>
        <thead>
          <tr>
            <th>현장명</th>
            <th>기성월</th>
            <th>기성금액</th>
            <th>비고</th>
            {isAdmin && <th>관리</th>}
          </tr>
        </thead>
        <tbody>
          {progressList.map(row => (
            editRow && editRow.id===row.id ? (
              <ProgressEditRow key={row.id} row={editRow} sites={sites} onSave={handleUpdate} onCancel={()=>setEditRow(null)} />
            ) : (
              <tr key={row.id} style={{background:'#232837'}}>
                <td>{sites.find(s=>s.id===row.siteId)?.name||''}</td>
                <td>{row.month}</td>
                <td>{Number(row.amount).toLocaleString()}원</td>
                <td>{row.remarks}</td>
                {isAdmin && <td>
                  <button onClick={()=>setEditRow(row)}>수정</button>
                  <button onClick={()=>handleDelete(row.id)}>삭제</button>
                </td>}
              </tr>
            )
          ))}
        </tbody>
      </table>
      {/* 추가/수정 폼 */}
      {isAdding && isAdmin && (
        <ProgressEditRow row={{siteId:'',month:'',amount:'',remarks:''}} sites={sites} onSave={handleAdd} onCancel={()=>setIsAdding(false)} />
      )}
      <style>{`
        @media (max-width: 700px) {
          table { font-size:0.97em; min-width:480px; }
          th, td { padding: 6px 4px; }
        }
      `}</style>
    </div>
  );
}

function ProgressEditRow({ row, sites, onSave, onCancel }) {
  const [form, setForm] = useState(row);
  const [saving, setSaving] = useState(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); };
  return (
    <tr style={{background:'#181c24'}}>
      <td>
        <select name="siteId" value={form.siteId} onChange={handleChange} required>
          <option value="">현장 선택</option>
          {sites.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
      </td>
      <td><input name="month" type="month" value={form.month} onChange={handleChange} required /></td>
      <td><input name="amount" type="number" value={form.amount} onChange={handleChange} required /></td>
      <td><input name="remarks" value={form.remarks} onChange={handleChange} /></td>
      <td>
        <button onClick={handleSubmit} disabled={saving}>저장</button>
        <button onClick={onCancel}>취소</button>
      </td>
    </tr>
  );
}

export default ProgressList; 