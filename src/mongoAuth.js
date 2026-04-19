import Session from './models/session.js'
import { initAuthCreds, BufferJSON } from '@whiskeysockets/baileys'

export const useMongoAuthState = async () => {

  let session = await Session.findById('auth')

  let creds, keys = {}

  if (!session) {
    console.log('📲 Nueva sesión → QR requerido')

    creds = initAuthCreds()
    keys = {}

    const data = JSON.parse(JSON.stringify({ creds, keys }, BufferJSON.replacer))

    await Session.create({
      _id: 'auth',
      data
    })

  } else {
    const data = JSON.parse(JSON.stringify(session.data), BufferJSON.reviver)
    creds = data.creds
    keys = data.keys || {}
  }

  const saveCreds = async () => {
    const data = JSON.parse(JSON.stringify({ creds, keys }, BufferJSON.replacer))

    await Session.findByIdAndUpdate(
      'auth',
      { data },
      { upsert: true }
    )
  }

  return {
    state: {
      creds,
      keys: {
        get: (type, ids) => {
          const data = keys[type] || {}
          return ids.reduce((acc, id) => {
            if (data[id]) acc[id] = data[id]
            return acc
          }, {})
        },
        set: (data) => {
          for (const type in data) {
            keys[type] = keys[type] || {}
            Object.assign(keys[type], data[type])
          }
        }
      }
    },
    saveCreds
  }
}