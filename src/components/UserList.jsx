import React, { useEffect, useState } from 'react';
import { subscribeToUsers, updateUser, batchUpdateUsers, deleteUser, addUser } from '../services/database';
import { useUser } from './UserContext';
import * as XLSX from 'xlsx';
import '../styles/UserList.css';

const ROLE_LABELS = { master: '마스터', admin: '관리자', user: '일반회원', request: '요청' };
const STATUS_LABELS = { 승인: '승인', 요청: '요청', 거절: '거절' };
const MASTER_UID = 'D7Ds97GqbtVzoeSuiWk5Gz6HYtL2';

const ROLE_PERMISSIONS = {
  master: {
    canManageUsers: true,
    canManageRoles: true,
    canDeleteUsers: true,
    canAddUsers: true,
    canEditUsers: true,
    canViewAll: true
  },
  admin: {
    canManageUsers: true,
    canManageRoles: false,
    canDeleteUsers: false,
    canAddUsers: true,
    canEditUsers: true,
    canViewAll: true
  },
  user: {
    canManageUsers: false,
    canManageRoles: false,
    canDeleteUsers: false,
    canAddUsers: false,
    canEditUsers: false,
    canViewAll: false
  }
};

const TABS = [
  { key: 'all', label: '전체회원리스트' },
  { key: 'role', label: '권한별보기' },
];

const ROLE_FILTERS = [
  { key: 'master', label: '마스터' },
  { key: 'admin', label: '관리자' },
  { key: 'user', label: '일반회원' },
  { key: 'request', label: '요청' },
];

const COLUMNS = [
  { key: 'email', label: '이메일', sortable: true },
  { key: 'name', label: '이름', sortable: true },
  { key: 'org', label: '소속', sortable: true },
  { key: 'role', label: '권한', sortable: true },
  { key: 'status', label: '승인상태', sortable: true },
];

