// File: backend/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { authenticateToken } from './middleware/authMiddleware';
import { authorizeRoles } from './middleware/roleMiddleware';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', authenticateToken, userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Remaining files assumed written into relevant folders (controllers, routes, models)

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});
