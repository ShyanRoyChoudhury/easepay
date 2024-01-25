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
        jwt.verify(token, secret, (err, payload)=>{
            if(err){
                return res.status(403).send();
            }
            if (!payload) {
                return res.sendStatus(403);
            }
            if (typeof payload === "string") {
                return res.sendStatus(403);
            }
            req.headers["userId"] =  payload.id;
            next();
        })
        
    }else{
        res.status(403).send({
            message: "token error"
        });
    }
}