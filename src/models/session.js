import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  _id: String,
  data: Object
})

export default mongoose.model('Session', sessionSchema)