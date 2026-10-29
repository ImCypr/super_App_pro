import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Role } from '../models';

export const ProtectedRoute: React.FC<{
  children: React.ReactElement;
  allowedRoles?: Role[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-dark)',
          color: 'var(--text-secondary)',
          gap: '1rem',
        }}
      >
        <Loader2 size={36} className="animate-spin" color="var(--primary)" />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Đang xác thực thông tin...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRoles: Role[] = (user.roles && user.roles.length > 0) ? user.roles : [user.role];

  // Nếu người dùng chưa được gán chức danh (unassigned), tự động điều hướng sang trang thông báo
  const isOnlyUnassigned = userRoles.length === 1 && userRoles[0] === 'unassigned';
  if (isOnlyUnassigned && location.pathname !== '/unassigned' && location.pathname !== '/profile') {
    return <Navigate to="/unassigned" replace />;
  }

  // Kiểm tra quyền hạn vai trò nếu route có yêu cầu cụ thể
  if (allowedRoles && !userRoles.some((r) => allowedRoles.includes(r))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
