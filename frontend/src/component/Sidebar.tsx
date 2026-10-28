import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Banknote,
  CreditCard,
  CheckCircle2,
  UserCheck,
  HelpCircle,
  Users,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TagLogo } from './TagLogo';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  // Xây dựng danh sách menu điều hướng linh hoạt theo danh sách vai trò (hỗ trợ đa vai trò)
  const buildNavItems = () => {
    if (!user) return [];

    const roles = (user.roles && user.roles.length > 0) ? user.roles : [user.role];
    const hasRole = (...targetRoles: string[]) => targetRoles.some(r => roles.includes(r as any));

    // 1. Nếu tài khoản CHỈ có vai trò 'unassigned'
    if (roles.length === 1 && roles[0] === 'unassigned') {
      return [
        {
          to: '/unassigned',
          label: 'Chờ Phân Quyền',
          icon: <ShieldAlert size={19} />,
          highlight: true,
        },
        {
          to: '/profile',
          label: 'Hồ Sơ Cá Nhân',
          icon: <UserCheck size={19} />,
        },
      ];
    }

    const items: Array<{
      to: string;
      label: string;
      icon: React.ReactNode;
      accent?: string;
      highlight?: boolean;
    }> = [
      {
        to: '/dashboard',
        label: 'Tổng Quan',
        icon: <LayoutDashboard size={19} />,
      },
    ];

    // Menu Quản trị hệ thống (nếu có role admin)
    if (hasRole('admin')) {
      items.push(
        {
          to: '/admin/users',
          label: 'Quản Trị Người Dùng',
          icon: <Users size={19} />,
          accent: '#8b5cf6',
          highlight: true,
        },
        {
          to: '/admin/departments',
          label: 'Quản Lý Phòng Ban',
          icon: <Building2 size={19} />,
        }
      );
    }

    // Menu "Cần Tôi Duyệt" - dành cho các cấp có trách nhiệm phê duyệt / khảo giá / giải ngân
    if (hasRole('truong_phong', 'thu_mua', 'ke_toan', 'giam_doc', 'chu_tich')) {
      items.push({
        to: '/approval',
        label: 'Cần Tôi Duyệt',
        icon: <CheckCircle2 size={19} />,
        highlight: true,
      });
    }

    // Đề xuất mua sắm: Nhân viên, Trưởng phòng, Thu mua, Ban giám đốc, Kế toán
    if (hasRole('nhan_vien', 'truong_phong', 'thu_mua', 'ke_toan', 'giam_doc', 'chu_tich')) {
      items.push({
        to: '/purchase',
        label: 'Đề Xuất Mua Sắm',
        icon: <ShoppingCart size={19} />,
      });
    }

    // Đề xuất thanh toán: Kế toán (lập & giải ngân) và Ban giám đốc (duyệt chi)
    if (hasRole('ke_toan', 'giam_doc', 'chu_tich')) {
      items.push({
        to: '/payment',
        label: 'Đề Xuất Thanh Toán',
        icon: <CreditCard size={19} />,
        accent: '#10b981',
      });
    }

    // Đề xuất tạm ứng: Dành cho Nhân viên, Thu mua (cần ứng chi phí), Trưởng phòng, Kế toán và Ban giám đốc
    if (hasRole('nhan_vien', 'truong_phong', 'thu_mua', 'ke_toan', 'giam_doc', 'chu_tich')) {
      items.push({
        to: '/advance',
        label: 'Đề Xuất Tạm Ứng',
        icon: <Banknote size={19} />,
      });
    }

    // Hồ sơ cá nhân & ngân hàng
    items.push({
      to: '/profile',
      label: hasRole('ke_toan', 'thu_mua') ? 'Hồ Sơ & Ngân Hàng' : 'Hồ Sơ Cá Nhân',
      icon: <UserCheck size={19} />,
    });

    return items;
  };

  const navItems = buildNavItems();

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#0c101c',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      <div style={{ padding: '1.25rem 1rem' }}>
        {/* Brand Header */}
        <div style={{ padding: '0.25rem 0.5rem 1.25rem 0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
          <TagLogo size={36} subText="Thiết Kế & Xây Dựng Khách Sạn" />
        </div>

        {/* Navigation list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              marginBottom: '0.25rem',
            }}
          >
            {user?.role === 'admin' ? 'Menu Quản Trị' : 'Menu Chính'}
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'var(--transition)',
                textDecoration: 'none',
              })}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: item.highlight ? (item.accent || 'var(--warning)') : (item as any).accent ? (item as any).accent : 'inherit',
                }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Role explanation badge at bottom */}
      <div
        style={{
          padding: '1.25rem',
          margin: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <HelpCircle size={15} color="var(--primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {user?.role === 'admin' ? 'Phân Hệ Quản Trị' : 'Nhiệm Vụ Chức Danh'}
          </span>
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {(() => {
            const rs: string[] = user ? ((user.roles && user.roles.length > 0) ? user.roles : [user.role]) : [];
            const descs: Record<string, string> = {
              admin: 'Admin: Quản lý người dùng, chức danh và phòng ban.',
              nhan_vien: 'Nhân viên: Tạo yêu cầu mua sắm & đề xuất tạm ứng, nộp hoàn tạm ứng.',
              truong_phong: 'Trưởng phòng: Duyệt yêu cầu mua sắm của nhân viên trực tiếp quản lý (≤ 1.000.000đ).',
              thu_mua: 'Thu mua: Khảo giá 3-4 nhà cung cấp, giải trình mức giá và thực hiện mua hàng.',
              ke_toan: 'Kế toán: Tiếp nhận hồ sơ, lập đề xuất thanh toán, giải ngân & quyết toán.',
              giam_doc: 'Giám đốc: Duyệt mua sắm (≤ 10.000.000đ), phê duyệt chi thanh toán & tạm ứng.',
              chu_tich: 'Chủ tịch: Thẩm quyền duyệt tối cao cho mọi đơn mua sắm > 10.000.000đ & chi lớn.',
              unassigned: 'Chưa gán chức danh: Vui lòng liên hệ Quản trị viên để được phân quyền chức danh.',
            };
            return rs.map((r) => <div key={r} style={{ marginBottom: '0.3rem' }}>{descs[r]}</div>);
          })()}
        </div>
      </div>
    </aside>
  );
};
