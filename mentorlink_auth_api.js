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

// File: backend/models/user.model.ts
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'mentor' | 'mentee';
  bio?: string;
  skills?: string[];
  goals?: string;
}

export const users: User[] = []; // Temporary in-memory storage

export interface MentorshipRequest {
  id: number;
  menteeId: number;
  mentorId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export const requests: MentorshipRequest[] = [];

export interface Session {
  id: number;
  mentorId: number;
  menteeId: number;
  datetime: string;
  feedback?: {
    menteeRating: number;
    menteeComment: string;
    mentorComment?: string;
  };
}

export const sessions: Session[] = [];

// File: backend/controllers/user.controller.ts
import { Request, Response } from 'express';
import { users, requests, sessions } from '../models/user.model';

export const updateProfile = (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { bio, skills, goals } = req.body;
  user.bio = bio;
  user.skills = skills;
  user.goals = goals;
  res.json({ message: 'Profile updated', user });
};

export const getMentors = (req: Request, res: Response) => {
  const { skill } = req.query;
  let mentors = users.filter(u => u.role === 'mentor');
  if (skill) {
    mentors = mentors.filter(m => m.skills?.includes(skill as string));
  }
  res.json(mentors);
};

export const requestMentorship = (req: Request, res: Response) => {
  const { mentorId } = req.body;
  const mentor = users.find(u => u.id === mentorId && u.role === 'mentor');
  if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

  const request = {
    id: requests.length + 1,
    menteeId: req.user.id,
    mentorId,
    status: 'PENDING'
  };
  requests.push(request);
  res.json({ message: `Mentorship request sent to ${mentor.name}`, request });
};

export const viewRequests = (req: Request, res: Response) => {
  if (req.user.role === 'mentor') {
    return res.json(requests.filter(r => r.mentorId === req.user.id));
  } else {
    return res.json(requests.filter(r => r.menteeId === req.user.id));
  }
};

export const respondToRequest = (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // ACCEPTED or REJECTED
  const request = requests.find(r => r.id === parseInt(id) && r.mentorId === req.user.id);
  if (!request) return res.status(404).json({ message: 'Request not found or not yours' });

  request.status = status;
  res.json({ message: `Request ${status.toLowerCase()}`, request });
};

export const bookSession = (req: Request, res: Response) => {
  const { mentorId, datetime } = req.body;
  const matchAccepted = requests.find(
    r => r.mentorId === mentorId && r.menteeId === req.user.id && r.status === 'ACCEPTED'
  );
  if (!matchAccepted) return res.status(400).json({ message: 'No accepted mentorship found' });

  const session = {
    id: sessions.length + 1,
    mentorId,
    menteeId: req.user.id,
    datetime
  };
  sessions.push(session);
  res.json({ message: 'Session booked', session });
};

export const giveFeedback = (req: Request, res: Response) => {
  const { id } = req.params;
  const { menteeRating, menteeComment, mentorComment } = req.body;
  const session = sessions.find(s => s.id === parseInt(id));
  if (!session) return res.status(404).json({ message: 'Session not found' });

  if (req.user.role === 'mentee' && session.menteeId === req.user.id) {
    session.feedback = { menteeRating, menteeComment };
  } else if (req.user.role === 'mentor' && session.mentorId === req.user.id) {
    if (!session.feedback) session.feedback = { menteeRating: 0, menteeComment: '' };
    session.feedback.mentorComment = mentorComment;
  } else {
    return res.status(403).json({ message: 'Not authorized to give feedback for this session' });
  }
  res.json({ message: 'Feedback submitted', session });
};

// File: backend/routes/userRoutes.ts
import { Router } from 'express';
import {
  updateProfile,
  getMentors,
  requestMentorship,
  viewRequests,
  respondToRequest,
  bookSession,
  giveFeedback
} from '../controllers/user.controller';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.put('/me/profile', updateProfile);
router.get('/mentors', authorizeRoles('mentee'), getMentors);
router.post('/requests', authorizeRoles('mentee'), requestMentorship);
router.get('/requests', authorizeRoles('mentor', 'mentee'), viewRequests);
router.put('/requests/:id', authorizeRoles('mentor'), respondToRequest);
router.post('/sessions', authorizeRoles('mentee'), bookSession);
router.put('/sessions/:id/feedback', authorizeRoles('mentor', 'mentee'), giveFeedback);

export default router;
