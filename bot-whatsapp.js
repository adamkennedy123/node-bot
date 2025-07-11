const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises; // pakai promises untuk async
const qrcode = require('qrcode');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inisialisasi client WhatsApp
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
    console.log('📱 Scan QR dengan WhatsApp...');
    await qrcode.toFile('./qr.png', qr);
});

client.on('ready', () => {
    console.log('✅ WhatsApp Web siap digunakan!');
});

client.on('authenticated', () => {
    console.log('🔒 Berhasil terautentikasi.');
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
        return res.status(400).send('Nomor dan pesan wajib diisi.');
    }

    const formatNomor = nomor.includes('@c.us') ? nomor : `${nomor}@c.us`;

    try {
        await client.sendMessage(formatNomor, pesan);
        res.send('✅ Pesan berhasil dikirim!');
    } catch (err) {
        console.error('❌ Gagal kirim pesan:', err);
        res.status(500).send('Gagal mengirim pesan.');
    }
});

// Endpoint tampilkan QR Code
app.get('/qr', async (req, res) => {
    const qrPath = path.join(__dirname, 'qr.png');

    try {
        await fs.access(qrPath); // pastikan file tersedia
        const file = await fs.readFile(qrPath);
        const base64Image = file.toString('base64');
        const dataUrl = `data:image/png;base64,${base64Image}`;

        res.send(`<img src="${dataUrl}" alt="QR Code WhatsApp" width="250" />`);
    } catch (error) {
        console.error('⚠️ QR belum tersedia:', error);
        res.status(404).send('QR belum tersedia, silakan tunggu atau refresh halaman.');
    }
});

// Jalankan server Express
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server WhatsApp bot aktif di http://0.0.0.0:${port}`);
});
