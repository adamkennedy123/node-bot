const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const qrcode = require('qrcode');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let client;

client = new Client({
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
        ]
    }
});


client.on('qr', async (qr) => {
    console.log('Scan QR dengan WhatsApp');
    await qrcode.toFile('./qr.png', qr);
});

client.on('ready', () => {
    console.log('✅ WhatsApp Web siap digunakan!');
});

client.initialize();


app.post('/kirim', async (req, res) => {
    const { nomor, pesan } = req.body;
    if (!nomor || !pesan) return res.status(400).send('Nomor dan pesan wajib diisi');

    const formatNomor = nomor.includes('@c.us') ? nomor : `${nomor}@c.us`;

    try {
        await client.sendMessage(formatNomor, pesan);
        res.send('Pesan berhasil dikirim!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal mengirim pesan.');
    }
});

app.get('/qr', (req, res) => {
    const path = './qr.png';
    if (fs.existsSync(path)) {
        res.sendFile(__dirname + '/qr.png');
    } else {
        res.status(404).send('QR belum tersedia, tunggu sebentar...');
    }
});

app.listen(port, () => {
    console.log(`🚀 Backend WhatsApp aktif di http://localhost:${port}`);
});
