import { handleReaccion } from '../commands/vs.js'

export async function handleReacciones(sock, msg, from) {
  const reaction = msg.message?.reactionMessage
  if (!reaction) return

  await handleReaccion(sock, msg, from)
}