"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLoginSignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
const MAX_AGE_MS = 5 * 1000; // 5 seconds
const checkLoginSignature = (signature, timestamp) => {
    const SHARED_SECRET = process.env.JWT_SECRET; // store securely
    if (!SHARED_SECRET) {
        throw new Error('JWT_SECRET not configured');
    }
    const now = Date.now();
    const reqTime = parseInt(timestamp, 10);
    if (isNaN(reqTime)) {
        throw new Error('Invalid timestamp format');
    }
    if (Math.abs(now - reqTime) > MAX_AGE_MS) {
        throw new Error('Timestamp too old or too far in the future');
    }
    const dataToSign = `${timestamp}`;
    const expectedSignature = crypto_1.default
        .createHmac('sha256', SHARED_SECRET)
        .update(dataToSign)
        .digest('hex');
    return expectedSignature === signature;
};
exports.checkLoginSignature = checkLoginSignature;
exports.default = {
    checkLoginSignature: exports.checkLoginSignature
};
//# sourceMappingURL=auth.js.map