import React from 'react';
import * as XLSX from 'xlsx';

const STATUS_COLORS = {
  '진행중': '#3b82f6',
  '예정': '#eab308',
  '완료': '#22c55e',
  '보류': '#ef4444',
};

function SiteTable({ sites, onUpdateStatus, onDelete, onSelectSite }) {
  // 엑셀 다운로드 함수
  const downloadExcel = () => {
    const data = sites.map(site => ({
      '현장명': site.name,
      '공사기간': `${site.startDate} ~ ${site.endDate}`,
      '계약금액': site.contractAmount,
      '상태': site.status,
      '담당자': site.manager || '',
      '주소': site.address || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "현장리스트");
    XLSX.writeFile(wb, "현장리스트.xlsx");
  };

  return (
    <div className="site-list" style={{overflowX:'auto'}}>
      <button onClick={downloadExcel} style={{marginBottom: 10}}>엑셀 다운로드</button>
      <table style={{minWidth:600, width:'100%'}}>
        <thead>
          <tr>
            <th>현장명</th>
            <th>공사기간</th>
            <th>계약금액</th>
            <th>상태</th>
            <th>담당자</th>
            <th>주소</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {sites.map(site => (
            <tr key={site.id} style={{cursor:'pointer', background: STATUS_COLORS[site.status] + '22'}} onClick={() => onSelectSite && onSelectSite(site)}>
              <td style={{fontWeight:700, color: STATUS_COLORS[site.status]}}>
                {site.name.length > 7 ? site.name.slice(0,7) + '...' : site.name}
              </td>
              <td>{`${site.startDate} ~ ${site.endDate}`}</td>
              <td>{Number(site.contractAmount).toLocaleString()}원</td>
              <td>
                <span style={{background: STATUS_COLORS[site.status], color:'#fff', borderRadius:8, padding:'2px 10px', fontWeight:600, fontSize:'0.98em'}}>{site.status}</span>
                <select
                  value={site.status}
                  onChange={e => onUpdateStatus(site.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{marginLeft:8, borderRadius:6, padding:'2px 8px'}}
                >
                  <option value="진행중">진행중</option>
                  <option value="보류">보류</option>
                  <option value="예정">예정</option>
                  <option value="완료">완료</option>
                </select>
              </td>
              <td>{site.manager}</td>
              <td>{site.address}</td>
              <td>
                <button className="delete-btn" onClick={e => {e.stopPropagation(); onDelete(site.id);}}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 반응형: 모바일에서 테이블 가로 스크롤 */}
      <style>{`
        @media (max-width: 700px) {
          .site-list table { font-size:0.97em; min-width:480px; }
          .site-list th, .site-list td { padding: 6px 4px; }
        }
      `}</style>
    </div>
  );
}

export default SiteTable; 