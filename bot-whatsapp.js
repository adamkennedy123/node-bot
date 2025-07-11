const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises; // gunakan promises untuk async/await
const qrcode = require('qrcode');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inisialisasi WhatsApp Client
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
  console.log('Scan QR dengan WhatsApp...');
  await qrcode.toFile('./qr.png', qr); // Simpan QR ke file
});

client.on('ready', () => {
  console.log('✓ WhatsApp Web siap digunakan!');
});

client.initialize();

// Endpoint kirim pesan
app.post('/kirim', async (req, res) => {
  const { nomor, pesan } = req.body;

  if (!nomor || !pesan) {
    return res.status(400).send('Nomor dan pesan wajib diisi');
  }

  const formatNomor = nomor.includes('@c.us') ? nomor : `${nomor}@c.us`;

  try {
    await client.sendMessage(formatNomor, pesan);
    res.send('Pesan berhasil dikirim!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Gagal mengirim pesan.');
  }
});

// Endpoint tampilkan QR Code
app.get('/qr', async (req, res) => {
  const qrPath = path.join(__dirname, 'qr.png');

  try {
    // Cek apakah file ada
    await fs.access(qrPath);

    const file = await fs.readFile(qrPath);
    const base64Image = file.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // Kirim tag img ke client
    res.send(`<img src="${dataUrl}" alt="QR Code" width="250">`);
  } catch (error) {
    console.error('Gagal membaca QR code:', error);
    res.status(404).send('QR belum tersedia, tunggu sebentar atau refresh halaman.');
  }
});

// Jalankan server
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Backend WhatsApp aktif di http://0.0.0.0:${port}`);
});
