import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DEMO_ACCOUNTS } from '../../utils/formatters';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { TagLogo } from '../../component/TagLogo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('nhanvien@demo.com');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setIsLoading(true);
    try {
      await login(demoEmail, demoPass);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 20%, #172554 0%, #090d16 65%, #050811 100%)',
        padding: '2rem 1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hiệu ứng quầng sáng trang trí nền */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '15%',
          width: '450px',
          height: '450px',
          background: 'rgba(99, 102, 241, 0.15)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '15%',
          width: '450px',
          height: '450px',
          background: 'rgba(6, 182, 212, 0.12)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '2rem',
          zIndex: 1,
        }}
      >
        {/* Cột bên trái: Thẻ form đăng nhập */}
        <div className="card-glass" style={{ padding: '2.5rem' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <TagLogo
              size={46}
              subText="Công Ty TNHH Chuyên Cung Cấp Dịch Vụ Xây Dựng, Thiết Kế Khách Sạn Cao Cấp"
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.4rem', color: '#ffffff' }}>
              Cổng Đề Xuất & Phê Duyệt
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Đăng nhập để khởi tạo hoặc phê duyệt các đề xuất mua sắm vật tư & tạm ứng dự án TAG.
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">
                  Tài khoản đăng nhập <span className="required">*</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tối đa 50 ký tự</span>
              </div>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  required
                  maxLength={50}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Tên đăng nhập hoặc email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">
                Mật khẩu <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="password"
                  required
                  maxLength={50}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              <span>{isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
              <ArrowRight size={17} />
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.775rem',
              color: 'var(--text-muted)',
            }}
          >
            Mật khẩu mặc định hệ thống: <strong style={{ color: 'var(--text-primary)' }}>123456</strong>
          </div>
        </div>


      </div>
    </div>
  );
};
