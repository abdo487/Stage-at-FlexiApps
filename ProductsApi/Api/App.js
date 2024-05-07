import express from "express";
import cors from "cors";
import User from "./Models/User.js";
import Database from "./Database.js";

// Setting up the express App
const App = express();

try {
  await Database.getInstance();
  let admin = await User.findOne({ email: "admin@admin.com" });
  if (!admin) {
    console.log("no admin");
    admin = await User.create({
      fullname: "Admin",
      email: "admin@admin.com",
      hashed_password: "admin",
      role: "admin",
    });
    const user = await User.create({
      fullname: "User",
      email: "user@user.com",
      hashed_password: "user",
      role: "user",
    });
  }
} catch (err) {
  console.log(err.message);
}

// Setting the corsOptions
const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
App.use(cors(corsOptions));

App.use(express.json());

// Importing the routes
import Auth from "./Routes/Auth.js";
import Products from "./Routes/Products.js";

// Setting up the routes
App.use("/api/auth", Auth);
App.use("/api/products", Products);

export default App;
