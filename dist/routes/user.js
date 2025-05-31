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
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
exports.userRouter = (0, express_1.Router)();
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
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
exports.userRouter.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!correctCredentials) {
            res.status(304).json({
                message: "Incorrect Password"
            });
            return;
        }
        res.json({
            token: ""
        });
    }
    catch (e) {
        res.status(404).json({
            error: e
        });
    }
}));
