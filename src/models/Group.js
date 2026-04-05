import mongoose from 'mongoose'

const groupSchema = new mongoose.Schema({

  groupId: { type: String, required: true, unique: true },

  welcome: { type: Boolean, default: false },
  antilink: { type: Boolean, default: false },
  modoadmin: { type: Boolean, default: false },
  modoadmin: { type: Boolean, default: false },

  // 🧠 warnings por usuario
  antilinkWarnings: {
    type: Object,
    default: {}
  },

  // ⏳ reset 24h
  antilinkResetAt: {
    type: Number,
    default: 0
  }

})

export default mongoose.model('Group', groupSchema)