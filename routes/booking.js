const express = require('express');
const validator = require('validator');
const Booking = require('../models/Booking');
const Kuota = require('../models/Kuota');
const adminMiddleware = require('../middleware/adminMiddleware');
const multer = require('multer');
const { sendBookingTicketEmail } = require('../services/mail');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Set upload directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware untuk validasi data booking
const validateBookingData = (req, res, next) => {
  const { fullName, phoneNumber, email, numberOfTickets, paymentMethod, qrisProof, kuotaId } = req.body;

  // Validasi sederhana
  if (!fullName || !phoneNumber || !email || !numberOfTickets || !paymentMethod || !kuotaId) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  // Validasi tambahan (sesuaikan dengan kebutuhan Anda)
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Email tidak valid' });
  }

  if (paymentMethod === 'QRIS' && !qrisProof) {
    return res.status(400).json({ message: 'Bukti pembayaran QRIS wajib diunggah' });
  }

  next();
};

// GET /bookings
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /bookings
router.post('/', adminMiddleware, validateBookingData, upload.single('qrisProof'), async (req, res) => {
  const { fullName, phoneNumber, email, numberOfTickets, guideOption, paymentMethod, kuotaId } = req.body;
  const qrisProof = req.file ? req.file.path : null; // Access the uploaded file (QRIS proof)

  // Validate input fields
  if (!fullName || !phoneNumber || !email || !numberOfTickets || !paymentMethod || !kuotaId) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }

  if (!validator.isMobilePhone(phoneNumber, 'any', { strictMode: false })) {
    return res.status(400).json({ message: 'Invalid phone number format' });
  }

  if (numberOfTickets <= 0) {
    return res.status(400).json({ message: 'Number of tickets must be greater than 0' });
  }

  // Calculate the total cost of tickets
  const ticketPrice = 100000; // Example ticket price, adjust as needed
  const totalAmount = ticketPrice * numberOfTickets;

  // Validate QRIS payment (only if QRIS is selected as payment method)
  if (paymentMethod === 'QRIS' && !qrisProof) {
    return res.status(400).json({ message: 'Please upload proof of QRIS payment' });
  }

  try {
    // Fetch quota based on kuotaId
    const kuota = await Kuota.findById(kuotaId);
    if (!kuota) {
      return res.status(404).json({ message: 'Kuota not found' });
    }

    // Ensure enough quota is available for the requested number of tickets
    if (numberOfTickets > kuota.sisa_kuota) {
      return res.status(400).json({ message: 'Not enough quota available for this booking' });
    }

    // Create a new booking
    const booking = new Booking({
      fullName,
      phoneNumber,
      email,
      numberOfTickets,
      guideOption,
      paymentMethod,
      qrisProof, // Save the file path for QRIS proof
      totalAmount,
      kuotaId, // Link booking to the specific quota
    });

    // Save the booking to the database
    await booking.save();

    // Reduce the quota after the successful booking
    kuota.sisa_kuota -= numberOfTickets;
    await kuota.save();

    const data = {
      fullName,
      phoneNumber,
      email,
      departureDate: kuota.tanggal_keberangkatan, // Example: Add departure date dynamically from Kuota
      localTourists: numberOfTickets,
      totalPayment: totalAmount,
    };

    await sendBookingTicketEmail(email, data);

    res.status(201).json({
      message: 'Booking successful',
      bookingId: booking._id,
      totalAmount,
      status: booking.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /bookings/:id
router.get('/:id', adminMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /bookings/:id
router.put('/:id', adminMiddleware, validateBookingData, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /bookings/:id
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /bookings/{id}/approve
router.put('/:id/approve', adminMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: 'Approved' }, { new: true });
    if (!booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /bookings/{id}/reject
router.put('/:id/reject', adminMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: 'Rejected' }, { new: true });
    if (!booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
