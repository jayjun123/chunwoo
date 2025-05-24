import React, { useState } from 'react';

function SiteForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    contractAmount: '',
    status: '진행중',
    manager: '',
    address: ''
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onAdd(form);
    setForm({
      name: '',
      startDate: '',
      endDate: '',
      contractAmount: '',
      status: '진행중',
      manager: '',
      address: ''
    });
  };

  return (
    <form className="add-site-form" onSubmit={handleSubmit}>
      <input name="name" type="text" placeholder="현장명" value={form.name} onChange={handleChange} required />
      <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
      <input name="endDate" type="date" value={form.endDate} onChange={handleChange} required />
      <input name="contractAmount" type="number" placeholder="계약금액" value={form.contractAmount} onChange={handleChange} required />
      <input name="manager" type="text" placeholder="담당자" value={form.manager} onChange={handleChange} />
      <input name="address" type="text" placeholder="주소" value={form.address} onChange={handleChange} />
      <select name="status" value={form.status} onChange={handleChange}>
        <option value="진행중">진행중</option>
        <option value="보류">보류</option>
        <option value="예정">예정</option>
        <option value="완료">완료</option>
      </select>
      <div className="form-buttons">
        <button type="submit">추가</button>
        <button type="button" onClick={onCancel}>취소</button>
      </div>
    </form>
  );
}

export default SiteForm; 