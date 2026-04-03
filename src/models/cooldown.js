import mongoose from "mongoose";

const cooldownSchema = new mongoose.Schema({
  user: String,
  group: String,
  command: String,
  expiresAt: Number
});

export default mongoose.model("Cooldown", cooldownSchema);