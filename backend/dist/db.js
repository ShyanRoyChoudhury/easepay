"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const userSchema = new mongoose_1.default.Schema({
    firstname: String,
    lastname: String,
    username: String,
    password: String
});
mongoose_1.default.connect(`${process.env.DATABASE_URL}`, { dbName: 'paytmdb' });
exports.User = mongoose_1.default.model('User', userSchema);
