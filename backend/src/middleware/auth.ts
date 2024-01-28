import { NextFunction } from 'express';
import jwt from 'jsonwebtoken';
let secret = process.env.SECRET_KEY;


import { Request, Response } from "express";


// export interface reqType extends Request {
//     userId: string;
//   }

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if(authHeader){
        let token = authHeader.split(' ')[1]
        // @ts-ignore-
        let decoded = jwt.verify(token, secret)
        // @ts-ignore
        if(decoded && decoded.userId){
            // @ts-ignore
            req.headers['userId'] = decoded.userId;

            // Continue to the next middleware or route handler
            next();
        }else{
            res.sendStatus(403);
        }
        
        
    }else{
        res.status(403).send({
            message: "token error"
        });
    }
}