import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

export async function startDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL)
    console.log('🍃 Mongo conectado')
  } catch (err) {
    console.error('❌ Error Mongo:', err)
  }
}