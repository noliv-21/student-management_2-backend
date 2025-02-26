import userModel from '../models/userSchema.js';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';

export const getUsers = async (req, res) => {
    try {
        const users = await userModel.find({ isAdmin: false });
        res.status(200).json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Couldn't get users" });
    }
}

export const createUser = async (req, res) => {
    try {
        const user = req.body;
        const newUser = await userModel.create({
            username: user.username,
            email: user.email,
            password: await bcrypt.hash(user.password, 10),
        });
        res.status(201).json(newUser);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Couldn't create user" });
    }
}

export const deleteUser = async (req, res) => {
    try {
        const email = req.params.email;

        const result = await userModel.deleteOne({ email });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log('user deleted');
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Couldn't delete the user" })
    }
}

export const editUser = async (req, res) => {
    try {
        const { username, email } = req.body;
        const updatedUser = await userModel.findOneAndUpdate(
            { email },
            { username },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log('user updated');
        res.status(200).json(updatedUser);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Couldn't update the user" })
    }
}

export const updateProfile = async (req,res)=>{
    try {
        const {profileImage, email} = req.body;
        await userModel.findOneAndUpdate({email},{$set:{profileImage}})
        res.status(200).json({ message: "Image updated successfully"})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Couldn't update the profile"})
    }
}