const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const qrcode = require('qrcode');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let qrBase64 = null; // tempat simpan base64 QR

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
        ],
    },
});

client.on('qr', async (qr) => {
    console.log('📱 QR baru diterima...');
    qrBase64 = await qrcode.toDataURL(qr); // langsung simpan base64
});

client.on('ready', () => {
    console.log('✅ WhatsApp Web siap digunakan!');
    qrBase64 = null; // reset QR saat sudah login
});

client.on('authenticated', () => {
    console.log('🔒 Autentikasi berhasil.');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Autentikasi gagal:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Terputus:', reason);
});

client.initialize();

// Endpoint kirim pesan
app.post('/kirim', async (req, res) => {
    const { nomor, pesan } = req.body;

    if (!nomor || !pesan) {
        return res.status(400).json({ error: 'Nomor dan pesan wajib diisi.' });
    }

    const formatNomor = nomor.includes('@c.us') ? nomor : `${nomor}@c.us`;

    try {
        await client.sendMessage(formatNomor, pesan);
        res.json({ success: true, message: 'Pesan berhasil dikirim.' });
    } catch (err) {
        console.error('❌ Gagal kirim:', err);
        res.status(500).json({ error: 'Gagal mengirim pesan.' });
    }
});

// Endpoint ambil QR Code base64
app.get('/qr', (req, res) => {
    if (!qrBase64) {
        return res.status(404).json({ error: 'QR belum tersedia.' });
    }

    res.json({ qr: qrBase64 });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server WhatsApp aktif di http://0.0.0.0:${port}`);
});
