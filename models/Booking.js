const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  numberOfTickets: {
    type: Number,
    required: true,
  },
  guideOption: {
    type: Boolean, // Optional guide: true or false
    default: false,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['QRIS', 'Cash'], // Payment method: QRIS or Cash
  },
  qrisProof: {
    type: String, // URL to QRIS proof image or path if uploaded
    required: function () {
      return this.paymentMethod === 'QRIS'; // Required if payment method is QRIS
    },
  },
  totalAmount: {
    type: Number,
    required: true, // Total amount to be paid for the tickets
  },
  status: {
    type: String,
    default: 'Pending', // Status of booking (e.g., Pending, Approved)
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Booking', BookingSchema);
