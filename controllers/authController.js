import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import userModel from '../models/userSchema.js'

const generateAccessToken = (user) => {
    return jwt.sign({ userEmail: user.email, isAdmin: user.isAdmin }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
    });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ userEmail: user.email, isAdmin: user.isAdmin }, process.env.REFRESH_TOKEN_SECRET, {
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
            sameSite:'lax',
            path:'/',
            maxAge: 15 * 60 * 1000 
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite:'lax',
            path:'/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        await userModel.findByIdAndUpdate(existingUser._id, {refreshToken});
        return res.status(200).json({ accessToken,existingUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Server error"})
    }
}

export const refreshAccessToken =async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        console.error("Refresh token not found")
        return res.status(401).json({ message: "Refresh token not found" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await userModel.findOne({email:decoded.userEmail});
        if (!user || user.refreshToken !== refreshToken) {
            console.error("Invalid refresh token");
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        const accessToken = generateAccessToken({ email:decoded.userEmail,isAdmin:decoded.isAdmin });
        res.cookie('accessToken',accessToken,{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite:'lax',
            path:'/',
            maxAge: 15 * 60 * 1000 
        })
        res.status(200).json({ accessToken });
    } catch (error) {
        console.error('Error refreshing access token:', error);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

export const getCurrentUser =async (req,res)=>{
    console.log('Cookies received:', req.cookies);
    console.log('Headers:', req.headers);
    let accessToken = req.cookies.accessToken;
    if (!accessToken && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            accessToken = authHeader.substring(7);
        }
    }
    console.log('accessToken from cookies',accessToken);
    if (!accessToken) {
        return res.status(401).json({ message: "Access token not found" });
    }
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded) {
        return res.status(403).json({ message: "Invalid access token" });
    }
    console.log('payload decoded:',decoded);
    const userData = await userModel.findOne({email:decoded.userEmail})
    return res.status(200).json({ user: userData });
}

export const getCurrentUserData = async (req,res)=>{
    try {
        // await userModel.findOne({email:decoded.userEmail})
    } catch (error) {
        console.log('error on fetching the current user data',error);
        return res.status(500).json({ message: "Couldn't fetch the current user data" })
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('accessToken', { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            // sameSite: 'strict' 
        });
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                if (decoded && decoded.userEmail) {
                    await userModel.findOneAndUpdate(
                        { email: decoded.userEmail },
                        { $unset: { refreshToken: "" } }
                    );
                }
            } catch (error) {
                console.log('Error verifying token during logout:', error);
            }
        }
        res.clearCookie('refreshToken', { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            // sameSite: 'strict' 
        });
        
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Error during logout' });
    }
};