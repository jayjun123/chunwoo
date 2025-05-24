import React, { useState, useEffect } from 'react';
import { 
  subscribeToSites, 
  subscribeToProgress, 
  addProgress, 
  updateProgress, 
  deleteProgress 
} from '../services/database';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import * as XLSX from 'xlsx';
import '../styles/Calendar.css';

function Calendar() {
  const [sites, setSites] = useState([]);
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [newProgress, setNewProgress] = useState({
    siteId: '',
    date: '',
    amount: '',
    description: ''
  });
  const [siteOrder, setSiteOrder] = useState([]);
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');

  // 월 선택 옵션 생성
  const generateMonthOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        const value = `${year}-${month.toString().padStart(2, '0')}`;
        const label = `${year}년 ${month}월`;
        options.push({ value, label });
      }
    }
    return options;
  };

  useEffect(() => {
    const unsubscribeSites = subscribeToSites((snapshot) => {
      const sitesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // 공사기간이 있는 현장만 완전히 필터링
      const validSites = sitesData.filter(site => 
        site.startDate && site.endDate && new Date(site.startDate) <= new Date(site.endDate)
      );
      setSites(validSites);
      setSiteOrder(validSites.map(site => site.id));
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

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setIsAddingProgress(true);
  };

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

  const handleDeleteProgress = async (id) => {
    if (window.confirm('정말로 이 기성현황을 삭제하시겠습니까?')) {
      try {
        await deleteProgress(id);
      } catch (err) {
        setError('기성현황 삭제에 실패했습니다.');
      }
    }
  };

  const handleExportSiteList = () => {
    if (!startMonth || !endMonth) {
      setError('기간을 선택해주세요.');
      return;
    }
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    const [endYear, endMonthNum] = endMonth.split('-').map(Number);
    const startDate = new Date(startYear, startMonthNum - 1, 1);
    const endDate = new Date(endYear, endMonthNum, 0);
    const orderedSites = siteOrder
      .map(id => sites.find(site => site.id === id))
      .filter(site => site && isSiteInDateRange(site, startDate, endDate));
    const data = orderedSites.map(site => {
      const status = getStatusBadge(site);
      return {
        '현장명': site.name,
        '상태': status.text,
        '계약금액': site.contractAmount,
        '공사기간': `${site.startDate} ~ ${site.endDate}`
      };
    });
    // CSV 변환
    const header = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [header, ...rows].join('\r\n');
    // BOM 추가
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `현장목록_${startYear}년${startMonthNum}월_${endYear}년${endMonthNum}월.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isSiteInDateRange = (site, startDate, endDate) => {
    const siteStartDate = new Date(site.startDate);
    const siteEndDate = new Date(site.endDate);
    
    return (
      (siteStartDate <= endDate && siteEndDate >= startDate) ||
      (siteStartDate >= startDate && siteStartDate <= endDate) ||
      (siteEndDate >= startDate && siteEndDate <= endDate)
    );
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(siteOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSiteOrder(items);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayProgress = progressList.filter(progress => progress.date === date.toISOString().split('T')[0]);
      
      days.push(
        <div 
          key={day} 
          className={`calendar-day ${dayProgress.length > 0 ? 'has-progress' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          <span className="day-number">{day}</span>
          {dayProgress.map(progress => (
            <div key={progress.id} className="progress-item">
              {progress.siteName} - {progress.amount}원
            </div>
          ))}
        </div>
      );
    }

    return days;
  };

  const getFilteredSites = () => {
    return siteOrder
      .map(id => sites.find(site => site.id === id))
      .filter(site => {
        // 공사기간이 있는 현장만
        if (!site || !site.startDate || !site.endDate) return false;
        const startDate = new Date(site.startDate);
        const endDate = new Date(site.endDate);
        if (startDate > endDate) return false;
        return isSiteInCurrentMonth(site);
      });
  };

  const isSiteInCurrentMonth = (site) => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return isSiteInDateRange(site, startDate, endDate);
  };

  const getStatusBadge = (site) => {
    const today = new Date();
    const startDate = new Date(site.startDate);
    const endDate = new Date(site.endDate);

    if (today > endDate) return { text: '완료', class: 'completed' };
    if (today < startDate) return { text: '예정', class: 'scheduled' };
    if (site.status === '보류') return { text: '보류', class: 'pending' };
    return { text: '진행중', class: 'in-progress' };
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>공사현황 달력</h2>
        <div className="calendar-controls">
          <button onClick={handlePrevMonth}>이전 달</button>
          <span>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</span>
          <button onClick={handleNextMonth}>다음 달</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          <div>일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div>토</div>
        </div>
        <div className="calendar-days">
          {renderCalendar()}
        </div>
      </div>

      <div className="site-list-container">
        <h3>현장 목록</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sites">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="site-list"
              >
                {getFilteredSites().map((site, index) => {
                  const status = getStatusBadge(site);
                  return (
                    <Draggable key={site.id} draggableId={site.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`site-item ${status.class}`}
                        >
                          <span className="status-badge">{status.text}</span>
                          <span className="site-name">
                            {site.name.length > 7 ? site.name.substring(0, 7) + '...' : site.name}
                          </span>
                          <div className="site-period" style={{ fontSize: '0.9em', color: 'var(--text-sub)', marginLeft: '8px' }}>
                            {site.startDate && site.endDate ? `공사기간: ${site.startDate} ~ ${site.endDate}` : ''}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="export-container">
        <div className="date-range-selector">
          <select 
            value={startMonth} 
            onChange={(e) => setStartMonth(e.target.value)}
            className="month-select"
          >
            <option value="">시작 월 선택</option>
            {generateMonthOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span>~</span>
          <select 
            value={endMonth} 
            onChange={(e) => setEndMonth(e.target.value)}
            className="month-select"
          >
            <option value="">종료 월 선택</option>
            {generateMonthOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button onClick={handleExportSiteList} className="export-btn">
            엑셀 다운로드
          </button>
        </div>
      </div>

      {isAddingProgress && (
        <div className="modal">
          <div className="modal-content">
            <h3>기성현황 추가</h3>
            {/* 선택된 현장 정보 표시 */}
            {newProgress.siteId && (() => {
              const selectedSite = sites.find(site => site.id === newProgress.siteId);
              if (!selectedSite) return null;
              return (
                <div className="site-detail-info" style={{marginBottom: '12px', color: 'var(--text-main)'}}>
                  <div><b>시공팀:</b> {selectedSite.team || '-'}</div>
                  <div><b>공사기간:</b> {selectedSite.startDate} ~ {selectedSite.endDate}</div>
                </div>
              );
            })()}
            <form onSubmit={handleAddProgress}>
              <select
                value={newProgress.siteId}
                onChange={(e) => setNewProgress({...newProgress, siteId: e.target.value})}
                required
              >
                <option value="">현장 선택</option>
                {/* 공사기간이 있는 현장만 드롭다운에 노출 */}
                {sites.filter(site => site.startDate && site.endDate && new Date(site.startDate) <= new Date(site.endDate)).map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
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
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar; 
