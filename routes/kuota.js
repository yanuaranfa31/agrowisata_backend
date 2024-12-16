const express = require('express');
const mongoose = require('mongoose');
const validator = require('validator');
const Kuota = require('../models/Kuota'); // Sesuaikan dengan path model Anda

const router = express.Router();

// GET /kuota
router.get('/', async (req, res) => {
    try {
        const kuotas = await Kuota.find();
        res.json(kuotas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /kuota
router.post('/', async (req, res) => {
    const { tanggal, destinasi, kuota, sisa_kuota } = req.body;

    // Validasi input
    if (!tanggal || !destinasi || !kuota || !sisa_kuota) {
        return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    try {
        const newKuota = new Kuota({ tanggal, destinasi, kuota, sisa_kuota });
        await newKuota.save();
        res.status(201).json(newKuota);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET /kuota/:id
router.get('/:id', async (req, res) => {
    try {
        const kuota = await Kuota.findById(req.params.id);
        if (!kuota) {
            return res.status(404).json({ message: 'Kuota tidak ditemukan' });
        }
        res.json(kuota);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /kuota/:id
router.put('/:id', async (req, res) => {
    try {
        const kuota = await Kuota.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!kuota) {
            return res.status(404).json({ message: 'Kuota tidak ditemukan' });
        }
        res.json(kuota);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE /kuota/:id
router.delete('/:id', async (req, res) => {
    try {
        await Kuota.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;