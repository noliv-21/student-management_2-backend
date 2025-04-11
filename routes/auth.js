import { Router } from "express";
import { getCurrentUser, refreshAccessToken,getCurrentUserData } from "../controllers/authController.js";

const auth=Router();

auth.post('/refresh-token',refreshAccessToken);
auth.get('/currentUser',getCurrentUser)
auth.get('/currentUserData',getCurrentUserData)

export default auth;