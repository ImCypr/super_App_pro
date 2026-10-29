import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import { getRoleBadgeClass, getRoleLabel } from '../../utils/formatters';
import {
  User as UserIcon,
  CreditCard,
  Save,
  CheckCircle,
  Shield,
  HelpCircle,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  // State tài khoản ngân hàng
  const [bankAccount, setBankAccount] = useState({
    bankName: user?.bankAccount?.bankName || '',
    accountNumber: user?.bankAccount?.accountNumber || '',
    accountHolder: user?.bankAccount?.accountHolder || user?.fullName || '',
  });

  const [savingBank, setSavingBank] = useState(false);
  const [successBank, setSuccessBank] = useState(false);
  const [errorBank, setErrorBank] = useState<string | null>(null);

  // State đổi mật khẩu
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [savingPass, setSavingPass] = useState(false);
  const [successPass, setSuccessPass] = useState(false);
  const [errorPass, setErrorPass] = useState<string | null>(null);

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    setErrorBank(null);
    setSuccessBank(false);
    try {
      const updatedUser = await authService.updateBankAccount(bankAccount);
      updateUser(updatedUser);
      setSuccessBank(true);
      setTimeout(() => setSuccessBank(false), 4000);
    } catch (err: any) {
      setErrorBank(err.message || 'Không thể cập nhật thông tin ngân hàng');
    } finally {
      setSavingBank(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPass(null);
    setSuccessPass(false);

    if (!passwordData.currentPassword) {
      setErrorPass('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setErrorPass('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorPass('Mật khẩu mới và xác nhận mật khẩu không trùng khớp');
      return;
    }

    setSavingPass(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccessPass(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessPass(false), 5000);
    } catch (err: any) {
      setErrorPass(err.response?.data?.message || err.message || 'Không thể đổi mật khẩu');
    } finally {
      setSavingPass(false);
    }
  };

  const deptName =
    typeof user?.department === 'object' && user.department !== null
      ? user.department.name
      : 'Không xác định';

  const userRoles = (user?.roles && user.roles.length > 0)
    ? user.roles
    : (user?.role ? [user.role] : []);

  return (
    <div>
      {/* Tiêu đề trang */}
      <div className="page-header">
        <div className="page-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <UserIcon size={20} />
            </div>
            <h1>Hồ Sơ Cá Nhân & Bảo Mật</h1>
          </div>
          <p style={{ fontSize: '0.875rem' }}>
            Xem quyền hạn chức danh đảm nhận, đổi mật khẩu và quản lý tài khoản ngân hàng thụ hưởng.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Cột trái: Thông tin nhân sự + Đổi mật khẩu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Thẻ thông tin nhân sự */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Shield size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff' }}>Thông Tin Nhân Sự</h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  color: '#ffffff',
                  border: '3px solid rgba(255, 255, 255, 0.15)',
                  flexShrink: 0,
                }}
              >
                {user?.fullName?.split(' ').slice(-1)[0]?.[0] || 'U'}
              </div>

              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  {user?.fullName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Tài khoản: <strong style={{ color: 'var(--text-secondary)' }}>{user?.email}</strong>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                  {userRoles.map((r) => (
                    <span key={r} className={`badge ${getRoleBadgeClass(r)}`}>
                      {getRoleLabel(r)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phòng ban trực thuộc:</span>
                <strong style={{ color: '#ffffff' }}>{deptName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Các chức danh đảm nhận:</span>
                <span style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {userRoles.map((r) => (
                    <code key={r} style={{ fontSize: '0.78rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--accent-cyan)' }}>
                      {r}
                    </code>
                  ))}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Trạng thái tài khoản:</span>
                <span className="badge badge-success">Đang hoạt động</span>
              </div>
            </div>

            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.825rem' }}>
                <HelpCircle size={15} color="var(--primary)" />
                <span>Quyền hạn theo các vai trò của bạn:</span>
              </div>
              <ul style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, paddingLeft: '1.2rem' }}>
                {userRoles.includes('nhan_vien') && <li><strong>Nhân viên:</strong> Lập đề xuất mua sắm & tạm ứng kinh phí.</li>}
                {userRoles.includes('truong_phong') && <li><strong>Trưởng phòng:</strong> Duyệt Bước 1 cho các nhân viên thuộc quyền quản lý trực tiếp.</li>}
                {userRoles.includes('thu_mua') && <li><strong>Thu mua:</strong> Lập báo giá 3-4 nhà cung cấp, giải trình và thực hiện mua sắm.</li>}
                {userRoles.includes('ke_toan') && <li><strong>Kế toán:</strong> Tiếp nhận hóa đơn/hợp đồng, lập đề xuất thanh toán & thực hiện giải ngân.</li>}
                {userRoles.includes('giam_doc') && <li><strong>Giám đốc:</strong> Phê duyệt báo giá mua sắm, phê duyệt chi và duyệt đơn tạm ứng &le; 10 triệu.</li>}
                {userRoles.includes('chu_tich') && <li><strong>Chủ tịch:</strong> Phê duyệt mua sắm và chi tiền &gt; 10 triệu đồng, thẩm quyền tối cao.</li>}
                {userRoles.includes('admin') && <li><strong>Quản trị viên:</strong> Toàn quyền quản trị tài khoản nhân sự và cơ cấu phòng ban.</li>}
              </ul>
            </div>
          </div>

          {/* Thẻ Đổi Mật Khẩu */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <KeyRound size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff' }}>Đổi Mật Khẩu Đăng Nhập</h3>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Để bảo vệ an toàn cho tài khoản, bạn nên sử dụng mật khẩu mạnh tối thiểu 6 ký tự.
            </p>

            {successPass && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--success-bg)',
                  border: '1px solid var(--success-border)',
                  borderRadius: 'var(--radius-md)',
                  color: '#34d399',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle size={16} />
                <span>Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật.</span>
              </div>
            )}

            {errorPass && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                {errorPass}
              </div>
            )}

            <form onSubmit={handleSavePassword}>
              <div className="form-group">
                <label className="form-label">
                  Mật Khẩu Hiện Tại <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    className="form-input"
                    placeholder="Nhập mật khẩu đang sử dụng"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{
                      position: 'absolute',
                      right: '0.6rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                    }}
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mật Khẩu Mới (Tối thiểu 6 ký tự) <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="form-input"
                    placeholder="Nhập mật khẩu mới"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{
                      position: 'absolute',
                      right: '0.6rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                    }}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">
                  Xác Nhận Mật Khẩu Mới <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="form-input"
                    placeholder="Nhập lại mật khẩu mới"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{
                      position: 'absolute',
                      right: '0.6rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                    }}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPass}
                className="btn btn-warning"
                style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Lock size={16} />
                <span>{savingPass ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Cột phải: Cập nhật số tài khoản ngân hàng */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <CreditCard size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff' }}>Tài Khoản Ngân Hàng Thụ Hưởng</h3>
          </div>

          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Thông tin này được sử dụng khi bạn lập đề xuất tạm ứng kinh phí hoặc nhận tiền giải ngân trực tiếp từ phòng Kế toán.
          </p>

          {successBank && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--success-bg)',
                border: '1px solid var(--success-border)',
                borderRadius: 'var(--radius-md)',
                color: '#34d399',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle size={16} />
              <span>Đã lưu thông tin tài khoản ngân hàng thành công!</span>
            </div>
          )}

          {errorBank && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              {errorBank}
            </div>
          )}

          <form onSubmit={handleSaveBank}>
            <div className="form-group">
              <label className="form-label">
                Tên Ngân Hàng <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Ví dụ: Vietcombank, Techcombank, MBBank..."
                value={bankAccount.bankName}
                onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Số Tài Khoản <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                className="form-input font-mono"
                placeholder="0123456789..."
                value={bankAccount.accountNumber}
                onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Tên Chủ Tài Khoản (Không dấu)</label>
              <input
                type="text"
                className="form-input"
                placeholder="NGUYEN VAN A..."
                value={bankAccount.accountHolder}
                onChange={(e) => setBankAccount({ ...bankAccount, accountHolder: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={savingBank}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              <Save size={16} />
              <span>{savingBank ? 'Đang lưu...' : 'Lưu Thay Đổi Ngân Hàng'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
