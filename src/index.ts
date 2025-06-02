import express from 'express'
import { userRouter } from './routes/user'
import cors from "cors";
const app = express()
app.use(cors())
app.use(express.json())
app.use("/user",userRouter)
app.get("/",async(req,res)=>{
    res.json({
        message:"Seems to be working"
    })
})
app.listen(3000)
