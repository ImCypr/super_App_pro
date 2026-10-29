import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';
import { departmentService } from '../../services/departmentService';
import { Department } from '../../models';
import { useAuth } from '../../context/AuthContext';

export const DepartmentManagementPage: React.FC = () => {
  const { user } = useAuth();
  // Quyền thao tác khớp với backend: Admin & Chủ tịch toàn quyền, Giám đốc được thêm/sửa
  const canEdit = ['admin', 'giam_doc', 'chu_tich'].includes(user?.role || '');
  const canDelete = ['admin', 'chu_tich'].includes(user?.role || '');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal create/edit
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi khi tải phòng ban' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenCreate = () => {
    setEditingDept(null);
    setDeptForm({ name: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({ name: dept.name, description: dept.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) {
      showToast('error', 'Tên phòng ban không được để trống');
      return;
    }

    setActionLoading(true);
    const payload = { name: deptForm.name.trim(), description: deptForm.description.trim() };
    try {
      if (editingDept) {
        await departmentService.update(editingDept._id, payload);
        showToast('success', 'Đã cập nhật phòng ban');
      } else {
        await departmentService.create(payload);
        showToast('success', 'Đã tạo phòng ban');
      }
      setShowModal(false);
      loadDepartments();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi khi lưu phòng ban');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Xóa phòng ban "${name}"?`)) return;
    try {
      await departmentService.delete(id);
      showToast('success', `Đã xóa phòng ban "${name}"`);
      loadDepartments();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi khi xóa phòng ban');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2.5rem' }}>
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: notification.type === 'success' ? '#064e3b' : '#7f1d1d',
            color: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            border: `1px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`,
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.75rem 2rem',
          backgroundColor: 'var(--surface-color)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            <Building2 size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Quản Lý Phòng Ban
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
              {departments.length} phòng ban
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} />
            <span>Thêm Phòng Ban</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: 'var(--surface-color)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Tên Phòng Ban
              </th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Mô Tả
              </th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Trạng Thái
              </th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>
                Hành Động
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chưa có phòng ban nào
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={16} color="#3b82f6" />
                      <span>{dept.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {dept.description || '—'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Hoạt động</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      {canEdit && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleOpenEdit(dept)}
                          title="Sửa"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(dept._id, dept.name)}
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal create/edit */}
      {showModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '460px',
              width: '90%',
              backgroundColor: 'var(--surface-color)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {editingDept ? 'Sửa Phòng Ban' : 'Thêm Phòng Ban'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Tên Phòng Ban *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Phòng Kế Toán"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Mô Tả</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Không bắt buộc"
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
