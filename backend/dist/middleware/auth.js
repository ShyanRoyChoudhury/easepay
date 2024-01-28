"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let secret = process.env.SECRET_KEY;
// export interface reqType extends Request {
//     userId: string;
//   }
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        let token = authHeader.split(' ')[1];
        // @ts-ignore-
        let decoded = jsonwebtoken_1.default.verify(token, secret);
        // @ts-ignore
        if (decoded && decoded.userId) {
            // @ts-ignore
            req.headers['userId'] = decoded.userId;
            // Continue to the next middleware or route handler
            next();
        }
        else {
            res.sendStatus(403);
        }
    }
    else {
        res.status(403).send({
            message: "token error"
        });
    }
};
exports.authenticateJWT = authenticateJWT;
