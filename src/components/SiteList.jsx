import React, { useState, useEffect, useRef } from 'react';
import { subscribeToSites, addSite, updateSite, deleteSite } from '../services/database';
import SiteForm from './SiteForm';
import SiteTable from './SiteTable';
import { useUser } from './UserContext';
import * as XLSX from 'xlsx';
import '../styles/SiteList.css';

// SiteDetail 컴포넌트(간단 버전, 파일 분리 가능)
function SiteDetail({ site, onSave, onCancel, canEdit }) {
  const [form, setForm] = useState(site);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(site); }, [site]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };
  if (!site) return null;
  return (
    <form className="site-detail-form" onSubmit={handleSubmit} style={{margin:'24px 0', background:'#232837', borderRadius:12, padding:24}}>
      <h3>현장 세부내역</h3>
      <input name="name" value={form.name} onChange={handleChange} placeholder="현장명" required maxLength={20} readOnly={!canEdit} />
      <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required readOnly={!canEdit} />
      <input name="endDate" type="date" value={form.endDate} onChange={handleChange} required readOnly={!canEdit} />
      <input name="contractAmount" type="number" value={form.contractAmount} onChange={handleChange} placeholder="계약금액" required readOnly={!canEdit} />
      <input name="manager" value={form.manager} onChange={handleChange} placeholder="담당자" readOnly={!canEdit} />
      <input name="address" value={form.address} onChange={handleChange} placeholder="주소" readOnly={!canEdit} />
      <select name="status" value={form.status} onChange={handleChange} disabled={!canEdit}>
        <option value="진행중">진행중</option>
        <option value="보류">보류</option>
        <option value="예정">예정</option>
        <option value="완료">완료</option>
      </select>
      <div className="form-buttons">
        {canEdit && <button type="submit" disabled={saving}>저장</button>}
        <button type="button" onClick={onCancel}>닫기</button>
      </div>
    </form>
  );
}

const STATUS_TYPES = ['전체', '진행중', '예정', '완료', '보류'];

function SiteList() {
  const { userData } = useUser();
  const isAdmin = userData && (userData.role === 'admin' || userData.role === 'master');
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [selectedSite, setSelectedSite] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    const unsubscribe = subscribeToSites((snapshot) => {
      const sitesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSites(sitesData);
      setLoading(false);
      // 상세화면에서 삭제/수정 후 리스트 갱신
      if (selectedSite) {
        const found = sitesData.find(s => s.id === selectedSite.id);
        if (!found) setSelectedSite(null);
        else setSelectedSite(found);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, []);

  const handleAddSite = async (site) => {
    try {
      await addSite(site);
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
    if (!isAdmin) return;
    if (window.confirm('정말로 이 현장을 삭제하시겠습니까?')) {
      try {
        await deleteSite(id);
        setSelectedSite(null);
      } catch (err) {
        setError('현장 삭제에 실패했습니다.');
      }
    }
  };

  const handleSaveDetail = async (form) => {
    try {
      await updateSite(form.id, form);
      setSelectedSite(null);
    } catch (err) {
      setError('수정에 실패했습니다.');
    }
  };

  // 엑셀 업로드 핸들러
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      for (const row of rows) {
        // 컬럼명: 현장명, 공사기간, 계약금액, 상태, 담당자, 주소
        const [startDate, endDate] = (row['공사기간']||'').split('~').map(s=>s.trim());
        await addSite({
          name: row['현장명'] || '',
          startDate: startDate || '',
          endDate: endDate || '',
          contractAmount: row['계약금액'] || '',
          status: row['상태'] || '진행중',
          manager: row['담당자'] || '',
          address: row['주소'] || ''
        });
      }
      alert('엑셀 업로드 완료!');
      fileInputRef.current.value = '';
    } catch (err) {
      setError('엑셀 업로드 실패: ' + (err.message || ''));
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  // 상태별 필터링
  const filteredSites = selectedStatus === '전체'
    ? sites
    : sites.filter(site => site.status === selectedStatus);

  return (
    <div className="site-list-container">
      <div className="site-list-header">
        <h2>전체현장리스트</h2>
        <div style={{display:'flex',gap:8}}>
          {isAdmin && <button className="add-site-btn" onClick={() => setIsAddingSite(true)}>현장 추가</button>}
          {isAdmin && <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{display:'none'}} onChange={handleExcelUpload} />}
          {isAdmin && <button className="add-site-btn" onClick={()=>fileInputRef.current && fileInputRef.current.click()}>엑셀 업로드</button>}
        </div>
      </div>
      {/* 상태별 탭 UI */}
      <div className="status-tabs" style={{marginBottom: 16}}>
        {STATUS_TYPES.map(type => (
          <button
            key={type}
            className={selectedStatus === type ? 'active' : ''}
            onClick={() => setSelectedStatus(type)}
            style={{
              background: selectedStatus === type ? 'var(--primary)' : 'var(--bg-card)',
              color: selectedStatus === type ? '#fff' : 'var(--text-sub)',
              border: 'none',
              borderRadius: 18,
              padding: '6px 18px',
              fontWeight: 700,
              marginRight: 8,
              cursor: 'pointer',
              boxShadow: selectedStatus === type ? '0 4px 16px #3b82f655' : 'none'
            }}
          >
            {type}
          </button>
        ))}
      </div>
      {error && <div className="error-message">{error}</div>}
      {isAddingSite && isAdmin && (
        <SiteForm
          onAdd={handleAddSite}
          onCancel={() => setIsAddingSite(false)}
        />
      )}
      <SiteTable
        sites={filteredSites}
        onUpdateStatus={isAdmin ? handleUpdateStatus : undefined}
        onDelete={isAdmin ? handleDeleteSite : undefined}
        onSelectSite={site => setSelectedSite(site)}
        canEdit={isAdmin}
      />
      {/* 세부내역(수정/상세) 폼 */}
      {selectedSite && (
        <SiteDetail
          site={selectedSite}
          onSave={handleSaveDetail}
          onCancel={() => setSelectedSite(null)}
          canEdit={isAdmin}
        />
      )}
    </div>
  );
}

export default SiteList; 