// 📁 server/src/index.ts - Entry point for the backend server
// 🎯 Core function: Initializes Express server and connects middleware
// 🔗 Key dependencies: express, cors, dotenv
// 💡 Usage: Main entry point for the backend

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import characterRoutes from './routes/characterRoutes';
import adminRoutes from './routes/adminRoutes';
import staticRoutes from './routes/staticRoutes';
import battleRoutes from './routes/battleRoutes';
import { TimeService } from './utils/timeService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/static', staticRoutes);
app.use('/api/battle', battleRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// * Initialize Time Service before starting server
async function startServer() {
  try {
    await TimeService.init();
    console.log('Server time system ready');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize TimeService:', error);
    process.exit(1);
  }
}

startServer();

