import Session from './models/session.js'
import { initAuthCreds, BufferJSON } from '@whiskeysockets/baileys'

export const useMongoAuthState = async () => {

  const session = await Session.findById('auth')

  let creds = initAuthCreds()
  let keys = {}

  if (session?.data) {
    const data = JSON.parse(JSON.stringify(session.data), BufferJSON.reviver)
    creds = data.creds
    keys = data.keys || {}
  }

  const saveCreds = async () => {
    const data = JSON.parse(
      JSON.stringify({ creds, keys }, BufferJSON.replacer)
    )

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
          const result = {}

          for (const id of ids) {
            if (data[id]) result[id] = data[id]
          }

          return result
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