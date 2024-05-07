import { Router } from "express";
import { login, validateLoginCredentials } from "../Controllers/Auth.js";

const Auth = Router();

Auth.post("/login", validateLoginCredentials, login);

export default Auth;
