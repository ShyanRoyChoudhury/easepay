import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config();

const userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    username: String,
    password: String
});

mongoose.connect(`${process.env.DATABASE_URL}`, {dbName: 'paytmdb'})
export const User = mongoose.model('User', userSchema);