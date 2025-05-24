import React from 'react';
import { deleteAllExampleData } from '../services/database';

function DeleteExampleData() {
  const handleDelete = async () => {
    if (window.confirm('정말로 모든 예시 데이터를 삭제하시겠습니까?')) {
      try {
        await deleteAllExampleData();
        alert('모든 예시 데이터가 삭제되었습니다.');
      } catch (error) {
        alert('데이터 삭제 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      style={{
        background: '#ef4444',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer'
      }}
    >
      예시 데이터 삭제
    </button>
  );
}

export default DeleteExampleData; 