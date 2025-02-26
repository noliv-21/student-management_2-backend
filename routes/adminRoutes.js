import express from 'express';
import { loginVerify, logout, refreshToken } from '../controllers/authController.js';
import { getUsers } from '../controllers/userController.js';

const admin = express.Router();

admin.post('/login',loginVerify);
admin.get('/login',logout);
admin.get('/refresh',refreshToken)
admin.get('/users',getUsers);

export default admin;