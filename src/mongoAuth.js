import Session from './models/session.js'
import { initAuthCreds, BufferJSON } from '@whiskeysockets/baileys'

export const useMongoAuthState = async () => {

  const session = await Session.findById('auth')

  let creds, keys = {}

  if (session?.data) {
    const data = JSON.parse(JSON.stringify(session.data), BufferJSON.reviver)
    creds = data.creds
    keys = data.keys || {}
  } else {
    creds = initAuthCreds()
  }

  const saveCreds = async () => {
    const data = JSON.parse(JSON.stringify({ creds, keys }, BufferJSON.replacer))

    await Session.findByIdAndUpdate(
      'auth',
      { data },
      { upsert: true, returnDocument: 'after' }
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