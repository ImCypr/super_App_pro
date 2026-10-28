import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import { getRoleBadgeClass, getRoleLabel } from '../utils/formatters';
import { LogOut, Building2, KeyRound, X, Eye, EyeOff } from 'lucide-react';
import { TagLogo } from './TagLogo';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const [showPwModal, setShowPwModal] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const closePwModal = () => {
    setShowPwModal(false);
    setShowPw(false);
    setPwMsg(null);
    setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Mật khẩu mới phải từ 6 ký tự trở lên' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    setPwLoading(true);
    try {
      await authService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ type: 'success', text: 'Đổi mật khẩu thành công' });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Không thể đổi mật khẩu' });
    } finally {
      setPwLoading(false);
    }
  };

  const userRoles = user ? ((user.roles && user.roles.length > 0) ? user.roles : [user.role]) : [];

  const deptName =
    typeof user?.department === 'object' && user.department !== null
      ? user.department.name
      : 'Công ty';

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <TagLogo
        size={38}
        subText="Thiết Kế & Xây Dựng Khách Sạn Cao Cấp"
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '0.4rem 0.85rem',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Avatar circle */}
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: '#ffffff',
                border: '2px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {user.fullName.split(' ').slice(-1)[0][0]}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {user.fullName}
                </span>
                {userRoles.map((r) => (
                  <span key={r} className={`badge ${getRoleBadgeClass(r)}`}>
                    {getRoleLabel(r)}
                  </span>
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.725rem',
                  color: 'var(--text-muted)',
                }}
              >
                <Building2 size={12} />
                <span>{deptName}</span>
                <span>•</span>
                <span className="font-mono">{user.email}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPwModal(true)}
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)' }}
              title="Đổi mật khẩu"
            >
              <KeyRound size={16} />
            </button>

            <button
              onClick={logout}
              className="btn btn-ghost btn-sm"
              style={{
                marginLeft: '0.5rem',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-md)',
              }}
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
      {showPwModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '420px',
              width: '90%',
              backgroundColor: 'var(--surface-color)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Đổi Mật Khẩu</h3>
              <button type="button" onClick={closePwModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label className="form-label">Mật khẩu hiện tại</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  maxLength={50}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Mật khẩu mới</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  maxLength={50}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Nhập lại mật khẩu mới</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  maxLength={50}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              </button>
              {pwMsg && (
                <div style={{ fontSize: '0.82rem', color: pwMsg.type === 'success' ? '#10b981' : '#ef4444' }}>{pwMsg.text}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closePwModal} disabled={pwLoading}>Đóng</button>
                <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                  {pwLoading ? 'Đang lưu...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
