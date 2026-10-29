const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Tài khoản đăng nhập là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [50, 'Tài khoản đăng nhập không được vượt quá 50 ký tự'],
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'nhan_vien', 'truong_phong', 'thu_mua', 'ke_toan', 'giam_doc', 'chu_tich', 'unassigned'],
    default: 'unassigned',
  },
  roles: {
    type: [String],
    enum: ['admin', 'nhan_vien', 'truong_phong', 'thu_mua', 'ke_toan', 'giam_doc', 'chu_tich', 'unassigned'],
    default: function () {
      return this.role ? [this.role] : ['unassigned'];
    },
  },
  rawPassword: {
    type: String,
    default: '123456',
    select: false,
  },
  // Trưởng phòng trực tiếp của nhân viên này (nếu có).
  // Nếu được thiết lập, đơn mua sắm của nhân viên sẽ đi qua người này thay vì qua role truong_phong chung.
  directManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  bankAccount: {
    accountNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountHolder: { type: String, default: '' },
  },
  avatar: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Đồng bộ role chính và danh sách roles đa vai trò
userSchema.pre('validate', function () {
  if (this.roles && this.roles.length > 0) {
    if (!this.role || !this.roles.includes(this.role)) {
      this.role = this.roles[0];
    }
  } else if (this.role) {
    this.roles = [this.role];
  }
});

// Mã hóa mật khẩu trước khi lưu & lưu trữ rawPassword để Quản trị viên (Admin) xem
userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      this.rawPassword = this.password;
    }
    this.password = await bcrypt.hash(this.password, 12);
  }
});

// Phương thức so sánh mật khẩu khi đăng nhập
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
