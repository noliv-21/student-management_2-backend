import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import userModel from '../models/userSchema.js'

const generateAccessToken = (user) => {
    return jwt.sign({ user: user, isAdmin: user.isAdmin }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
    });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ user: user }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
    });
};

export const loginVerify = async (req,res)=>{
    try {
        const {username,password,isAdmin} = req.body;
        const existingUser = await userModel.findOne({username,isAdmin});
        if(!existingUser){
            console.log('no existing user');
            return res.status(404).json({message:"No user exists with this username"})
        }
        const passwordMatch= await bcrypt.compare(password,existingUser.password);

        if (!passwordMatch) {
            console.log("password doesn't match");
            return res.status(401).json({ message: "Incorrect password" });
        }

        const accessToken = generateAccessToken(existingUser);
        const refreshToken = generateRefreshToken(existingUser);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite:'strict',
            maxAge: 15 * 60 * 1000 
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        return res.status(200).json({ accessToken,existingUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Server error"})
    }
}

export const refreshToken = (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not found" });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const accessToken = generateAccessToken({ user });
        res.status(200).json({ accessToken });
    });
};

export const getCurrentUser = (req,res)=>{
    const accessToken = req.cookies.accessToken;
    console.log(accessToken);
    if (!accessToken) {
        return res.status(401).json({ message: "Access token not found" });
    }
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid access token" });
        }

        // If the token is valid, you can access the decoded payload
        // Here you can return the user information based on the decoded token
        res.status(200).json({ user: decoded });
    });
}

export const logout = (req, res) => {
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.status(204).send();
};