import fs from 'fs'
import path from 'path'

const AUTH = './auth'

// SOLO estos archivos son críticos
const KEEP = ['creds.json']

export function cleanAuth() {
  if (!fs.existsSync(AUTH)) return

  const files = fs.readdirSync(AUTH)

  for (const file of files) {
    const filePath = path.join(AUTH, file)

    if (KEEP.includes(file)) continue

    // eliminar basura pesada pero NO sesiones activas
    if (
      file.endsWith('.log') ||
      file.endsWith('.tmp') ||
      file.includes('sender-key') ||
      file.includes('app-state') ||
      file.includes('pre-key')
    ) {
      fs.rmSync(filePath, { recursive: true, force: true })
      console.log('🧹 Clean:', file)
    }
  }
}