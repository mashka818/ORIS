const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Booking',
  tableName: 'bookings',
  columns: {
    id: { type: Number, primary: true, generated: true },
    date: { type: String }, // YYYY-MM-DD
    time: { type: String }, // HH:MM
    name: { type: String },
    phone: { type: String },
    clinicId: { type: Number },
    status: { type: String, default: 'active' }, // active | cancelled
    createdAt: { type: 'timestamp', createDate: true },
    updatedAt: { type: 'timestamp', updateDate: true },
  },
  relations: {
    clinic: {
      type: 'many-to-one',
      target: 'Clinic',
      joinColumn: { name: 'clinicId' },
      nullable: false,
    },
  },
  indices: [
    { name: 'idx_booking_date_time_clinic', columns: ['date', 'time', 'clinicId'] },
  ],
});


