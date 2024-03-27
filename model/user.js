import mongoose from "mongoose";

const UserScheme = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isAdmin: { type: Boolean, default: false },
  isProfilePublic: { type: Boolean, default: true },
  createdAt: {
    type: Date,
    required: true,
    immutable : true,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
});


export default mongoose.model('user' , UserScheme)