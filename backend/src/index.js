const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppDataSource } = require('./data-source');
const { In } = require('typeorm');
const { generateBookingPDF } = require('./pdf-generator');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const PORT = Number(process.env.PORT || 3000);

const app = express();
app.use(express.json());

// Serve frontend
const frontendDir = path.join(__dirname, '../../frontend');
app.use(express.static(frontendDir));

// Helpers
function generateSlots(start, end, stepMinutes){
  const slots = [];
  function timeToMinutes(t){ const [h,mi]=t.split(':').map(Number); return h*60+mi; }
  function minutesToTime(m){ return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; }
  let m = timeToMinutes(start);
  const endM = timeToMinutes(end);
  while(m <= endM){ slots.push(minutesToTime(m)); m += stepMinutes; }
  return slots;
}

function authMiddleware(req, res, next){
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if(!token) return res.status(401).json({ error: 'unauthorized' });
  try{ const payload = jwt.verify(token, JWT_SECRET); req.user = payload; next(); }
  catch{ return res.status(401).json({ error: 'unauthorized' }); }
}

AppDataSource.initialize().then(async () => {
  const adminRepo = AppDataSource.getRepository('AdminUser');
  const bookingRepo = AppDataSource.getRepository('Booking');
  const clinicRepo = AppDataSource.getRepository('Clinic');

  // Seed admin
  const existing = await adminRepo.findOne({ where: { username: 'admin' } });
  if(!existing){
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    await adminRepo.save({ username: 'admin', passwordHash });
    console.log('Seeded admin user: admin /', password);
  }

  // Seed clinics
  const clinics = [
    'ОРИС Теплый стан',
    'ОРИС Электрозаводская',
    'ОРИС Добрынинская'
  ];
  for(const name of clinics){
    const exists = await clinicRepo.findOne({ where: { name } });
    if(!exists){
      await clinicRepo.save({ name });
      console.log('Seeded clinic:', name);
    }
  }

  // Get clinics
  app.get('/api/clinics', async (req, res) => {
    try {
      const list = await clinicRepo.find({ order: { id: 'ASC' } });
      console.log('Loaded clinics:', list.length);
      res.json({ items: list });
    } catch(err) {
      console.error('Error loading clinics:', err);
      res.status(500).json({ error: 'failed_to_load_clinics' });
    }
  });

  // Auth
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body || {};
    if(!username || !password) return res.status(400).json({ error: 'missing_credentials' });
    const user = await adminRepo.findOne({ where: { username } });
    if(!user) return res.status(401).json({ error: 'invalid_credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if(!ok) return res.status(401).json({ error: 'invalid_credentials' });
    const token = jwt.sign({ uid: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  });

  // Availability (capacity only)
  app.get('/api/availability', async (req, res) => {
    const date = (req.query.date || '').toString();
    const clinicId = Number(req.query.clinicId) || null;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'invalid_date' });
    if(!clinicId) return res.status(400).json({ error: 'missing_clinic' });
    const capacity = 5;
    const slots = generateSlots('09:00', '18:30', 30);
    const activeBookings = await bookingRepo.createQueryBuilder('b')
      .where('b.date = :date', { date })
      .andWhere('b.clinicId = :clinicId', { clinicId })
      .andWhere('b.status IN (:...statuses)', { statuses: ['pending', 'attended'] })
      .getMany();
    const map = {};
    for(const s of slots){
      const booked = activeBookings.filter(b => b.time === s).length;
      map[s] = { time: s, capacity, booked, blocked: false, full: booked >= capacity };
    }
    res.json({ date, slots: slots.map(t => map[t]) });
  });

  // Create booking
  app.post('/api/bookings', async (req, res) => {
    const { date, time, name, phone, clinicId } = req.body || {};
    if(!date || !time || !name || !phone || !clinicId) return res.status(400).json({ error: 'missing_fields' });
    
    // Validate name (no special characters except spaces, hyphens, apostrophes)
    if(!/^[a-zA-Zа-яА-ЯёЁ\s\-']+$/.test(name)) {
      return res.status(400).json({ error: 'invalid_name' });
    }
    
    // Validate phone (must contain digits and allowed chars)
    if(!/^[\d\s\+\-\(\)]+$/.test(phone) || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'invalid_phone' });
    }
    
    const capacity = 5;
    const count = await bookingRepo.count({ 
      where: { 
        date, 
        time, 
        clinicId: Number(clinicId),
        status: In(['pending', 'attended']) 
      } 
    });
    if(count >= capacity) return res.status(409).json({ error: 'slot_full' });
    const saved = await bookingRepo.save({ date, time, name, phone, clinicId: Number(clinicId), status: 'pending' });
    res.status(201).json({ id: saved.id, bookingId: saved.id });
  });

  // Download booking PDF
  app.get('/api/bookings/:id/pdf', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const booking = await bookingRepo.findOne({ 
        where: { id },
        relations: ['clinic']
      });
      
      if(!booking) return res.status(404).json({ error: 'not_found' });
      
      const pdfBuffer = await generateBookingPDF(booking, booking.clinic);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=booking-${booking.id}.pdf`);
      res.send(pdfBuffer);
    } catch(err) {
      console.error('Error generating PDF:', err);
      res.status(500).json({ error: 'pdf_generation_failed' });
    }
  });

  // Admin bookings list
  app.get('/api/admin/bookings', authMiddleware, async (req, res) => {
    const date = (req.query.date || '').toString();
    const where = date ? { date } : {};
    const list = await bookingRepo.find({ 
      where, 
      relations: ['clinic'],
      order: { date: 'ASC', time: 'ASC', createdAt: 'ASC' } 
    });
    res.json({ items: list });
  });

  // Mark as attended
  app.patch('/api/admin/bookings/:id/attended', authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const b = await bookingRepo.findOne({ where: { id } });
    if(!b) return res.status(404).json({ error: 'not_found' });
    b.status = 'attended';
    await bookingRepo.save(b);
    res.json({ ok: true });
  });

  // Mark as not attended
  app.patch('/api/admin/bookings/:id/not-attended', authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const b = await bookingRepo.findOne({ where: { id } });
    if(!b) return res.status(404).json({ error: 'not_found' });
    b.status = 'not_attended';
    await bookingRepo.save(b);
    res.json({ ok: true });
  });

  // Get statistics
  app.get('/api/admin/statistics', authMiddleware, async (req, res) => {
    const period = req.query.period || 'all'; // day, week, month, year, all
    const clinicId = req.query.clinicId ? Number(req.query.clinicId) : null;
    
    const now = new Date();
    let allBookings = await bookingRepo.find({ relations: ['clinic'] });
    
    // Filter by period
    if(period === 'day') {
      const today = now.toISOString().split('T')[0];
      allBookings = allBookings.filter(b => b.date === today);
    } else if(period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      allBookings = allBookings.filter(b => b.date >= weekAgoStr);
    } else if(period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];
      allBookings = allBookings.filter(b => b.date >= monthAgoStr);
    } else if(period === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const yearAgoStr = yearAgo.toISOString().split('T')[0];
      allBookings = allBookings.filter(b => b.date >= yearAgoStr);
    }
    
    // Filter by clinic
    if(clinicId) {
      allBookings = allBookings.filter(b => b.clinicId === clinicId);
    }
    
    const attended = allBookings.filter(b => b.status === 'attended').length;
    const notAttended = allBookings.filter(b => b.status === 'not_attended').length;
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const total = allBookings.length;
    
    res.json({ total, attended, notAttended, pending });
  });

  // Test: Delete all bookings
  app.delete('/api/admin/test/delete-all', authMiddleware, async (req, res) => {
    try {
      await bookingRepo.clear();
      res.json({ ok: true, message: 'All bookings deleted' });
    } catch(err) {
      console.error('Error deleting bookings:', err);
      res.status(500).json({ error: 'Failed to delete bookings' });
    }
  });

  // Test: Fill slot 9:00-9:30 on 23rd
  app.post('/api/admin/test/fill-slot', authMiddleware, async (req, res) => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + (nextMonth.getDate() > 23 ? 1 : 0));
    const date = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-23`;
    const time = '09:00';
    
    const clinics = await clinicRepo.find();
    const names = ['Иван Иванов', 'Петр Петров', 'Мария Смирнова', 'Анна Кузнецова', 'Сергей Попов'];
    
    for(const clinic of clinics) {
      for(let i = 0; i < 5; i++) {
        await bookingRepo.save({
          date,
          time,
          name: names[i % names.length],
          phone: `+7 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)}-${String(Math.floor(Math.random() * 90 + 10))}-${String(Math.floor(Math.random() * 90 + 10))}`,
          clinicId: clinic.id,
          status: 'pending'
        });
      }
    }
    
    res.json({ ok: true, message: 'Slot 09:00-09:30 filled for all clinics' });
  });

  // Test: Fill all day
  app.post('/api/admin/test/fill-day', authMiddleware, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const slots = generateSlots('09:00', '18:30', 30);
    
    const clinics = await clinicRepo.find();
    const names = ['Иван Иванов', 'Петр Петров', 'Мария Смирнова', 'Анна Кузнецова', 'Сергей Попов'];
    
    for(const clinic of clinics) {
      for(const time of slots) {
        for(let i = 0; i < 5; i++) {
          await bookingRepo.save({
            date: today,
            time,
            name: names[i % names.length],
            phone: `+7 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)}-${String(Math.floor(Math.random() * 90 + 10))}-${String(Math.floor(Math.random() * 90 + 10))}`,
            clinicId: clinic.id,
            status: 'pending'
          });
        }
      }
    }
    
    res.json({ ok: true, message: 'All slots filled for today' });
  });

  // no block endpoints — only capacity used

  // Fallback to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
  });

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch((err) => {
  console.error('Failed to init data source', err);
  process.exit(1);
});


