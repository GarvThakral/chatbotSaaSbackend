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
(0, dotenv_1.configDotenv)();
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
