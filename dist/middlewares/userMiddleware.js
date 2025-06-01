"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = userMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// @ts-ignore
function userMiddleware(req, res, next) {
    const { token } = req.headers;
    if (!token) {
        return res.status(400).json({
            message: "No token provided"
        });
    }
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET not set in environment variables");
    }
    try {
        const verified = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userId = verified.userId; // You'll want to extend Request type later
        next();
    }
    catch (e) {
        return res.status(401).json({
            message: "Token invalid or expired"
        });
    }
}
