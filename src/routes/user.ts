import {Router} from 'express'
export const userRouter = Router();
import {z} from 'zod'
import { PrismaClient } from '@prisma/client';
import jwt from "jsonwebtoken"
import { configDotenv } from 'dotenv';
import {generateApiKey} from "generate-api-key"
import { userMiddleware } from '../middlewares/userMiddleware';
import twilio  from 'twilio';

configDotenv()

const accountSid: string = process.env.accountSid || "";
const token: string = process.env.authToken || "";
console.log(accountSid)
console.log(token)
console.log(process.env.TWILIO_VERIFY_SERVICE_SID)
const client = twilio(accountSid, token);

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

userRouter.post('/apiCall',async (req,res)=>{
    console.log(req.body)
    const {apiKey} = req.body;

    try{
        const userId = await prisma.user.findFirst({
            where:{
                apiKey
            }
        });
        const apiCall = await prisma.user.update({
            where:{
                id:userId?.id
            },
            data:{
                apiCalls:{
                    decrement:1
                },
                apiCallsUsed:{
                    increment:1
                }
            }
        });
        res.json({
            message:"Api call made by user " + userId?.id
        })
    }catch(e){
        res.status(304).json({
            error:e
        })
    }

    
})

userRouter.get("/getKey",userMiddleware,async (req,res)=>{
    // @ts-ignore
    const id = req.userId
    try{
        const apiKey = await prisma.user.findFirst({
            where:{
                id
            }
        })
        res.json({
            key:apiKey?.apiKey
        })
    }catch(e){
        res.status(303).json({
            error:e
        })
    }
})

userRouter.post('/remainingCalls',userMiddleware,async (req,res)=>{
    // @ts-ignore
    const userId = req.userId;
    const {apiKey} = req.body;
    try{
        const validKey = await prisma.user.findFirst({
            where:{
                apiKey
            }
        })
        if(!validKey){
            res.status(202).json({
                message:"Invalid Api Key"
            })
            return
        } 
    }catch(e){
        res.status(305).json({
            error:e
        })
        return

    }
    try{
        const response = await prisma.user.findFirst({
            where:{
                id:userId
            },
            select:{
                apiCalls:true
            }
        })
        res.json({
            response
        });
        return

    }catch(e){
        res.status(304).json({
            error:e
        })
            return

    }
})

userRouter.get('/details',userMiddleware,async(req,res)=>{
    //@ts-ignore
    const userId = req.userId
    try{
        const userDetails = await prisma.user.findFirst({
            where:{
                id:userId
            },
            select:{
                apiCallsUsed:true,
                apiKey:true,
                apiCalls:true,
                name:true,
                email:true,
                company:true,
                
            }
        })
    }catch(e){
        res.status(500).json({
            error:e
        })
    }
})

userRouter.post("/check-email",userMiddleware,async(req,res)=>{
    const {email} = req.body;
    try{
        const response = await prisma.user.findFirst({
            where:{
                email
            }
        })
        res.json({
            message:"Email already exists"
        })
    }catch(e){
        res.status(500).json({
            error:e
        })
    }
})

userRouter.post('/sendOtp', userMiddleware, async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    res.status(200).json({ message: 'OTP sent', status: verification.status });
    return
} catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error });
    return 
    }
});

userRouter.post('/verifyOtp', userMiddleware, async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    const verificationCheck = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: phoneNumber, code: otp });

    if (verificationCheck.status === 'approved') {
      res.status(200).json({ message: 'OTP verified successfully' });
      return  
    } else {
      res.status(400).json({ message: 'Invalid or expired OTP' });
        return 
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'OTP verification failed', error: error });
    return 
}
});
