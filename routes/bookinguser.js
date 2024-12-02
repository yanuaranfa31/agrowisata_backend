
const express = require('express');
const Booking = require('../models/Booking');
const router = express.Router();
const validator = require('validator');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const protect = require('../middleware/authMiddleware');
const MAX_TICKETS = 100;
const Kuota = require('../models/Kuota');
const fs = require('fs');

router.post('/book-ticket', async (req, res) => {
    const { fullName, phoneNumber, numberOfTickets, guideOption, paymentMethod, qrisProof, kuotaId } = req.body;
  
    // Validasi input
    if (!fullName || !phoneNumber || !numberOfTickets || !paymentMethod || !kuotaId) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }
  
    if (!validator.isMobilePhone(phoneNumber, 'any', { strictMode: false })) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }
  
    if (numberOfTickets <= 0) {
      return res.status(400).json({ message: 'Number of tickets must be greater than 0' });
    }
  
    // Menghitung total biaya tiket
    const ticketPrice = 100000; // Contoh harga per tiket, bisa diubah sesuai kebutuhan
    const totalAmount = ticketPrice * numberOfTickets;
  
    // Memvalidasi pembayaran QRIS (hanya jika memilih metode QRIS)
    if (paymentMethod === 'QRIS' && !qrisProof) {
      return res.status(400).json({ message: 'Please upload proof of QRIS payment' });
    }
  
    try {
      // Cari kuota berdasarkan kuotaId
      const kuota = await Kuota.findById(kuotaId);
      if (!kuota) {
        return res.status(404).json({ message: 'Kuota not found' });
      }
  
      // Pastikan kuota cukup untuk tiket yang dipesan
      if (numberOfTickets > kuota.sisa_kuota) {
        return res.status(400).json({ message: 'Not enough quota available for this booking' });
      }
  
      // Membuat booking baru
      const booking = new Booking({
        fullName,
        phoneNumber,
        numberOfTickets,
        guideOption,
        paymentMethod,
        qrisProof,
        totalAmount,
        kuotaId, // Menghubungkan booking dengan kuota
      });
  
      // Menyimpan pemesanan ke database
      await booking.save();
  
      // Mengurangi kuota setelah booking berhasil
      kuota.sisa_kuota -= numberOfTickets;
      await kuota.save();  // Menyimpan perubahan pada kuota
  
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
