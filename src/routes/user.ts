import {Router} from 'express'
export const userRouter = Router();
import {z} from 'zod'
import { PrismaClient } from '@prisma/client';
import jwt from "jsonwebtoken"
import { configDotenv } from 'dotenv';
import {generateApiKey} from "generate-api-key"
import { userMiddleware } from '../middlewares/userMiddleware';
configDotenv()
const prisma = new PrismaClient()

const signupSchema = z.object({
    name:z.string().min(4).max(20),
    email:z.string().email(),
    company:z.string().min(3).max(25),
    password:z.string().min(8).max(30)
})
const signinSchema = z.object({
    email:z.string().email(),
    password:z.string().min(8).max(30)
})

userRouter.get('/',async (req,res)=>{
    res.json({
        message:"Reached Bitch"
    })
})

userRouter.post('/signup',async(req,res)=>{
    try{
        const parsedSchema = signupSchema.parse(req.body)
        const {name , email , company , password} = parsedSchema;
        const emailExists = await prisma.user.findFirst({
            where:{
                email
            }
        })
        if(emailExists){
            res.status(303).json({
                message:"User with this email already exists"
            })
            return;
        }
        const companyExists = await prisma.user.findFirst({
            where:{
                company
            }
        })
        if(companyExists){
            res.status(304).json({
                message:"This company is already registered with us."
            })
            return;
        }
        const registerUser = await prisma.user.create({
            data:{
                name,
                email,
                company,
                password
            }
        })
        res.json({
            registerUser
        })
    }catch(e){
        res.status(404).json({
            error:e
        })
    }
})

userRouter.post('/login',async(req,res)=>{
    try{
        const parsedSchema = signinSchema.parse(req.body)
        const {email , password} = parsedSchema;
        const emailExists = await prisma.user.findFirst({
            where:{
                email
            }
        })
        if(!emailExists){
            res.status(303).json({
                message:"User with this email does not exist"
            })
            return;
        }
        const correctCredentials = await prisma.user.findFirst({
            where:{
                email,
                password
            }
        })
        console.log(correctCredentials)
        if(!correctCredentials){
            res.status(304).json({
                message:"Incorrect Password"
            })
            return;
        }
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET not set in environment variables");
        }
        const token = jwt.sign({userId:correctCredentials.id},process.env.JWT_SECRET)
        res.json({
            token
        })
    }catch(e){
        res.status(404).json({
            error:e
        })
    }
})

userRouter.get('/demo',userMiddleware,async(req,res)=>{
    // @ts-ignore
    const userId = req.userId;
    console.log(userId)
    const demoAvailed = await prisma.user.findFirst({
        where:{
            id:userId
        }
    });
    
    if(demoAvailed?.demoAvailed){
        res.status(306).json({
            message:"Demo already availed"
        })
        return
    }
    const availDemo = await prisma.user.update({
        where:{
            id:userId
        },
        data:{
            demoAvailed:true
        }
    });
    const apiKey = generateApiKey()
    const addApiKey = await prisma.user.update({
        where:{
            id:userId
        },
        data:{
            apiKey:apiKey.toString()
        }
    })
    res.json({
        message:apiKey
    })
})


