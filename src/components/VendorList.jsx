import React, { useState, useEffect, useRef } from 'react';
import { subscribeToVendors, addVendor, updateVendor, deleteVendor } from '../services/database';
import * as XLSX from 'xlsx';
import '../styles/VendorList.css';

const TABS = [
  { key: 'constructor', label: '건설업체' },
  { key: 'al', label: 'AL관급업체' },
  { key: 'pl', label: 'PL관급업체' },
];

const INIT_FORM = {
  name: '', contractor: '', contractName: '', amount: '', item: '', quantity: '', remarks: ''
};

export default function VendorList() {
  const [activeTab, setActiveTab] = useState('constructor');
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('constructor');
  const [modalRow, setModalRow] = useState(null); // null: 신규, row: 수정
  const [detailRow, setDetailRow] = useState(null); // 상세보기
  const [sort, setSort] = useState({ col: '', asc: true });
  const fileInputRef = useRef();

  useEffect(() => {
    const unsub = subscribeToVendors(snapshot => {
      setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 정렬
  let sorted = [...vendors].filter(row => row.type === activeTab && Object.values(row).join(' ').toLowerCase().includes(search.toLowerCase()));
  if (sort.col) {
    sorted.sort((a, b) => {
      if (a[sort.col] === b[sort.col]) return 0;
      if (sort.asc) return (a[sort.col] || '').toString().localeCompare((b[sort.col] || '').toString(), 'ko');
      return (b[sort.col] || '').toString().localeCompare((a[sort.col] || '').toString(), 'ko');
    });
  }

  // 모달 열기/닫기
  const openModal = (tab, row) => { setModalTab(tab); setModalRow(row); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setModalRow(null); };

  // 저장(추가/수정)
  const handleSave = async (form) => {
    try {
      if (modalRow) {
        await updateVendor(modalRow.id, { ...form, type: modalTab });
        alert('수정 완료!');
      } else {
        await addVendor({ ...form, type: modalTab });
        alert('등록 완료!');
      }
      closeModal();
    } catch (err) {
      setError('저장 실패: ' + (err.message || ''));
    }
  };
  // 삭제
  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteVendor(id);
      alert('삭제 완료!');
    } catch (err) {
      setError('삭제 실패: ' + (err.message || ''));
    }
  };
  // 엑셀 다운로드
  const handleExcelDownload = () => {
    const data = sorted.map(row => ({
      '업체명': row.name,
      '납품/계약인자': row.contractor,
      '계약건명': row.contractName,
      '금액': row.amount,
      '품목': row.item,
      '물량': row.quantity,
      '비고': row.remarks
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '거래처현황');
    XLSX.writeFile(wb, '거래처현황.xlsx');
  };
  // 엑셀 업로드(실제 데이터 반영)
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      let count = 0;
      for (const row of rows) {
        if (!row['업체명']) continue;
        // 중복 체크(이름+계약건명)
        const exists = vendors.find(v => v.type === activeTab && v.name === row['업체명'] && v.contractName === row['계약건명']);
        if (exists) continue;
        await addVendor({
          type: activeTab,
          name: row['업체명'] || '',
          contractor: row['납품/계약인자'] || '',
          contractName: row['계약건명'] || '',
          amount: row['금액'] || '',
          item: row['품목'] || '',
          quantity: row['물량'] || '',
          remarks: row['비고'] || ''
        });
        count++;
      }
      alert(`엑셀 업로드 완료! (${count}건 추가)`);
      e.target.value = '';
    } catch (err) {
      alert('엑셀 업로드 실패: ' + (err.message || ''));
    }
  };

  return (
    <div className="layout-split">
      <div className="left-panel">
        <div className="vendor-list-container">
          <div className="vendor-list-header">
            <h2>거래처 현황</h2>
            <div className="vendor-tabs">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  className={activeTab === tab.key ? 'active' : ''}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="vendor-header-btns">
              <input
                className="vendor-search"
                placeholder="검색"
                value={search}
                onChange={e=>setSearch(e.target.value)}
              />
              <button onClick={handleExcelDownload}>엑셀 다운로드</button>
              <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{display:'none'}} onChange={handleExcelUpload} />
              <button onClick={()=>fileInputRef.current && fileInputRef.current.click()}>엑셀 업로드</button>
              <button className="vendor-add-btn" onClick={()=>openModal(activeTab, null)}>+ 신규 등록</button>
            </div>
          </div>
          <div className="vendor-list-table-wrap">
            {error && <div className="error-message">{error}</div>}
            {loading ? (
              <div className="loading">로딩 중...</div>
            ) : (
            <table className="vendor-list-table">
              <thead>
                <tr>
                  <th onClick={()=>setSort({col:'name',asc:sort.col==='name'?!sort.asc:true})} style={{cursor:'pointer'}}>업체명</th>
                  <th onClick={()=>setSort({col:'contractor',asc:sort.col==='contractor'?!sort.asc:true})} style={{cursor:'pointer'}}>납품/계약인자</th>
                  <th onClick={()=>setSort({col:'contractName',asc:sort.col==='contractName'?!sort.asc:true})} style={{cursor:'pointer'}}>계약건명</th>
                  <th onClick={()=>setSort({col:'amount',asc:sort.col==='amount'?!sort.asc:true})} style={{cursor:'pointer'}}>금액</th>
                  <th onClick={()=>setSort({col:'item',asc:sort.col==='item'?!sort.asc:true})} style={{cursor:'pointer'}}>품목</th>
                  <th onClick={()=>setSort({col:'quantity',asc:sort.col==='quantity'?!sort.asc:true})} style={{cursor:'pointer'}}>물량</th>
                  <th onClick={()=>setSort({col:'remarks',asc:sort.col==='remarks'?!sort.asc:true})} style={{cursor:'pointer'}}>비고</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={8} style={{color:'#aaa',textAlign:'center'}}>데이터가 없습니다.</td></tr>
                ) : (
                  sorted.map(row => (
                    <tr key={row.id}>
                      <td style={{color:'#3b82f6',cursor:'pointer',fontWeight:600}} onClick={()=>setDetailRow(row)}>{row.name}</td>
                      <td>{row.contractor}</td>
                      <td>{row.contractName}</td>
                      <td>{row.amount}</td>
                      <td>{row.item}</td>
                      <td>{row.quantity}</td>
                      <td>{row.remarks}</td>
                      <td>
                        <button onClick={()=>openModal(activeTab, row)}>수정</button>
                        <button onClick={()=>handleDelete(row.id)}>삭제</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            )}
          </div>
        </div>
      </div>
      <div className="right-panel">
        {modalOpen && (
          <VendorModal
            row={modalRow}
            onSave={handleSave}
            onCancel={closeModal}
          />
        )}
        {detailRow && (
          <VendorDetailModal row={detailRow} onClose={()=>setDetailRow(null)} />
        )}
      </div>
    </div>
  );
}

function VendorModal({ row, onSave, onCancel }) {
  const [form, setForm] = useState(row || INIT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    if (!form.name.trim()) { setError('업체명을 입력하세요.'); setSaving(false); return; }
    await onSave(form);
    setSaving(false);
  };
  return (
    <div className="vendor-modal-bg">
      <div className="vendor-modal">
        <h3>{row ? '거래처 수정' : '신규 거래처 등록'}</h3>
        <form onSubmit={handleSubmit}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="업체명" required />
          <input name="contractor" value={form.contractor} onChange={handleChange} placeholder="납품/계약인자" />
          <input name="contractName" value={form.contractName} onChange={handleChange} placeholder="계약건명" />
          <input name="amount" value={form.amount} onChange={handleChange} placeholder="금액" type="number" />
          <input name="item" value={form.item} onChange={handleChange} placeholder="품목" />
          <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="물량" />
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

function VendorDetailModal({ row, onClose }) {
  return (
    <div className="vendor-modal-bg">
      <div className="vendor-modal">
        <h3>거래처 상세정보</h3>
        <div style={{marginBottom:16}}>
          <div><b>업체명:</b> {row.name}</div>
          <div><b>납품/계약인자:</b> {row.contractor}</div>
          <div><b>계약건명:</b> {row.contractName}</div>
          <div><b>금액:</b> {row.amount}</div>
          <div><b>품목:</b> {row.item}</div>
          <div><b>물량:</b> {row.quantity}</div>
          <div><b>비고:</b> {row.remarks}</div>
        </div>
        <div className="modal-btns">
          <button type="button" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
} 