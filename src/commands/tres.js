const partidas = {}

export default {
  name: 'tres',

  async execute({ sock, from, msg }) {

    const sent = await sock.sendMessage(from, {
      text: render(null)
    }, { quoted: msg })

    partidas[from] = {
      players: [],
      turn: 0,
      board: Array(9).fill(null),
      key: sent.key
    }
  }
}

// ❤️ JOIN POR REACCIÓN
export async function handleTres(sock, msg, from) {

  const game = partidas[from]
  if (!game) return

  const reaction = msg.message?.reactionMessage
  if (!reaction) return

  if (reaction.text !== '❤️') return
  if (reaction.key.id !== game.key.id) return

  const user = msg.key.participant || msg.key.remoteJid

  if (game.players.includes(user)) return
  if (game.players.length >= 2) return

  game.players.push(user)

  if (game.players.length === 2) {
    game.turn = 0
  }

  await update(sock, from, game)
}

// 🎮 JUGADA
export async function handleMove(sock, msg, text, from) {

  const game = partidas[from]
  if (!game) return

  if (!msg.message?.extendedTextMessage?.contextInfo?.stanzaId) return

  const replyId = msg.message.extendedTextMessage.contextInfo.stanzaId
  if (replyId !== game.key.id) return

  const user = msg.key.participant || msg.key.remoteJid

  if (!game.players.includes(user)) return

  if (game.players[game.turn] !== user) return

  const pos = parseInt(text) - 1
  if (pos < 0 || pos > 8) return

  if (game.board[pos]) return

  game.board[pos] = game.turn === 0 ? '❌' : '⭕'

  // 🔥 win check
  const win = check(game.board)

  if (win) {
    await sock.sendMessage(from, {
      text: render(game, `${game.board[pos]} GANÓ 🎉`)
    })
    delete partidas[from]
    return
  }

  if (game.board.every(x => x)) {
    await sock.sendMessage(from, {
      text: render(game, 'EMPATE 🤝')
    })
    delete partidas[from]
    return
  }

  game.turn = game.turn === 0 ? 1 : 0

  await update(sock, from, game)
}

// 🧠 RENDER BONITO
function render(game, extra = '') {

  const cell = (i) => game?.board[i] || `${i+1}`

  return `
╭━━━〔 🎮 3 EN RAYA 〕━━━╮

🎯 Jugadores:
${game?.players[0] ? `❌ @${game.players[0].split('@')[0]}` : '❌ vacío'}
${game?.players[1] ? `⭕ @${game.players[1].split('@')[0]}` : '⭕ vacío'}

${game?.players.length === 2 ? `🎲 Turno: ${game.turn === 0 ? '❌' : '⭕'} @${game.players[game.turn].split('@')[0]}` : '❤️ Esperando jugadores...'}

┏━━━┳━━━┳━━━┓
┃ ${cell(0)} ┃ ${cell(1)} ┃ ${cell(2)} ┃
┣━━━╋━━━╋━━━┫
┃ ${cell(3)} ┃ ${cell(4)} ┃ ${cell(5)} ┃
┣━━━╋━━━╋━━━┫
┃ ${cell(6)} ┃ ${cell(7)} ┃ ${cell(8)} ┃
┗━━━┻━━━┻━━━┛

${extra || '❤️ Reacciona para unirte\nResponde con número (1-9)'}
`.trim()
}

// 🔄 UPDATE (EDIT)
async function update(sock, from, game) {

  try {
    await sock.sendMessage(from, {
      text: render(game),
      edit: game.key,
      mentions: game.players
    })
  } catch {
    const m = await sock.sendMessage(from, {
      text: render(game),
      mentions: game.players
    })
    game.key = m.key
  }
}

// 🏆 WIN LOGIC
function check(b) {
  const w = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ]
  return w.some(([a,b1,c]) => b[a] && b[a] === b[b1] && b[a] === b[c])
}