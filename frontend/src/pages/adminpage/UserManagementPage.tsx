import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  UserMinus,
  Lock,
  Unlock,
  AlertTriangle,
  Building2,
  GitFork,
  X,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { departmentService } from '../../services/departmentService';
import { User, Role, Department, EligibleManager, RoleStatistics } from '../../models';
import { getRoleLabel, getRoleBadgeClass } from '../../utils/formatters';
import { StatCard } from '../../component/StatCard';
import { useAuth } from '../../context/AuthContext';

const ALL_ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'admin', label: 'Quản trị viên (Admin)', desc: 'Toàn quyền quản lý tài khoản & phân quyền' },
  { value: 'nhan_vien', label: 'Nhân viên', desc: 'Lập yêu cầu mua sắm & đề xuất tạm ứng, hoàn ứng' },
  { value: 'truong_phong', label: 'Trưởng phòng', desc: 'Duyệt yêu cầu vật tư của nhân viên trực tiếp (≤ 1.000.000đ)' },
  { value: 'thu_mua', label: 'Thu mua', desc: 'Khảo giá 3-4 nhà cung cấp, giải trình mức giá và mua sắm' },
  { value: 'ke_toan', label: 'Kế toán', desc: 'Tiếp nhận hồ sơ, lập đề xuất thanh toán, giải ngân & quyết toán' },
  { value: 'giam_doc', label: 'Giám đốc', desc: 'Phê duyệt mua sắm (≤ 10.000.000đ) & chi thanh toán, tạm ứng' },
  { value: 'chu_tich', label: 'Chủ tịch', desc: 'Thẩm quyền tối cao duyệt mọi đơn mua sắm > 10.000.000đ & chi lớn' },
  { value: 'unassigned', label: 'Chưa gán chức danh', desc: 'Tài khoản chưa được phân công nhiệm vụ nghiệp vụ' },
];

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  // Dữ liệu chính
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<EligibleManager[]>([]);
  const [stats, setStats] = useState<RoleStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // State hiển thị mật khẩu của từng người dùng (ẩn ban đầu)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState<User | null>(null);
  const [showManagerModal, setShowManagerModal] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<User | null>(null);
  const [showRemoveRoleModal, setShowRemoveRoleModal] = useState<User | null>(null);

  // Form state cho Tạo mới (hỗ trợ nhiều role)
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '123456',
    department: '',
    role: 'nhan_vien' as Role,
    roles: ['nhan_vien'] as Role[],
    directManager: '',
    bankAccount: {
      accountNumber: '',
      bankName: '',
      accountHolder: '',
    },
  });

  // Form state cho Đổi chức danh (hỗ trợ chọn nhiều role cùng lúc)
  const [selectedRole, setSelectedRole] = useState<Role>('nhan_vien');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['nhan_vien']);

  // Form state cho Đổi Trưởng phòng trực tiếp
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');

  // Form state cho Sửa thông tin người dùng (Admin)
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    password: '',
    department: '',
    accountNumber: '',
    bankName: '',
    accountHolder: '',
  });

  const openEditModal = (u: User) => {
    const deptId = typeof u.department === 'object' && u.department ? (u.department as any)._id : (u.department as any) || '';
    setEditForm({
      fullName: u.fullName || '',
      email: u.email || '',
      password: '',
      department: deptId,
      accountNumber: u.bankAccount?.accountNumber || '',
      bankName: u.bankAccount?.bankName || '',
      accountHolder: u.bankAccount?.accountHolder || '',
    });
    setShowEditModal(u);
  };

  // Tải toàn bộ dữ liệu quản trị
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, statsData, deptsData, managersData] = await Promise.all([
        adminService.getAllUsers({ search, role: roleFilter, department: deptFilter, isActive: statusFilter }),
        adminService.getRoleStatistics(),
        departmentService.getAll(),
        adminService.getAvailableManagers(),
      ]);

      setUsers(usersData);
      setStats(statsData);
      setDepartments(deptsData);
      setManagers(managersData);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Lỗi khi tải danh sách người dùng',
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, deptFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Xử lý Tạo người dùng mới
  // Xử lý bật/tắt vai trò khi Tạo mới
  const handleToggleCreateRole = (role: Role) => {
    setCreateForm((prev) => {
      let nextRoles: Role[];
      if (prev.roles.includes(role)) {
        nextRoles = prev.roles.filter((r) => r !== role);
        if (nextRoles.length === 0) nextRoles = ['unassigned'];
      } else {
        nextRoles = [...prev.roles.filter((r) => r !== 'unassigned'), role];
      }
      return {
        ...prev,
        roles: nextRoles,
        role: nextRoles[0] || 'unassigned',
      };
    });
  };

  // Xử lý bật/tắt vai trò trong Modal Gán / Đổi Chức danh
  const handleToggleModalRole = (role: Role) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        const next = prev.filter((r) => r !== role);
        return next.length > 0 ? next : ['unassigned'];
      } else {
        const clean = prev.filter((r) => r !== 'unassigned');
        return [...clean, role];
      }
    });
  };

  // Xử lý Tạo người dùng mới
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ Họ tên và Tài khoản đăng nhập');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.createUser({
        fullName: createForm.fullName,
        email: createForm.email,
        password: createForm.password,
        role: createForm.roles[0] || 'nhan_vien',
        roles: createForm.roles,
        department: createForm.department || null,
        directManager: createForm.directManager || null,
        bankAccount: createForm.bankAccount,
      });

      showToast('success', `Đã tạo tài khoản cho ${createForm.fullName} và gán chức danh thành công!`);
      setShowCreateModal(false);
      setCreateForm({
        fullName: '',
        email: '',
        password: '123456',
        department: '',
        role: 'nhan_vien',
        roles: ['nhan_vien'],
        directManager: '',
        bankAccount: { accountNumber: '', bankName: '', accountHolder: '' },
      });
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Không thể tạo tài khoản');
    } finally {
      setActionLoading(false);
    }
  };

  // Xử lý Admin sửa thông tin người dùng
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      showToast('error', 'Họ tên và Tài khoản đăng nhập không được để trống');
      return;
    }
    if (editForm.password && editForm.password.trim().length < 6) {
      showToast('error', 'Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.updateUser(showEditModal._id, {
        fullName: editForm.fullName,
        email: editForm.email,
        department: editForm.department || null,
        bankAccount: {
          accountNumber: editForm.accountNumber,
          bankName: editForm.bankName,
          accountHolder: editForm.accountHolder,
        },
        ...(editForm.password.trim() ? { password: editForm.password.trim() } : {}),
      });
      showToast('success', `Đã cập nhật thông tin của ${editForm.fullName}`);
      setShowEditModal(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Không thể cập nhật thông tin');
    } finally {
      setActionLoading(false);
    }
  };

  // Xử lý Cập nhật / Gán Chức Danh (Đa vai trò)
  const handleUpdateRole = async () => {
    if (!showRoleModal) return;
    setActionLoading(true);
    try {
      await adminService.updateUserRole(showRoleModal._id, selectedRoles);
      const rolesLabel = selectedRoles.map((r) => getRoleLabel(r)).join(', ');
      showToast('success', `Đã cập nhật các chức danh của ${showRoleModal.fullName}: ${rolesLabel}`);
      setShowRoleModal(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi khi cập nhật chức danh');
    } finally {
      setActionLoading(false);
    }
  };

  // Xử lý Xóa Chức Danh (Chuyển về unassigned)
  const handleRemoveRole = async () => {
    if (!showRemoveRoleModal) return;
    setActionLoading(true);
    try {
      await adminService.removeUserRole(showRemoveRoleModal._id);
      showToast('success', `Đã xóa chức danh của ${showRemoveRoleModal.fullName}. Người dùng chuyển về Chưa gán chức danh.`);
      setShowRemoveRoleModal(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi khi xóa chức danh');
    } finally {
      setActionLoading(false);
    }
  };

  // Xử lý Gán / Đổi Trưởng phòng trực tiếp
  const handleSetDirectManager = async () => {
    if (!showManagerModal) return;
    setActionLoading(true);
    try {
      await adminService.setDirectManager(showManagerModal._id, selectedManagerId || null);
      showToast(
        'success',
        selectedManagerId
          ? `Đã gán Trưởng phòng trực tiếp cho ${showManagerModal.fullName}`
          : `Đã hủy liên kết Trưởng phòng trực tiếp của ${showManagerModal.fullName}`
      );
      setShowManagerModal(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi khi thiết lập Trưởng phòng trực tiếp');
    } finally {
      setActionLoading(false);
    }
  };

  // Xử lý Bật/Tắt hoạt động
  const handleToggleStatus = async (user: User) => {
    if (user._id === currentUser?._id) {
      showToast('error', 'Bạn không thể tự khóa tài khoản của chính mình');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await adminService.toggleUserStatus(user._id);
      showToast('success', updated.isActive ? `Đã kích hoạt tài khoản ${user.fullName}` : `Đã khóa tài khoản ${user.fullName}`);
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi khi thay đổi trạng thái');
    } finally {
      setActionLoading(false);
    }
  };

  // Xử lý Xóa vĩnh viễn tài khoản
  const handleDeleteUser = async () => {
    if (!showDeleteModal) return;
    setActionLoading(true);
    try {
      const res = await adminService.deleteUser(showDeleteModal._id);
      showToast('success', res.message || 'Đã xóa người dùng thành công');
      setShowDeleteModal(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Không thể xóa tài khoản');
    } finally {
      setActionLoading(false);
    }
  };

  // Danh sách người dùng đã được lọc
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        search === '' ||
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchRole =
        roleFilter === 'all' ||
        u.role === roleFilter ||
        (Array.isArray(u.roles) && u.roles.includes(roleFilter as Role));

      const userDeptId = typeof u.department === 'object' && u.department ? (u.department as any)._id : u.department;
      const matchDept = deptFilter === 'all' || userDeptId === deptFilter;

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'true' && u.isActive) ||
        (statusFilter === 'false' && !u.isActive);

      return matchSearch && matchRole && matchDept && matchStatus;
    });
  }, [users, search, roleFilter, deptFilter, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2.5rem' }}>
      {/* Toast Notification */}
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
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', marginLeft: '0.5rem' }}
          >
            <X size={16} />
          </button>
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
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a78bfa',
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Quản Trị Người Dùng & Phân Quyền Chức Danh
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
              Mỗi tài khoản có thể đảm nhiệm một hoặc nhiều chức danh. Thiết lập Trưởng phòng trực tiếp duyệt đơn mua sắm.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            title="Tải lại danh sách"
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            <span>Làm Mới</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#7c3aed',
              borderColor: '#7c3aed',
            }}
          >
            <UserPlus size={18} />
            <span>Tạo Người Dùng Mới</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          <StatCard
            title="Tổng Người Dùng"
            value={stats.totalUsers}
            subtitle={`Đang hoạt động: ${stats.activeUsers} | Khóa: ${stats.inactiveUsers}`}
            icon={<Users size={22} />}
          />
          <StatCard
            title="Quản Trị Viên (Admin)"
            value={stats.statsByRole.admin || 0}
            subtitle="Toàn quyền phân chức danh"
            accentColor="#8b5cf6"
          />
          <StatCard
            title="Nhân Viên Nghiệp Vụ"
            value={stats.statsByRole.nhan_vien || 0}
            subtitle="Tạo đề xuất mua sắm & tạm ứng"
            accentColor="#3b82f6"
          />
          <StatCard
            title="Cấp Quản Lý Duyệt"
            value={(stats.statsByRole.truong_phong || 0) + (stats.statsByRole.giam_doc || 0) + (stats.statsByRole.chu_tich || 0)}
            subtitle={`TP: ${stats.statsByRole.truong_phong || 0} • GĐ: ${stats.statsByRole.giam_doc || 0} • CT: ${stats.statsByRole.chu_tich || 0}`}
            accentColor="#f59e0b"
          />
          <StatCard
            title="Chưa Gán Chức Danh"
            value={stats.statsByRole.unassigned || 0}
            subtitle="Chờ Admin cấp quyền"
            accentColor={stats.statsByRole.unassigned > 0 ? '#ef4444' : '#6b7280'}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--surface-color)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Tìm theo họ tên hoặc tài khoản..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Filter size={15} />
            <span>Lọc:</span>
          </div>

          {/* Lọc Chức danh */}
          <select
            className="form-control"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '170px' }}
          >
            <option value="all">Tất cả Chức Danh</option>
            {ALL_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Lọc Phòng ban */}
          <select
            className="form-control"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '170px' }}
          >
            <option value="all">Tất cả Phòng Ban</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Lọc Trạng thái */}
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã bị khóa</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          backgroundColor: 'var(--surface-color)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Người Dùng
                </th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Phòng Ban
                </th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Chức Danh Nghiệp Vụ
                </th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Mật Khẩu
                </th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Trưởng Phòng Trực Tiếp
                </th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Trạng Thái
                </th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', textAlign: 'right' }}>
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <RefreshCw size={24} className="spin" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={32} style={{ opacity: 0.4 }} />
                      <span style={{ fontWeight: 600 }}>Không tìm thấy người dùng phù hợp</span>
                      <span style={{ fontSize: '0.8rem' }}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const deptName =
                    typeof u.department === 'object' && u.department ? (u.department as any).name : 'Chưa phân phòng ban';

                  const mgr = typeof u.directManager === 'object' && u.directManager ? (u.directManager as any) : null;
                  const userRoles = (u.roles && u.roles.length > 0) ? u.roles : [u.role];

                  return (
                    <tr
                      key={u._id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Cột 1: Thông tin người dùng */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              backgroundColor: u.role === 'admin' ? '#7c3aed' : 'rgba(99, 102, 241, 0.2)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                              {u.fullName}
                              {u._id === currentUser?._id && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700 }}>
                                  (Bạn)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Phòng ban */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>{deptName}</span>
                        </div>
                      </td>

                      {/* Cột 3: Chức danh (hỗ trợ nhiều chức danh) */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxWidth: '260px' }}>
                          {userRoles.map((r) => (
                            <span key={r} className={`badge ${getRoleBadgeClass(r)}`}>
                              {getRoleLabel(r)}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Cột 4: Mật khẩu (Trạng thái ban đầu ********, bấm con mắt để xem) */}
                      <td style={{ padding: '1rem' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <span
                            className="font-mono"
                            style={{
                              fontSize: '0.82rem',
                              letterSpacing: visiblePasswords[u._id] ? '0' : '0.15em',
                              color: visiblePasswords[u._id] ? '#38bdf8' : 'var(--text-muted)',
                              fontWeight: visiblePasswords[u._id] ? 600 : 400,
                            }}
                          >
                            {visiblePasswords[u._id] ? (u.rawPassword || '123456') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u._id)}
                            title={visiblePasswords[u._id] ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: visiblePasswords[u._id] ? '#38bdf8' : 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {visiblePasswords[u._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Cột 5: Trưởng phòng trực tiếp */}
                      <td style={{ padding: '1rem' }}>
                        {mgr ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <GitFork size={14} style={{ color: '#10b981' }} />
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {mgr.fullName}
                              </div>
                              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                {getRoleLabel(mgr.role)}
                              </div>
                            </div>
                          </div>
                        ) : userRoles.some((r) => ['giam_doc', 'chu_tich', 'admin'].includes(r)) ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Cấp lãnh đạo tối cao
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertTriangle size={13} />
                            <span>Chưa gán</span>
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Trạng thái */}
                      <td style={{ padding: '1rem' }}>
                        {u.isActive ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10b981' }} />
                            Hoạt động
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      {/* Cột 7: Hành động */}
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          {/* Nút Sửa thông tin */}
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => openEditModal(u)}
                            title="Sửa thông tin người dùng"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Edit2 size={14} style={{ color: '#3b82f6' }} />
                            <span>Sửa</span>
                          </button>

                          {/* Nút Gán / Đổi chức danh */}
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              setShowRoleModal(u);
                              const roles = (u.roles && u.roles.length > 0) ? u.roles : [u.role];
                              setSelectedRoles(roles);
                            }}
                            title="Gán hoặc đổi chức danh (hỗ trợ đa vai trò)"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <ShieldCheck size={14} style={{ color: '#8b5cf6' }} />
                            <span>Chức Danh</span>
                          </button>

                          {/* Nút Gán Trưởng phòng trực tiếp */}
                          {!userRoles.includes('admin') && !userRoles.some((r) => ['giam_doc', 'chu_tich'].includes(r)) && (
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setShowManagerModal(u);
                                setSelectedManagerId(mgr ? mgr._id : '');
                              }}
                              title="Gán/Đổi Trưởng phòng trực tiếp"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <GitFork size={14} style={{ color: '#10b981' }} />
                              <span>Gán TP</span>
                            </button>
                          )}

                          {/* Nút Xóa Chức Danh (nếu chưa phải unassigned) */}
                          {u.role !== 'unassigned' && u._id !== currentUser?._id && (
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => setShowRemoveRoleModal(u)}
                              title="Xóa chức danh (chuyển về Chưa gán)"
                              style={{ color: '#f59e0b' }}
                            >
                              <UserMinus size={14} />
                            </button>
                          )}

                          {/* Nút Khóa / Mở khóa tài khoản */}
                          {u._id !== currentUser?._id && (
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleToggleStatus(u)}
                              title={u.isActive ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                              style={{ color: u.isActive ? 'var(--text-muted)' : '#10b981' }}
                            >
                              {u.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                          )}

                          {/* Nút Xóa tài khoản */}
                          {u._id !== currentUser?._id && (
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => setShowDeleteModal(u)}
                              title="Xóa tài khoản vĩnh viễn"
                              style={{ padding: '0.35rem 0.5rem' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: SỬA THÔNG TIN NGƯỜI DÙNG ================= */}
      {showEditModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '560px',
              width: '90%',
              backgroundColor: 'var(--surface-color)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Sửa Thông Tin Người Dùng
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Họ và Tên *</label>
                <input
                  type="text"
                  className="form-input"
                  maxLength={100}
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Tài Khoản Đăng Nhập *</label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength={50}
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Mật Khẩu Mới</label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength={50}
                    placeholder="Để trống nếu không đổi"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Phòng Ban</label>
                <select
                  className="form-input"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                >
                  <option value="">Chưa phân phòng ban</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Số Tài Khoản</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.accountNumber}
                    onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Ngân Hàng</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.bankName}
                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Chủ Tài Khoản</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.accountHolder}
                    onChange={(e) => setEditForm({ ...editForm, accountHolder: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(null)} disabled={actionLoading}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: TẠO NGƯỜI DÙNG MỚI ================= */}
      {showCreateModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '560px',
              width: '90%',
              backgroundColor: 'var(--surface-color)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                  <UserPlus size={22} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Tạo Người Dùng Mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Họ và Tên *</label>
                <input
                  type="text"
                  className="form-input"
                  maxLength={100}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Tài Khoản Đăng Nhập *</label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tối đa 50 ký tự</span>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    maxLength={50}
                    placeholder="Ví dụ: ketoan, admin02 hoặc email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Mật Khẩu Khởi Tạo *</label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength={50}
                    placeholder="Mặc định: 123456"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Phòng Ban Trực Thuộc</label>
                <select
                  className="form-control"
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Chức Danh Đảm Nhận (Có thể chọn 2 hay nhiều vai trò) *
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                  {ALL_ROLES.map((r) => {
                    const isChecked = createForm.roles.includes(r.value);
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => handleToggleCreateRole(r.value)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '20px',
                          border: `1.5px solid ${isChecked ? '#8b5cf6' : 'var(--border-subtle)'}`,
                          backgroundColor: isChecked ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          color: isChecked ? '#c4b5fd' : 'var(--text-secondary)',
                          fontSize: '0.78rem',
                          fontWeight: isChecked ? 600 : 400,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isChecked && <CheckCircle2 size={13} color="#a78bfa" />}
                        <span>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Đã chọn: <strong style={{ color: '#a78bfa' }}>{createForm.roles.map((r) => getRoleLabel(r)).join(' • ')}</strong>
                </div>
              </div>

              {/* Chỉ định Trưởng phòng trực tiếp nếu vai trò là nhân viên hoặc thu mua */}
              {(createForm.roles.includes('nhan_vien') || createForm.roles.includes('thu_mua')) && (
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <GitFork size={15} color="#10b981" />
                    <span>Trưởng Phòng Trực Tiếp Duyệt Đơn:</span>
                  </label>
                  <select
                    className="form-control"
                    value={createForm.directManager}
                    onChange={(e) => setCreateForm({ ...createForm, directManager: e.target.value })}
                  >
                    <option value="">-- Không chỉ định (Sử dụng trưởng phòng theo phòng ban) --</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.fullName} ({getRoleLabel(m.role)}) {m.department ? `- ${(m.department as any).name}` : ''}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.4rem 0 0 0' }}>
                    💡 Đơn mua sắm của nhân viên sẽ tự động gửi thẳng đến người quản lý này duyệt ở Bước 1.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={actionLoading}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                  style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                >
                  {actionLoading ? 'Đang tạo...' : 'Xác Nhận Tạo Người Dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: GÁN / ĐỔI CHỨC DANH ================= */}
      {showRoleModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '500px',
              width: '90%',
              backgroundColor: 'var(--surface-color)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Gán / Đổi Chức Danh
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Tài khoản: <strong>{showRoleModal.fullName}</strong> ({showRoleModal.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>
                    Chọn Chức Danh Đảm Nhận (Có thể chọn nhiều role):
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600 }}>
                    {selectedRoles.length} vai trò đã chọn
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.65rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {ALL_ROLES.map((r) => {
                    const isSelected = selectedRoles.includes(r.value);
                    return (
                      <div
                        key={r.value}
                        onClick={() => handleToggleModalRole(r.value)}
                        style={{
                          padding: '0.7rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${isSelected ? '#7c3aed' : 'var(--border-subtle)'}`,
                          backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: isSelected ? '#a78bfa' : 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {r.label}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {r.desc}
                          </div>
                        </div>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '4px',
                            border: `1.5px solid ${isSelected ? '#7c3aed' : 'var(--border-color)'}`,
                            backgroundColor: isSelected ? '#7c3aed' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isSelected && <CheckCircle2 size={15} color="#ffffff" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ padding: '0.75rem 0.85rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Các chức danh sẽ được cấp quyền: </span>
                <strong style={{ color: '#c4b5fd' }}>
                  {selectedRoles.map((r) => getRoleLabel(r)).join(' • ')}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRoleModal(null)}
                  disabled={actionLoading}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateRole}
                  disabled={actionLoading}
                  style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                >
                  {actionLoading ? 'Đang lưu...' : 'Lưu Danh Sách Chức Danh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: GÁN TRƯỞNG PHÒNG TRỰC TIẾP ================= */}
      {showManagerModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '500px',
              width: '90%',
              backgroundColor: 'var(--surface-color)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <GitFork size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Gán Trưởng Phòng Trực Tiếp
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Nhân viên: <strong>{showManagerModal.fullName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManagerModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Chọn Người Quản Lý Trực Tiếp:</label>
                <select
                  className="form-control"
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  style={{ fontSize: '0.9rem', padding: '0.65rem' }}
                >
                  <option value="">-- Hủy liên kết (Không có Trưởng phòng trực tiếp riêng) --</option>
                  {managers
                    .filter((m) => m._id !== showManagerModal._id)
                    .map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.fullName} - {getRoleLabel(m.role)} {m.department ? `(${ (m.department as any).name })` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  📌 <strong>Cơ chế hoạt động:</strong> Khi nhân viên này gửi một đơn đề xuất mua sắm, hệ thống sẽ tự động gán bước duyệt sơ bộ đầu tiên cho người quản lý được chỉ định ở đây.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowManagerModal(null)}
                  disabled={actionLoading}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSetDirectManager}
                  disabled={actionLoading}
                  style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                >
                  {actionLoading ? 'Đang lưu...' : 'Xác Nhận Thiết Lập'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: XÓA CHỨC DANH (CHUYỂN VỀ UNASSIGNED) ================= */}
      {showRemoveRoleModal && (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f59e0b', marginBottom: '1rem' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Xác Nhận Xóa Chức Danh?
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Bạn đang thực hiện xóa chức danh của <strong>{showRemoveRoleModal.fullName}</strong> ({getRoleLabel(showRemoveRoleModal.role)}).
            </p>

            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.3)', margin: '0.75rem 0' }}>
              <p style={{ fontSize: '0.8rem', color: '#fcd34d', margin: 0 }}>
                ⚠️ Tài khoản sẽ chuyển về trạng thái <strong>Chưa gán chức danh (unassigned)</strong>. Người dùng sẽ bị tạm dừng quyền truy cập vào các phân hệ nghiệp vụ cho đến khi được gán chức danh mới.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowRemoveRoleModal(null)}
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={handleRemoveRole}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xóa chức danh...' : 'Đồng Ý Xóa Chức Danh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: XÓA VĨNH VIỄN TÀI KHOẢN ================= */}
      {showDeleteModal && (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', marginBottom: '1rem' }}>
              <XCircle size={26} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Xóa Vĩnh Viễn Tài Khoản?
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của <strong>{showDeleteModal.fullName}</strong> ({showDeleteModal.email}) khỏi hệ thống?
            </p>

            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.3)', margin: '0.75rem 0' }}>
              <p style={{ fontSize: '0.8rem', color: '#fca5a5', margin: 0 }}>
                ⛔ <strong>Cảnh báo:</strong> Thao tác này không thể hoàn tác. Các liên kết Trưởng phòng trực tiếp tới người này sẽ được tự động gỡ bỏ.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(null)}
                disabled={actionLoading}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteUser}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xóa...' : 'Xóa Vĩnh Viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
