const mongoose = require('mongoose');

const KuotaSchema = new mongoose.Schema({
  tanggal: {
    type: Date,
    required: true,
  },
  destinasi: {
    type: String,
    required: true,
    trim: true, // Menghapus spasi di awal/akhir
  },
  kuota: {
    type: Number,
    required: true,
    min: [1, 'Kuota minimal adalah 1'], // Validasi minimal kuota
  },
  sisa_kuota: {
    type: Number,
    required: true,
  },
});

// Middleware untuk memastikan `tanggal` selalu dalam format ISO
KuotaSchema.pre('save', function (next) {
  this.tanggal = new Date(this.tanggal);
  next();
});

module.exports = mongoose.model('Kuota', KuotaSchema);
