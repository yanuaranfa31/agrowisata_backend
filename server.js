const express = require('express');
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors'); // Impor cors
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const kuotaRouts = require('./routes/kuota');
const bookingRoutes = require('./routes/booking');
const bookingUserRoutes = require('./routes/bookinguser');
const protect = require('./middleware/authMiddleware');
const isadmin = require('./middleware/adminMiddleware');
const path = require('path');

// Inisialisasi express
const app = express();

// Gunakan middleware CORS
app.use(cors()); // Menambahkan CORS sebagai middleware

// Middleware untuk body parser
app.use(bodyParser.json());

// Koneksi ke MongoDB
connectDB();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Gunakan routing untuk auth
app.use('/api/auth', authRoutes);
app.use('/api/bookings', protect, isadmin, bookingRoutes);
app.use('/api/bookinguser', protect, bookingUserRoutes);
app.use('/api/kuota', kuotaRouts);
app.get('/test', (req, res) => {
  res.send('halo');
});

// Menjalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
