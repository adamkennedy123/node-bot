const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

let qrCodeData = '';
let isReady = false;

client.on('qr', (qr) => {
    console.log('QR Code diterima, silakan scan.');
    qrcode.toDataURL(qr, (err, url) => {
        qrCodeData = url;
    });
});

client.on('ready', () => {
    console.log('WhatsApp siap digunakan!');
    isReady = true;
    qrCodeData = ''; // Kosongkan QR setelah berhasil login
});

client.on('auth_failure', (msg) => {
    console.error('Gagal autentikasi', msg);
});

client.on('disconnected', (reason) => {
    console.log('Terputus:', reason);
    isReady = false;
});

client.initialize();

// Endpoint untuk ambil QR Code
app.get('/qr', (req, res) => {
    if (isReady) {
        return res.send('<p>Bot sudah terhubung ke WhatsApp.</p>');
    } else if (qrCodeData) {
        return res.send(`
            <div style="text-align: center;">
                <h2>Scan QR Code</h2>
                <img src="${qrCodeData}" />
            </div>
        `);
    } else {
        return res.send('<p>Menunggu QR Code...</p>');
    }
});

// Endpoint untuk kirim pesan
app.post('/kirim', async (req, res) => {
    const { nomor, pesan } = req.body;

    if (!nomor || !pesan) {
        return res.status(400).json({ status: 'error', message: 'Nomor dan pesan harus diisi.' });
    }

    try {
        await client.sendMessage(nomor, pesan);
        return res.json({ status: 'success', message: 'Pesan berhasil dikirim.' });
    } catch (error) {
        console.error('Error saat mengirim pesan:', error);
        return res.status(500).json({ status: 'error', message: error.toString() });
    }
});

// Jalankan server Express
app.listen(port, () => {
    console.log(`Server bot WhatsApp berjalan di http://localhost:${port}`);
});
