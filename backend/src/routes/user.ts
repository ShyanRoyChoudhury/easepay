import express, { Request, Response } from 'express';
import { User } from '../db'
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { authenticateJWT } from '../middleware/auth';
import prisma from '..';
dotenv.config();


const secret = process.env.SECRET_KEY
const router = express.Router();

const signupInput = z.object({
    username: z.string({
        required_error: "username is required",
        invalid_type_error: "username must be a string"
    }).min(1),
    password: z.string({
        required_error: "password is required",
    }).min(4),
    firstname: z.string({
        required_error: "firstname is required",
        invalid_type_error: "firstname must not contain numbers"
    }).min(1),
    lastname: z.string({
        required_error: "lastname is required",
        invalid_type_error: "lastname must not contain numbers"
    }).min(1)
});

const signinInput = z.object({
    username: z.string({
        required_error: "username is required",
        invalid_type_error: "username must be a string"
    }).min(1),
    password: z.string({
        required_error: "password is required",
    }).min(4)
});

const updateInputType = z.object({
    password: z.string({
        invalid_type_error: "password must be a string"
    }).min(4).optional(),
    firstname: z.string({
        invalid_type_error: "firstname must be a string"
    }).min(1).optional(),
    lastname: z.string({
        invalid_type_error: "lastname must be a string"
    }).min(1).optional()
})

const filterInputType = z.object({
    firstname: z.string({
        invalid_type_error: "firstname must be a string"
    }).optional(),
    lastname: z.string({
        invalid_type_error: "lastname must be a string"
    }).optional()
});

router.post('/signup', async (req: Request, res: Response) => {
    const parsedInput = signupInput.safeParse(req.body);
    if(!parsedInput.success){
        res.status(422).json({
            error: parsedInput.error
        });
        return;
    }
    const username = parsedInput.data.username;
    const password = await bcrypt.hash(req.body.password, 10);
    const firstname = parsedInput.data.firstname;
    const lastname = parsedInput.data.lastname;

    const user = await prisma.users.findUnique({
        where:{
            username: username
        }
    })
    if(user){
        res.json({
            message: "Email already taken / Incorrect inputs"
        })
    }
    else{
        let initialBalance = Math.ceil(Math.random()*100000)
        
        await prisma.$transaction([
            prisma.users.create({
                data:{
                    username,
                    password,
                    firstname,
                    lastname
                }
            }),
            prisma.account.create({
                data:{
                    user:{  connect: { username }},
                    balance: initialBalance
                }
            })
        ]);
        
        res.json({
            message: "User created successfully"
        })
    }
})

router.post('/signin', async (req: Request, res: Response) => {
    let parsedInput = signinInput.safeParse(req.body);
    if(!parsedInput.success){
        return res.status(422).json({
            error: parsedInput.error
        })
    }

    let username = parsedInput.data.username;
    let password = parsedInput.data.password;

    let user = await prisma.users.findUnique({
        where: {
            username
        }
    })
    if(!user){
        return res.json({
            error: "username not found"
        })
    }else{
        let valid = await bcrypt.compare(password, user.password)
        if(!valid){
            return res.status(403).json({
                message: "invalid password"
            });
        }
        // @ts-ignore
        let token = jwt.sign({userId: user.id}, secret, {expiresIn: '1h'});
        return res.json({
            message: 'User logged in successfully',
            token
        })
    }
});

router.put('/', authenticateJWT, async (req: Request, res: Response)=>{
    let parsedInput = updateInputType.safeParse(req.body);
    if(!parsedInput.success){
        return res.status(411).json({
            error: parsedInput.error
        });
    }
    
    let userId = req.headers["userId"];
    let update = await User.findOneAndUpdate({_id: userId}, parsedInput.data)
    
    if(!update){
        res.status(500).json({
            message: "Error while updating information"
        })
    }else{
        res.send({
            message: "Updated successfully"
        });
    }
})

router.get('/bulk', authenticateJWT, async (req: Request, res: Response) => {
    let parsedInput = filterInputType.safeParse(req.body);
    if(!parsedInput.success){
        return res.status(422).send({
            error: parsedInput.error
        });
    }
    let userId = req.headers["userId"];
    let filterData = await prisma.users.findMany({
        where:{
            OR:[
                {firstname: parsedInput.data.firstname},
                {lastname: parsedInput.data.lastname}
            ]
        }
    })
    if(!filterData){
        res.send({
            message: "No users found"
        })
    }else{
        console.log(filterData)
        res.send({
            users: filterData
        })
    }
});

export default router;