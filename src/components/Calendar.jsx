import React, { useEffect, useState } from 'react';
import { subscribeToSites } from '../services/database';
import * as XLSX from 'xlsx';
import '../styles/Calendar.css';

function Calendar() {
  const [sites, setSites] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSite, setSelectedSite] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToSites(snapshot => {
      setSites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 달력 날짜 계산
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const weeks = [];
  let day = 1 - startDay;
  while (day <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      if (day > 0 && day <= daysInMonth) {
        week.push(day);
      } else {
        week.push(null);
      }
      day++;
    }
    weeks.push(week);
  }

  // 해당 월에 일정이 있는 현장 찾기
  function getSitesForDay(day) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return sites.filter(site => site.startDate <= dateStr && site.endDate >= dateStr);
  }

  // 엑셀 다운로드
  const downloadExcel = () => {
    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const daySites = getSitesForDay(d);
      daySites.forEach(site => {
        data.push({
          '날짜': `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
          '현장명': site.name,
          '상태': site.status,
          '담당자': site.manager,
          '주소': site.address
        });
      });
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '현장일정');
    XLSX.writeFile(wb, `${year}년${month+1}월_현장일정.xlsx`);
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>달력</h2>
        <div className="calendar-controls">
          <button onClick={()=>setCurrentMonth(new Date(year, month-1, 1))}>{'<'}</button>
          <span>{year}년 {month+1}월</span>
          <button onClick={()=>setCurrentMonth(new Date(year, month+1, 1))}>{'>'}</button>
          <button className="export-btn" onClick={downloadExcel}>엑셀 다운로드</button>
        </div>
      </div>
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['일','월','화','수','목','금','토'].map(d=>(<div key={d}>{d}</div>))}
        </div>
        <div className="calendar-days">
          {weeks.flat().map((d,i)=>(
            d ? (
              <div key={i} className={"calendar-day" + (getSitesForDay(d).length ? ' has-progress' : '')} onClick={()=>getSitesForDay(d).length && setSelectedSite(getSitesForDay(d)[0])}>
                <span className="day-number">{d}</span>
                {getSitesForDay(d).map(site=>(
                  <div key={site.id} className="progress-item" style={{background:'#3b82f633',color:'#fff',marginBottom:2,borderRadius:4,padding:'2px 4px',fontSize:'0.95em'}}>{site.name}</div>
                ))}
              </div>
            ) : <div key={i} className="calendar-day empty"></div>
          ))}
        </div>
      </div>
      {selectedSite && (
        <div className="modal" onClick={()=>setSelectedSite(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <h3>{selectedSite.name}</h3>
            <div>공사기간: {selectedSite.startDate} ~ {selectedSite.endDate}</div>
            <div>상태: <span className="status-badge" style={{background:'#3b82f6',color:'#fff'}}>{selectedSite.status}</span></div>
            <div>담당자: {selectedSite.manager}</div>
            <div>주소: {selectedSite.address}</div>
            <div className="form-buttons" style={{marginTop:16}}>
              <button type="button" onClick={()=>setSelectedSite(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar; 
