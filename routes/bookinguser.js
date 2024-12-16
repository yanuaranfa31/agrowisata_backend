const express = require('express');
const multer = require('multer');
const validator = require('validator');
const Kuota = require('../models/Kuota'); // Assume Kuota model is imported
const Booking = require('../models/Booking'); // Assume Booking model is imported
const authMiddleware = require('../middleware/authMiddleware');
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

// POST route to book ticket
router.post('/book-ticket', authMiddleware, upload.single('qrisProof'), async (req, res) => {
  const { fullName, email, phoneNumber, numberOfTickets, guideOption, paymentMethod, kuotaId } = req.body;
  const qrisProof = req.file ? req.file.path : null; // Access the uploaded file (QRIS proof)

  // Validate input fields
  if (!fullName || !phoneNumber || !numberOfTickets || !paymentMethod || !kuotaId) {
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
      email,
      phoneNumber,
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
      departureDate: kuota.tanggal, // Example: Add departure date dynamically from Kuota
      localTourists: numberOfTickets,
      totalPayment: totalAmount,
    };

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

module.exports = router;
