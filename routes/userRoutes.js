import express from 'express';
import {getUsers,createUser,deleteUser,editUser, updateProfile} from '../controllers/userController.js';
import { loginVerify, logout, getCurrentUser } from '../controllers/authController.js';

const user = express.Router();

user.get('/', getUsers);
user.post('/', createUser);
user.delete('/:email', deleteUser);
user.patch('/edit',editUser);
user.post('/login',loginVerify)
user.get('/logout',logout);
// user.get('/currentUser',getCurrentUser);
user.patch('/uploadImage',updateProfile)
user.post('/logout',logout);

export default user;