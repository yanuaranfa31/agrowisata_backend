const express = require('express');
const Booking = require('../models/Booking');
const user = require('../models/User')
const router = express.Router();
const validator = require('validator');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const protect = require('../middleware/authMiddleware');
const MAX_TICKETS = 100;
const fs = require('fs');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/qris-proofs'); // Folder untuk menyimpan bukti QRIS
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nama file dengan ekstensi asli
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max file size 5MB
  });
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'raulmahya11@gmail.com', // Replace with your Gmail email
      pass: 'tcjg njnt obkk mswf',   // Replace with your Gmail password (or app password)
    },
  });
  router.post('/upload-qris-proof/:bookingId', protect, upload.single('qrisProof'), async (req, res) => {
    const { bookingId } = req.params;
    const { email } = req.body; // Get email manually from request body
  
    try {
      // Check if the file exists
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
  
      // Find the booking by ID
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
  
      // Validate if the payment method is QRIS
      if (booking.paymentMethod !== 'QRIS') {
        return res.status(400).json({ message: 'Payment method must be QRIS to upload proof' });
      }
  
      // Save QRIS proof path to the booking
      booking.qrisProof = req.file.path;
  
      // Change booking status to 'Pending' after uploading the proof
      booking.status = 'Pending';
  
      // Save the changes to the booking
      await booking.save();
  
      // Check if email is provided in the request body, or fallback to a default email
      const userEmail = email || 'default-email@example.com';  // Replace with a fallback email if needed
  
      if (!userEmail) {
        return res.status(400).json({ message: 'User email is missing' });
      }
  
      // Get sender email from transporter
      const senderEmail = transporter.options.auth.user; // Sender email from transporter config
  
      // Email options
      const mailOptions = {
        from: senderEmail,  // Use sender email from transporter
        to: userEmail,      // Use the email passed in the request body or fallback email
        subject: 'Booking Status Updated - QRIS Proof Uploaded',
        html: `
          <html>
            <body>
              <p>Hi,</p>
              <p>Your booking with ID: <strong>${bookingId}</strong> has been successfully updated.</p>
              <p>The QRIS proof has been uploaded.</p>
              <p><strong>Status:</strong> ${booking.status}</p>
              <p><strong>Nama:</strong> ${email}</p>
              <p><strong>QRIS Proof Path:</strong> ${req.file.path}</p>
              <br />
              <p>If you need any further assistance, feel free to reach out!</p>
              <p><strong>Best regards,</strong><br>Your Service Team</p>
              
              <hr />
              
              <img src="1732944727265.png" alt="Booking Updated" width="400" />
            </body>
          </html>
        `,
      };
  
      // Check the status and send email accordingly
      if (booking.status === 'Approved') {
        // If status is Approved, send approval email
        mailOptions.subject = 'Booking Approved - QRIS Proof Uploaded';
        mailOptions.html = `
          <html>
            <body>
              <p>Hi,</p>
              <p>Your booking with ID: <strong>${bookingId}</strong> has been successfully PENDING.</p>
              <p>The QRIS proof has been uploaded.</p>
              <p><strong>Status:</strong> ${booking.status}</p>
              <p><strong>Nama:</strong> ${email}</p>
              <p><strong>QRIS Proof Path:</strong> ${req.file.path}</p>
              <br />
              <p>If you need any further assistance, feel free to reach out!</p>
              <p><strong>Best regards,</strong><br>Your Service Team</p>
              
              <hr />
              
              <img src="1732944727265.png" alt="Booking Approved" width="400" />
            </body>
          </html>
        `;
      } else if (booking.status === 'Pending') {
        // If status is Pending, send pending email (or you can adjust the message as needed)
        mailOptions.subject = 'Booking Pending - QRIS Proof Uploaded';
        mailOptions.html = `
          <html>
            <body>
              <p>Hi,</p>
              <p>Your booking with ID: <strong>${bookingId}</strong> has been successfully uploaded with the QRIS proof.</p>
              <p><strong>Status:</strong> ${booking.status}</p>
              <p><strong>Nama:</strong> ${email}</p>
              <p><strong>QRIS Proof Path:</strong> ${req.file.path}</p>
              <br />
              <p>Your booking is now pending approval. We will notify you once the status changes.</p>
              <p><strong>Best regards,</strong><br>Your Service Team</p>
              
              <hr />
              
              <img src="1732944727265.png" alt="Booking Pending" width="400" />
            </body>
          </html>
        `;
      }
  
      // Send email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log('Error sending email: ', error);
        }
        console.log('Email sent: ' + info.response);
      });
  
      // Return success response
      res.status(200).json({
        message: 'QRIS proof uploaded successfully and booking status updated',
        qrisProofPath: req.file.path,
        status: booking.status,  // Return updated status
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  
router.post('/book-ticket', async (req, res) => {
  const { fullName, phoneNumber, numberOfTickets, guideOption, paymentMethod, qrisProof } = req.body;

  // Validasi input
  if (!fullName || !phoneNumber || !numberOfTickets || !paymentMethod) {
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
    // Membuat booking baru
    const booking = new Booking({
      fullName,
      phoneNumber,
      numberOfTickets,
      guideOption,
      paymentMethod,
      qrisProof,
      totalAmount,
    });

    // Menyimpan pemesanan ke database
    await booking.save();

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
router.get('/generate-qr/:bookingId', async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.paymentMethod !== 'Cash') {
      return res.status(400).json({ message: 'Payment method must be cash to generate QR' });
    }

    // Generate QR Code (misalnya menggunakan library 'qrcode')
    const QRCode = require('qrcode');
    const qrData = `Amount to pay: ${booking.totalAmount} IDR`;

    QRCode.toDataURL(qrData, (err, qrCode) => {
      if (err) {
        return res.status(500).json({ message: 'Error generating QR code' });
      }
      res.status(200).json({ qrCode });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/check-availability', async (req, res) => {
    try {
      // Hitung jumlah tiket yang sudah terpesan
      const totalTicketsBooked = await Booking.aggregate([
        { $group: { _id: null, totalBooked: { $sum: '$numberOfTickets' } } },
      ]);
  
      const ticketsBooked = totalTicketsBooked.length > 0 ? totalTicketsBooked[0].totalBooked : 0;
      const availableTickets = MAX_TICKETS - ticketsBooked;
  
      res.status(200).json({
        availableTickets,
        totalTicketsBooked: ticketsBooked,
        maxTickets: MAX_TICKETS,
        message: `Currently, there are ${availableTickets} tickets available.`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
// Route to approve or reject a booking
router.post('/approve-reject-booking/:bookingId', protect, async (req, res) => {
    const { bookingId } = req.params;
    const { action, email } = req.body;  // action can be 'approve' or 'reject' and email from the body
    
    try {
      // Find the booking by ID
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
  
      // Validate the action
      if (action !== 'approve' && action !== 'reject') {
        return res.status(400).json({ message: 'Invalid action. Must be either "approve" or "reject".' });
      }
  
      // Update the booking status
      booking.status = action === 'approve' ? 'Approved' : 'Rejected';
  
      // Save the changes
      await booking.save();
  
      // If the action is "approve", send email
      if (booking.status === 'Approved') {
        // Ensure email is passed in the request body, if not provide a fallback email
        const userEmail = email || 'default-email@example.com';  // Replace with a fallback email if needed
  
        if (!userEmail) {
          return res.status(400).json({ message: 'User email is missing' });
        }
  
        // Get sender email from transporter configuration
        const senderEmail = transporter.options.auth.user;  // Sender email from transporter config
  
        // Email options
        const mailOptions = {
          from: senderEmail,  // Sender email from transporter
          to: userEmail,      // Recipient email
          subject: 'Booking Status Updated - QRIS Proof Uploaded',
          html: `
            <html>
              <body>
                <p>Hi,</p>
                <p>Your booking with ID: <strong>${bookingId}</strong> has been successfully approved.</p>
                <p>The QRIS proof has been uploaded.</p>
                <p><strong>Status:</strong> ${booking.status}</p>
                <p><strong>Name:</strong> ${booking.fullName}</p>  <!-- Using full name from the booking object -->
                <br />
                <p>If you need any further assistance, feel free to reach out!</p>
                <p><strong>Best regards,</strong><br>Your Service Team</p>
                
                <hr />
                
                <img src="1732944727265.png" alt="Booking Updated" width="400" />
              </body>
            </html>
          `,
        };
  
        // Send email after approval
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log('Error sending email:', error);
            return res.status(500).json({ message: 'Failed to send email', error: error.message });
          }
          console.log('Approval email sent:', info.response);
        });
      }
  
      // Respond with a success message
      res.status(200).json({
        message: `Booking ${action}d successfully`,
        status: booking.status,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  // Route to get all bookings
router.get('/all-bookings', protect, async (req, res) => {
    try {
      // Fetch all bookings from the database
      const bookings = await Booking.find();
  
      if (bookings.length === 0) {
        return res.status(404).json({ message: 'No bookings found' });
      }
  
      // Return the list of bookings
      res.status(200).json({
        message: 'All bookings retrieved successfully',
        bookings: bookings,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  
  // Route to delete a booking by ID
router.delete('/delete-booking/:bookingId', protect, async (req, res) => {
    const { bookingId } = req.params;
  
    try {
      // Find the booking by ID and delete it
      const booking = await Booking.findByIdAndDelete(bookingId);
  console.log(booking)
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
  
      // Return a success message after deletion
      res.status(200).json({
        message: `Booking with ID: ${bookingId} has been deleted successfully`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  
module.exports = router;