const mongoose = require('mongoose');
const Kuota = require('./Kuota'); // Pastikan path ke Kuota schema sesuai

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
  alamat:{
    type:String,
  },
  kuotaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kuota',
    required: true, // Referencing Kuota schema to relate to a specific destination and date
  },
}, {
  timestamps: true,
});

// Hook to validate kuota availability before saving booking
BookingSchema.pre('save', async function(next) {
  try {
    // Cari kuota berdasarkan kuotaId yang di referensikan
    const kuota = await Kuota.findById(this.kuotaId);
    
    // Pastikan sisa kuota cukup untuk jumlah tiket
    if (this.numberOfTickets > kuota.sisa_kuota) {
      const error = new Error('Jumlah tiket yang dipesan melebihi sisa kuota yang tersedia');
      return next(error);
    }

    // Jika validasi berhasil, lanjutkan ke penyimpanan
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Booking', BookingSchema);
