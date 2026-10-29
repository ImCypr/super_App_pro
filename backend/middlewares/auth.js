const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware bảo vệ route - xác thực mã JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('department').populate('directManager', 'fullName email role department');

    if (!user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Phân quyền truy cập theo vai trò người dùng (Tài khoản có thể giữ 1 hoặc nhiều vai trò)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
    }

    const userRoles = req.user.roles && req.user.roles.length > 0
      ? req.user.roles
      : (req.user.role ? [req.user.role] : []);

    if (userRoles.length === 1 && userRoles[0] === 'unassigned') {
      return res.status(403).json({
        message: 'Tài khoản của bạn chưa được gán chức danh nghiệp vụ. Vui lòng liên hệ Quản trị viên (Admin) để được cấp quyền.',
        isUnassigned: true,
      });
    }

    const hasPermission = roles.some((role) => userRoles.includes(role));
    if (!hasPermission) {
      return res.status(403).json({
        message: 'Bạn không có quyền thực hiện hành động này với chức danh hiện tại',
        requiredRoles: roles,
        currentRole: req.user.role,
        currentRoles: userRoles,
      });
    }

    next();
  };
};

module.exports = { protect, restrictTo };
