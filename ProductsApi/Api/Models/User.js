import mongoose from "mongoose";
import bcrypt from "bcrypt";
import CryptoJS from "crypto-js";

const { Schema, models, model } = mongoose;

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    hashed_password: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("hashed_password")) return next();
  this.salt = await bcrypt.genSalt(10);
  this.hashed_password = CryptoJS.SHA256(
    this.hashed_password + this.salt
  ).toString();
  next();
});

// Compare password
userSchema.methods = {
  isPasswordMatch: function (password) {
    return (
      CryptoJS.SHA256(password + this.salt).toString() === this.hashed_password
    );
  },
};

export default models.User || model("User", userSchema);
