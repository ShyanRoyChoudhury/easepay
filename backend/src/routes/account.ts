import express, { Request, Response } from "express";
import { authenticateJWT } from "../middleware/auth";
import prisma from "..";
//const prisma = require('@prisma/client');
import { z } from 'zod';

const router = express.Router();

const transferInputType = z.object({
    to: z.string({
        required_error: "Account number field cant be empty",
        invalid_type_error: "To has to be the account number of recipient's account number"
    }).length(24,{
        message: "Account number be exactly of 24 characters"
    }),
    amount: z.number({
        invalid_type_error: "Amount has to be a number",
        required_error: "Amount cant be empty"
    })
})

router.get('/balance', authenticateJWT, async (req: Request, res: Response)=>{
    let userId = req.headers["userId"] as string;
    let data = await prisma.account.findFirst({
        where:{
            userId: userId
            }
    })
    if(!data){
        res.json({
            message: "Error fetching balance"
        })
    }else{
        res.json({
            balance: data.balance
        })
    }
})

router.post('/transfer', authenticateJWT, async (req: Request, res: Response) => {
    let parsedInput = transferInputType.safeParse(req.body);
    if(!parsedInput.success){
        return res.status(422).json({
            error: parsedInput.error
        });
    }

    let userId = req.headers["userId"] as string;
    let owner = await prisma.account.findFirst({
        where: { userId }
    })
    if(!owner || owner.balance < parsedInput.data.amount){
        return res.json({
            message: "Insufficient Balance"
        });
    }
    let recipient = await prisma.account.findFirst({ where : { userId: parsedInput.data.to }})
    if(!recipient){
        return res.status(400).json({message: "Recipient not found. Invalid acoount."});
    }
    let transaction = await prisma.$transaction([
        prisma.account.update({
            where: { userId },
            data: { 
                balance: {
                decrement: parsedInput.data.amount
                }
            }
        }),
        prisma.account.update({
            where: { userId: recipient.userId },
            data:{
                balance: {
                    increment: parsedInput.data.amount
                }
            }
        })
    ]);
    if(!transaction){
        res.status(500).send({
            message: "Transaction failed"
        })
    }else{
        res.json({
            message: "Transfer successful"
        })
    }
})

export default router;