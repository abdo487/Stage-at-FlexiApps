import validator from 'validator';
import HttpResponse from '../Helpers/HttpResponse.js';
import ResponseStatus from '../Helpers/ResponseStatus.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../Config/index.js';
import User from '../Models/User.js';
import Database from '../Database.js';

export const validateLoginCredentials = (req, res, next) => {
    const { email, password } = req.body
    if (!email) {
        return res.status(400).json(HttpResponse(ResponseStatus.EMAIL_ERR, "Email is required"));
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json(HttpResponse(ResponseStatus.EMAIL_ERR, "This email is invalid"));
    }
    if (!password) {
        return res.status(400).json(HttpResponse(ResponseStatus.PASSWORD_ERR, "Password is required"));
    }
    next();
}

export const login = async (req, res) => {
    try {
        await Database.getInstance();
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json(HttpResponse(ResponseStatus.USER_ERR, "User not found"));
        if (!user.isPasswordMatch(password)) return res.status(400).json(HttpResponse(ResponseStatus.PASSWORD_ERR, "Password is incorrect"));

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
        user.hashed_password = undefined;
        user.salt = undefined;
        return res.status(200).json(HttpResponse(ResponseStatus.SUCCESS, 'Welcome back!', { user, token }));
    } catch (err) {
        res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
    }
}

export const requireAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ _id: decoded.id });
        if (!user) return res.status(400).json(HttpResponse(ResponseStatus.AUTH_ERR, "Please authenticate"));
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json(HttpResponse(ResponseStatus.AUTH_ERR, "Please authenticate"));
    }
}

export const requireAdminPermissions = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json(HttpResponse(ResponseStatus.AUTH_ERR, "You are not authorized"));
        next();
    } catch (err) {
        res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
    }
}