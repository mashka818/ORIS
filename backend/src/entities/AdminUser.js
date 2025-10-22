const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'AdminUser',
  tableName: 'admin_users',
  columns: {
    id: { type: Number, primary: true, generated: true },
    username: { type: String, unique: true },
    passwordHash: { type: String },
    createdAt: { type: 'timestamp', createDate: true },
    updatedAt: { type: 'timestamp', updateDate: true },
  },
});


