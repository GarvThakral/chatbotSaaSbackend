"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
exports.userRouter = (0, express_1.Router)();
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = require("dotenv");
const generate_api_key_1 = require("generate-api-key");
const userMiddleware_1 = require("../middlewares/userMiddleware");
const twilio_1 = __importDefault(require("twilio"));
(0, dotenv_1.configDotenv)();
const accountSid = process.env.accountSid || "";
const token = process.env.authToken || "";
console.log(accountSid);
console.log(token);
console.log(process.env.TWILIO_VERIFY_SERVICE_SID);
const client = (0, twilio_1.default)(accountSid, token);
const prisma = new client_1.PrismaClient();
const signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(4).max(20),
    email: zod_1.z.string().email(),
    company: zod_1.z.string().min(3).max(25),
    password: zod_1.z.string().min(8).max(30)
});
const signinSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(30)
});
exports.userRouter.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({
        message: "Reached Bitch"
    });
}));
exports.userRouter.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedSchema = signupSchema.parse(req.body);
        const { name, email, company, password } = parsedSchema;
        const emailExists = yield prisma.user.findFirst({
            where: {
                email
            }
        });
        if (emailExists) {
            res.status(303).json({
                message: "User with this email already exists"
            });
            return;
        }
        const companyExists = yield prisma.user.findFirst({
            where: {
                company
            }
        });
        if (companyExists) {
            res.status(304).json({
                message: "This company is already registered with us."
            });
            return;
        }
        const registerUser = yield prisma.user.create({
            data: {
                name,
                email,
                company,
                password
            }
        });
        res.json({
            registerUser
        });
    }
    catch (e) {
        res.status(404).json({
            error: e
        });
    }
}));
exports.userRouter.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedSchema = signinSchema.parse(req.body);
        const { email, password } = parsedSchema;
        const emailExists = yield prisma.user.findFirst({
            where: {
                email
            }
        });
        if (!emailExists) {
            res.status(303).json({
                message: "User with this email does not exist"
            });
            return;
        }
        const correctCredentials = yield prisma.user.findFirst({
            where: {
                email,
                password
            }
        });
        console.log(correctCredentials);
        if (!correctCredentials) {
            res.status(304).json({
                message: "Incorrect Password"
            });
            return;
        }
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET not set in environment variables");
        }
        const token = jsonwebtoken_1.default.sign({ userId: correctCredentials.id }, process.env.JWT_SECRET);
        res.json({
            token
        });
    }
    catch (e) {
        res.status(404).json({
            error: e
        });
    }
}));
exports.userRouter.get('/demo', userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    console.log(userId);
    const demoAvailed = yield prisma.user.findFirst({
        where: {
            id: userId
        }
    });
    if (demoAvailed === null || demoAvailed === void 0 ? void 0 : demoAvailed.demoAvailed) {
        res.status(306).json({
            message: "Demo already availed"
        });
        return;
    }
    const availDemo = yield prisma.user.update({
        where: {
            id: userId
        },
        data: {
            demoAvailed: true
        }
    });
    const apiKey = (0, generate_api_key_1.generateApiKey)();
    const addApiKey = yield prisma.user.update({
        where: {
            id: userId
        },
        data: {
            apiKey: apiKey.toString()
        }
    });
    res.json({
        message: apiKey
    });
}));
exports.userRouter.post('/apiCall', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const { apiKey } = req.body;
    try {
        const userId = yield prisma.user.findFirst({
            where: {
                apiKey
            }
        });
        const apiCall = yield prisma.user.update({
            where: {
                id: userId === null || userId === void 0 ? void 0 : userId.id
            },
            data: {
                apiCalls: {
                    decrement: 1
                },
                apiCallsUsed: {
                    increment: 1
                }
            }
        });
        res.json({
            message: "Api call made by user " + (userId === null || userId === void 0 ? void 0 : userId.id)
        });
    }
    catch (e) {
        res.status(304).json({
            error: e
        });
    }
}));
exports.userRouter.get("/getKey", userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const id = req.userId;
    try {
        const apiKey = yield prisma.user.findFirst({
            where: {
                id
            }
        });
        res.json({
            key: apiKey === null || apiKey === void 0 ? void 0 : apiKey.apiKey
        });
    }
    catch (e) {
        res.status(303).json({
            error: e
        });
    }
}));
exports.userRouter.post('/remainingCalls', userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const { apiKey } = req.body;
    try {
        const validKey = yield prisma.user.findFirst({
            where: {
                apiKey
            }
        });
        if (!validKey) {
            res.status(202).json({
                message: "Invalid Api Key"
            });
            return;
        }
    }
    catch (e) {
        res.status(305).json({
            error: e
        });
        return;
    }
    try {
        const response = yield prisma.user.findFirst({
            where: {
                id: userId
            },
            select: {
                apiCalls: true
            }
        });
        res.json({
            response
        });
        return;
    }
    catch (e) {
        res.status(304).json({
            error: e
        });
        return;
    }
}));
exports.userRouter.get('/details', userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    try {
        const userDetails = yield prisma.user.findFirst({
            where: {
                id: userId
            },
            select: {
                apiCallsUsed: true,
                apiKey: true,
                apiCalls: true,
                name: true,
                email: true,
                company: true,
            }
        });
    }
    catch (e) {
        res.status(500).json({
            error: e
        });
    }
}));
exports.userRouter.post("/check-email", userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const response = yield prisma.user.findFirst({
            where: {
                email
            }
        });
        res.json({
            message: "Email already exists"
        });
    }
    catch (e) {
        res.status(500).json({
            error: e
        });
    }
}));
exports.userRouter.post('/sendOtp', userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber } = req.body;
    try {
        const verification = yield client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications.create({ to: phoneNumber, channel: 'sms' });
        res.status(200).json({ message: 'OTP sent', status: verification.status });
        return;
    }
    catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Failed to send OTP', error: error });
        return;
    }
}));
exports.userRouter.post('/verifyOtp', userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, otp } = req.body;
    try {
        const verificationCheck = yield client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks.create({ to: phoneNumber, code: otp });
        if (verificationCheck.status === 'approved') {
            res.status(200).json({ message: 'OTP verified successfully' });
            return;
        }
        else {
            res.status(400).json({ message: 'Invalid or expired OTP' });
            return;
        }
    }
    catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'OTP verification failed', error: error });
        return;
    }
}));
