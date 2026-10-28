const Department = require('../models/Department');

class DepartmentService {
  async create(data) {
    const existing = await Department.findOne({ name: data.name });
    if (existing) {
      if (existing.isActive) throw new Error('Phòng ban đã tồn tại');
      // Phòng ban đã bị xóa mềm trước đó -> kích hoạt lại với thông tin mới
      existing.isActive = true;
      if (data.description !== undefined) existing.description = data.description;
      return await existing.save();
    }
    return await Department.create(data);
  }

  async getAll() {
    return await Department.find({ isActive: true }).sort({ name: 1 });
  }

  async getById(id) {
    const dept = await Department.findById(id);
    if (!dept) throw new Error('Phòng ban không tồn tại');
    return dept;
  }

  async update(id, data) {
    if (data.name) {
      const duplicate = await Department.findOne({ name: data.name, _id: { $ne: id } });
      if (duplicate) throw new Error('Tên phòng ban đã tồn tại');
    }
    const dept = await Department.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!dept) throw new Error('Phòng ban không tồn tại');
    return dept;
  }

  async delete(id) {
    const dept = await Department.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!dept) throw new Error('Phòng ban không tồn tại');
    return dept;
  }
}

module.exports = new DepartmentService();