function UserDetailModal({ user, onClose, onEdit, onDelete, permissions }) {
  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>회원 상세정보</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <label>이메일</label>
            <span>{user.email}</span>
          </div>
          <div className="detail-row">
            <label>이름</label>
            <span>{user.name}</span>
          </div>
          <div className="detail-row">
            <label>소속</label>
            <span>{user.org}</span>
          </div>
          <div className="detail-row">
            <label>권한</label>
            <select
              value={user.role}
              onChange={e => onEdit(user.id, 'role', e.target.value)}
              disabled={user.id === MASTER_UID || !permissions.canManageRoles}
              className="role-select"
            >
              <option value="master">마스터</option>
              <option value="admin">관리자</option>
              <option value="user">일반회원</option>
              <option value="request">요청</option>
            </select>
          </div>
          <div className="detail-row">
            <label>승인상태</label>
            <select
              value={user.status}
              onChange={e => onEdit(user.id, 'status', e.target.value)}
              disabled={user.id === MASTER_UID || !permissions.canEditUsers}
              className="status-select"
            >
              <option value="승인">승인</option>
              <option value="요청">요청</option>
              <option value="거절">거절</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          {user.id !== MASTER_UID && (
            <button 
              className="delete-button"
              onClick={() => {
                if (window.confirm('정말로 이 회원을 삭제하시겠습니까?')) {
                  onDelete(user.id);
                }
              }}
            >
              회원 삭제
            </button>
          )}
          <button className="close-button" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

function AddUserModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    org: '',
    role: 'user',
    status: '요청'
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.name || !formData.org) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    try {
      await onAdd(formData);
      onClose();
    } catch (err) {
      setError(err.message || '회원 추가에 실패했습니다.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>신규 회원 추가</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label>이메일</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="이메일 주소"
                required
              />
            </div>
            <div className="form-group">
              <label>이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="이름"
                required
              />
            </div>
            <div className="form-group">
              <label>소속</label>
              <input
                type="text"
                value={formData.org}
                onChange={e => setFormData(prev => ({ ...prev, org: e.target.value }))}
                placeholder="소속"
                required
              />
            </div>
            <div className="form-group">
              <label>권한</label>
              <select
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="admin">관리자</option>
                <option value="user">일반회원</option>
              </select>
            </div>
            <div className="form-group">
              <label>승인상태</label>
              <select
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="승인">승인</option>
                <option value="요청">요청</option>
                <option value="거절">거절</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>취소</button>
            <button type="submit" className="submit-button">추가</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserList() {
  const { userData } = useUser();
  const isAdmin = userData && (userData.role === 'admin' || userData.role === 'master');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [roleFilter, setRoleFilter] = useState('master');
  const [edit, setEdit] = useState({});
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const userPermissions = userData ? ROLE_PERMISSIONS[userData.role] : {};

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    const unsubscribe = subscribeToUsers(snapshot => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, [isAdmin]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleEdit = (id, field, value) => {
    if (!userPermissions.canEditUsers) {
      showToast('권한이 없습니다.', 'error');
      return;
    }
    setEdit(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async () => {
    setPending(true);
    setError('');
    try {
      for (const id of Object.keys(edit)) {
        await updateUser(id, edit[id]);
      }
      setEdit({});
      showToast('저장이 완료되었습니다.');
    } catch (err) {
      setError('저장 실패: ' + (err.message || ''));
      showToast('저장에 실패했습니다.', 'error');
    }
    setPending(false);
  };

  const handleExcelDownload = () => {
    const data = users.map(u => ({
      '이메일': u.email,
      '이름': u.name,
      '소속': u.org,
      '권한': ROLE_LABELS[u.role]||u.role,
      '승인상태': u.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '회원명단');
    XLSX.writeFile(wb, '회원명단.xlsx');
    showToast('엑셀 다운로드가 완료되었습니다.');
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
    try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // 데이터 검증 및 변환
          const validatedData = jsonData.map(row => {
            const role = Object.entries(ROLE_LABELS).find(([_, label]) => label === row['권한'])?.[0] || 'user';
            return {
              email: row['이메일'],
              name: row['이름'],
              org: row['소속'],
              role: role,
              status: row['승인상태'] || '요청'
            };
          });

          // 일괄 업데이트
          await batchUpdateUsers(validatedData);
          showToast('엑셀 업로드가 완료되었습니다.');
        } catch (err) {
          showToast('엑셀 데이터 처리 중 오류가 발생했습니다.', 'error');
        }
        setLoading(false);
      };

      reader.onerror = () => {
        showToast('파일 읽기 중 오류가 발생했습니다.', 'error');
        setLoading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      showToast('엑셀 업로드에 실패했습니다.', 'error');
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!userPermissions.canDeleteUsers) {
      showToast('권한이 없습니다.', 'error');
      return;
    }
    try {
      setLoading(true);
      await deleteUser(userId);
      showToast('회원이 삭제되었습니다.');
      setShowModal(false);
    } catch (err) {
      showToast('회원 삭제에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData) => {
    if (!userPermissions.canAddUsers) {
      showToast('권한이 없습니다.', 'error');
      return;
    }
    try {
      setLoading(true);
      await addUser(userData);
      showToast('회원이 추가되었습니다.');
    } catch (err) {
      showToast('회원 추가에 실패했습니다.', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return <div className="container card"><h2>회원관리</h2><div>관리자/마스터만 접근 가능합니다.</div></div>;

  const filtered = tab === 'all'
    ? users.filter(u => 
        (userPermissions.canViewAll || u.id === userData.uid) &&
        (u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.org.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : users.filter(u => u.role === roleFilter && (userPermissions.canViewAll || u.id === userData.uid));

  const sortedData = getSortedData(filtered);

  return (
    <div className="layout-split">
      <div className="left-panel">
        <div className="user-list-container">
          <div className="user-list-header">
            <h2>회원명단</h2>
            <div className="header-controls">
              <div className="tabs">
                {TABS.map(t => (
                  <button key={t.key} className={`tab-button ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>{t.label}</button>
                ))}
                {tab==='role' && (
                  <div className="role-filters">
                    {ROLE_FILTERS.map(r => (
                      <button key={r.key} className={`role-button ${roleFilter===r.key?'active':''}`} onClick={()=>setRoleFilter(r.key)}>{r.label}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="이메일, 이름, 소속 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="action-buttons">
                {tab==='all' && userPermissions.canManageUsers && (
                  <div className="excel-controls">
                    <button className="excel-button" onClick={handleExcelDownload}>엑셀 다운로드</button>
                    <label className="excel-button">
                      엑셀 업로드
                      <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}
                {userPermissions.canAddUsers && (
                  <button className="add-button" onClick={() => setShowAddModal(true)}>
                    + 신규 회원 추가
                  </button>
                )}
              </div>
            </div>
          </div>

      {error && <div className="error-message">{error}</div>}
          
          {loading ? (
            <div className="loading-spinner">로딩중...</div>
          ) : (
            <div className="user-list">
              <table>
        <thead>
          <tr>
                    {COLUMNS.map(column => (
                      <th 
                        key={column.key}
                        onClick={() => column.sortable && handleSort(column.key)}
                        className={column.sortable ? 'sortable' : ''}
                      >
                        {column.label}
                        {sortConfig.key === column.key && (
                          <span className="sort-indicator">
                            {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                          </span>
                        )}
                      </th>
                    ))}
          </tr>
        </thead>
        <tbody>
                  {sortedData.map(u => (
                    <tr 
                      key={u.id} 
                      className={`user-row ${u.role==='master'?'master-row':''} ${selectedUser?.id === u.id ? 'selected' : ''}`}
                      onClick={() => handleRowClick(u)}
                    >
              <td>{u.email}</td>
              <td>{u.name}</td>
              <td>{u.org}</td>
              <td>
                        <select
                          value={edit[u.id]?.role ?? u.role}
                          onChange={e=>handleEdit(u.id, 'role', e.target.value)}
                          disabled={u.id===MASTER_UID || !userPermissions.canManageRoles}
                          className="role-select"
                          onClick={e => e.stopPropagation()}
                        >
                  <option value="master">마스터</option>
                  <option value="admin">관리자</option>
                  <option value="user">일반회원</option>
                          <option value="request">요청</option>
                </select>
              </td>
              <td>
                        <select
                          value={edit[u.id]?.status ?? u.status}
                          onChange={e=>handleEdit(u.id, 'status', e.target.value)}
                          disabled={u.id===MASTER_UID || !userPermissions.canEditUsers}
                          className="status-select"
                          onClick={e => e.stopPropagation()}
                        >
                  <option value="승인">승인</option>
                  <option value="요청">요청</option>
                  <option value="거절">거절</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
            </div>
          )}

          {Object.keys(edit).length > 0 && userPermissions.canEditUsers && (
            <div className="save-controls">
              <button 
                onClick={handleSave} 
                disabled={pending}
                className="save-button"
              >
                {pending ? '저장중...' : '저장'}
              </button>
            </div>
          )}

          {showAddModal && userPermissions.canAddUsers && (
            <AddUserModal
              onClose={() => setShowAddModal(false)}
              onAdd={handleAddUser}
            />
          )}

          {showModal && (
            <UserDetailModal
              user={selectedUser}
              onClose={() => setShowModal(false)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              permissions={userPermissions}
            />
          )}

          {toast.show && (
            <div className={`toast ${toast.type}`}>
              {toast.message}
            </div>
          )}

          <div className="info-text">
        마스터는 항상 1명, 권한/승인 변경 불가. <br />
        승인된 회원만 로그인 가능. <br />
            권한/승인 변경 시 저장버튼을 눌러야 반영됩니다.
          </div>
        </div>
      </div>
      <div className="right-panel">
        {/* 상세/모달 등 추가 UI 필요시 */}
      </div>
    </div>
  );
}

export default UserList; 