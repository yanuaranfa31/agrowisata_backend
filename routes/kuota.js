const express = require("express");
const Kuotamodel = require("../models/Kuota");
const router = express.Router();

// Create Booking
router.post("/create_kuota", async (req, res) => {
  try {
    const { tanggal, destinasi, kuota, sisa_kuota } = req.body;
    if (sisa_kuota > kuota) {
      return res.status(400).json({ error: "Sisa kuota tidak boleh lebih besar dari kuota." });
    }

    const booking = new Kuotamodel({ tanggal, destinasi, kuota, sisa_kuota });
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read All Bookings
router.get("/all-kuota", async (req, res) => {
  try {
    const bookings = await Kuotamodel.find();
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read Booking By ID
router.get("/kuota/:id", async (req, res) => {
  try {
    const booking = await Kuotamodel.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking tidak ditemukan." });
    }

    res.status(200).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Booking
router.put("/updated-kuota/:id", async (req, res) => {
  try {
    const { tanggal, destinasi, kuota, sisa_kuota } = req.body;

    if (sisa_kuota > kuota) {
      return res.status(400).json({ error: "Sisa kuota tidak boleh lebih besar dari kuota." });
    }

    const booking = await Kuotamodel.findByIdAndUpdate(
      req.params.id,
      { tanggal, destinasi, kuota, sisa_kuota },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking tidak ditemukan." });
    }

    res.status(200).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Booking
router.delete("/delete/:id", async (req, res) => {
  try {
    const booking = await Kuotamodel.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking tidak ditemukan." });
    }

    res.status(200).json({ message: "Booking berhasil dihapus." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
