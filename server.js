const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const  protect  = require('./middleware/authMiddleware');
// Mengambil variabel dari .env
dotenv.config();

// Inisialisasi express
const app = express();

// Middleware untuk body parser
app.use(bodyParser.json());

// Koneksi ke MongoDB
connectDB();

// Gunakan routing untuk auth
app.use('/api/auth', authRoutes);
app.use('/api/booking', protect, bookingRoutes);
// Menjalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
