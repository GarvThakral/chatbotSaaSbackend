import { NextFunction } from 'express';
import jwt from 'jsonwebtoken'

// @ts-ignore
export function userMiddleware(req, res, next) {
    const {token} = req.headers;

    if (!token) {
        return res.status(400).json({
            message: "No token provided"
        });
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET not set in environment variables");
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = (verified as any).userId; // You'll want to extend Request type later
        next();
    } catch (e) {
        return res.status(401).json({
            message: "Token invalid or expired"
        });
    }
}