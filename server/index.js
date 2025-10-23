// ✅ 1. Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

// ✅ 2. Core & third-party modules
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';

// ✅ 3. Internal modules (AFTER dotenv.config)
import connectToDatabase from './db/db.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/adminRoute.js';
import accountRouter from './routes/accountRoute.js';
import './utils/cloudinary.js'; // ✅ Cloudinary reads environment variables here

// ✅ 4. Connect to the database
connectToDatabase();

// ✅ 5. Initialize Express app
const app = express();

// ✅ 6. Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // ⚠️ Change this to your frontend domain in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// ✅ 7. Socket.IO Handlers
io.on('connection', (socket) => {
  console.log('🔗 User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId.toString());
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// ✅ Export io so controllers can emit real-time events
export { io };

// ✅ 8. Express Middleware
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());

// ✅ 9. API Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/account', accountRouter);

// ✅ 10. Serve Frontend Build (if available)
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  console.error('❌ Frontend build directory not found:', frontendPath);
}

// ✅ 11. Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);



});
