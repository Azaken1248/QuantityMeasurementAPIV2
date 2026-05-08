import express from 'express';
import authController from './controllers/auth.controller.js';

const app = express();

app.use(express.json());

app.post('/api/v1/auth/register', authController.register);

export default app;