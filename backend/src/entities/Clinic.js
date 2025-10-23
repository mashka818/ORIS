const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Clinic',
  tableName: 'clinics',
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, unique: true },
    createdAt: { type: 'timestamp', createDate: true },
    updatedAt: { type: 'timestamp', updateDate: true },
  },
});




