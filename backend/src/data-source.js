const { DataSource } = require('typeorm');
const path = require('path');

const AdminUser = require('./entities/AdminUser');
const Booking = require('./entities/Booking');
const Clinic = require('./entities/Clinic');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '010406',
  database: process.env.DB_NAME || 'temp',
  synchronize: true,
  logging: false,
  entities: [AdminUser, Booking, Clinic],
});

module.exports = { AppDataSource };


