const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppDataSource } = require('./data-source');
const { In } = require('typeorm');

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

  // Seed admin
  const existing = await adminRepo.findOne({ where: { username: 'admin' } });
  if(!existing){
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    await adminRepo.save({ username: 'admin', passwordHash });
    console.log('Seeded admin user: admin /', password);
  }

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
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'invalid_date' });
    const capacity = 6;
    const slots = generateSlots('09:00', '18:30', 30);
    const activeBookings = await bookingRepo.createQueryBuilder('b')
      .where('b.date = :date', { date })
      .andWhere('b.status IN (:...statuses)', { statuses: ['pending', 'approved'] })
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
    const { date, time, name, phone } = req.body || {};
    if(!date || !time || !name || !phone) return res.status(400).json({ error: 'missing_fields' });
    
    // Validate name (no special characters except spaces, hyphens, apostrophes)
    if(!/^[a-zA-Zа-яА-ЯёЁ\s\-']+$/.test(name)) {
      return res.status(400).json({ error: 'invalid_name' });
    }
    
    // Validate phone (must contain digits and allowed chars)
    if(!/^[\d\s\+\-\(\)]+$/.test(phone) || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'invalid_phone' });
    }
    
    const capacity = 6;
    const count = await bookingRepo.count({ 
      where: { 
        date, 
        time, 
        status: In(['pending', 'approved']) 
      } 
    });
    if(count >= capacity) return res.status(409).json({ error: 'slot_full' });
    const saved = await bookingRepo.save({ date, time, name, phone, status: 'pending' });
    res.status(201).json({ id: saved.id });
  });

  // Admin bookings list
  app.get('/api/admin/bookings', authMiddleware, async (req, res) => {
    const date = (req.query.date || '').toString();
    const where = date ? { date } : {};
    const list = await bookingRepo.find({ where, order: { date: 'ASC', time: 'ASC', createdAt: 'ASC' } });
    res.json({ items: list });
  });

  // Approve booking
  app.patch('/api/admin/bookings/:id/approve', authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const b = await bookingRepo.findOne({ where: { id } });
    if(!b) return res.status(404).json({ error: 'not_found' });
    b.status = 'approved';
    await bookingRepo.save(b);
    res.json({ ok: true });
  });

  // Reject booking
  app.patch('/api/admin/bookings/:id/reject', authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const b = await bookingRepo.findOne({ where: { id } });
    if(!b) return res.status(404).json({ error: 'not_found' });
    b.status = 'rejected';
    await bookingRepo.save(b);
    res.json({ ok: true });
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


