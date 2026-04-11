import fs from 'fs'

const AUTH = './auth'
const BACKUP = './backup'

export function backupAuth() {
  if (!fs.existsSync(AUTH)) return

  if (!fs.existsSync(BACKUP)) {
    fs.mkdirSync(BACKUP)
  }

  const creds = `${AUTH}/creds.json`

  if (fs.existsSync(creds)) {
    fs.copyFileSync(creds, `${BACKUP}/creds.json`)
    console.log('💾 Backup actualizado')
  }
}