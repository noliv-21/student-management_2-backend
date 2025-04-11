import express from 'express';
import { loginVerify, logout} from '../controllers/authController.js';
import { getUsers } from '../controllers/userController.js';

const admin = express.Router();

admin.post('/login',loginVerify);
admin.get('/login',logout);
admin.get('/users',getUsers);
admin.post('/logout',logout);

export default admin;