import express from 'express';
import cors from 'cors'
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient()

import mainRouter from './routes/index'
app.use('/api/v1', mainRouter);
app.listen(PORT, ()=> {
    console.log(`server running on port ${PORT}`)
});

// Handle disconnect when the application is shutting down
process.on('SIGINT', async () =>{
    await prisma.$disconnect();
    process.exit(1);
});

process.on('SIGTERM', async () =>{
    await prisma.$disconnect();
    process.exit();
})

export default prisma;