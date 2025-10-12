// print_website_scaffold/backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// مجلد الواجهة
const FRONTEND_DIR = path.join(__dirname, '..');
app.use(express.static(FRONTEND_DIR));

// توجيه "/" لindex.html
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// مجلد رفع الملفات
const UPLOADS_DIR = path.join(FRONTEND_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e6);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

// ملف الطلبات
const ORDERS_FILE = path.join(FRONTEND_DIR, 'orders.json');
function readOrders(){
  try {
    const raw = fs.readFileSync(ORDERS_FILE,'utf8');
    return JSON.parse(raw || '[]');
  } catch(e){
    return [];
  }
}
function saveOrders(arr){
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(arr, null, 2));
}

// رفع ملف
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'محتاج ملف PDF' });
    const { paperSize = '', printType = '', packaging = '', delivery = '' } = req.body;
    const orders = readOrders();
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase().slice(-6);
    const newOrder = {
      orderId,
      filename: req.file.filename,
      origName: req.file.originalname,
      paperSize,
      printType,
      packaging,
      delivery,
      status: 'جديد',
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    saveOrders(orders);
    res.json({ ok:true, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ بالخادم' });
  }
});

// جلب الطلبات
app.get('/api/orders', (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server listening on http://localhost:${PORT}`));
