import React, { useEffect, useState } from 'react';

const NEWS_API = 'https://api.odcloud.kr/api/15040861/v1/uddi:5c4c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c?page=1&perPage=100';
const GLASS_KEYWORDS = ['유리', '창호', '커튼월', '윈도우', 'window', 'glass'];

function filterGlassNews(news) {
  return news.filter(item =>
    GLASS_KEYWORDS.some(keyword =>
      (item.title || '').includes(keyword) || (item.content || '').includes(keyword)
    )
  );
}

export default function NewsList() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    fetch(NEWS_API)
      .then(res => res.json())
      .then(data => {
        let allNews = data.data || [];
        const glassNews = filterGlassNews(allNews);
        const otherNews = allNews.filter(item => !glassNews.includes(item));
        let selected = [];
        if (glassNews.length > 0) {
          selected = [
            ...glassNews.slice(0, 3),
            ...otherNews.slice(0, 5 - Math.min(3, glassNews.length))
          ];
        } else {
          selected = allNews.slice(0, 5);
        }
        setNews(selected);
        setLoading(false);
      })
      .catch(() => {
        setError('뉴스를 불러오는데 실패했습니다.');
        setLoading(false);
      });
  }, []);

  const handlePopupClose = () => setPopup(null);
  const handleOverlayClick = e => {
    if (e.target.className === 'news-popup-overlay') handlePopupClose();
  };

  return (
    <div className="news-list-main">
      <h2 className="news-title">건설NEWS</h2>
      {loading && <div className="news-loading">로딩 중...</div>}
      {error && <div className="news-error">{error}</div>}
      <ul className="news-headline-list">
        {news.map((item, idx) => (
          <li key={idx} className="news-headline-item">
            <button className="news-headline-btn" onClick={() => setPopup(item)}>
              {item.title}
            </button>
          </li>
        ))}
      </ul>
      {popup && (
        <div className="news-popup-overlay" onClick={handleOverlayClick}>
          <div className="news-popup">
            <button className="news-popup-close" onClick={handlePopupClose}>×</button>
            <h3>{popup.title}</h3>
            <div className="news-popup-content">{popup.content || popup.summary || '기사 내용 없음'}</div>
            {popup.url && <a href={popup.url} target="_blank" rel="noopener noreferrer" className="news-popup-link">원문 보기</a>}
          </div>
        </div>
      )}
      <style>{`
        .news-list-main { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; padding: 32px 24px; max-width: 700px; margin: 40px auto; }
        .news-title { color: #3b82f6; margin-bottom: 18px; font-size: 1.5em; font-weight: 700; }
        .news-headline-list { list-style: none; padding: 0; margin: 0; }
        .news-headline-item { margin-bottom: 14px; }
        .news-headline-btn { background: none; border: none; color: #232837; font-size: 1.08em; font-weight: 600; cursor: pointer; text-align: left; padding: 0; transition: color 0.2s; }
        .news-headline-btn:hover { color: #3b82f6; text-decoration: underline; }
        .news-loading, .news-error { color: #ef4444; margin: 18px 0; }
        .news-popup-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.45); z-index: 2000; display: flex; align-items: center; justify-content: center; }
        .news-popup { background: #fff; border-radius: 12px; max-width: 480px; width: 90vw; padding: 32px 24px 24px 24px; box-shadow: 0 4px 24px #0003; position: relative; }
        .news-popup-close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5em; color: #64748b; cursor: pointer; }
        .news-popup-content { margin: 18px 0 8px 0; color: #232837; font-size: 1.08em; }
        .news-popup-link { color: #3b82f6; text-decoration: underline; font-size: 0.98em; }
        @media (max-width: 700px) { .news-list-main { padding: 16px 4px; } .news-popup { padding: 18px 8px; } }
      `}</style>
    </div>
  );
} 