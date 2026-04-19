const partidas = {}

export default {
  name: ['tres', 'ttt'],

  async execute({ sock, from, msg, sender }) {

    if (partidas[from]) {
      return sock.sendMessage(from, {
        text: '❌ Ya hay una partida activa.'
      }, { quoted: msg })
    }

    partidas[from] = {
      board: Array(9).fill(null),
      players: [],
      turn: null,
      symbols: {},
      messageKey: null,
      started: false,
      timer: null
    }

    const sent = await sock.sendMessage(from, {
      text: render(partidas[from])
    }, { quoted: msg })

    partidas[from].messageKey = sent.key
  }
}

// ===============================
// 🔥 HANDLER AUTOMÁTICO
// ===============================
export async function autoTresHandler(sock, msg, from) {

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    ''

  const game = partidas[from]
  if (!game) return

  const user = msg.key.participant || msg.key.remoteJid

  // ===============================
  // 🟢 UNIRSE (join)
  // ===============================
  if (text.toLowerCase() === 'join') {

    if (game.players.includes(user)) return

    if (game.players.length >= 2) {
      return sock.sendMessage(from, {
        text: '❌ La partida ya está llena.'
      })
    }

    game.players.push(user)

    // iniciar partida
    if (game.players.length === 2) {
      game.started = true
      game.turn = game.players[0]
      game.symbols[game.players[0]] = '❌'
      game.symbols[game.players[1]] = '⭕'
      startTimer(sock, from, game)
    }

    return actualizar(sock, from, game)
  }

  // ===============================
  // 🎯 SOLO RESPUESTAS AL MENSAJE
  // ===============================
  const context = msg.message?.extendedTextMessage?.contextInfo

  if (!context?.stanzaId) return

  if (context.stanzaId !== game.messageKey.id) return

  if (!/^[1-9]$/.test(text)) return

  if (!game.started) return

  // 🔒 SOLO JUGADORES
  if (!game.players.includes(user)) return

  // ⛔ turno
  if (user !== game.turn) return

  const pos = parseInt(text) - 1
  if (game.board[pos]) return

  game.board[pos] = game.symbols[user]

  clearTimeout(game.timer)

  const win = checkWin(game.board)

  let end = ''

  if (win) {
    end = `\n\n🏆 Ganador: @${user.split('@')[0]}`
    delete partidas[from]
  } else if (!game.board.includes(null)) {
    end = '\n\n🤝 Empate'
    delete partidas[from]
  } else {
    const next = game.players.find(p => p !== user)
    game.turn = next
    startTimer(sock, from, game)
  }

  await actualizar(sock, from, game, end)
}

// ===============================
// ⏱️ TIMER
// ===============================
function startTimer(sock, from, game) {

  game.timer = setTimeout(async () => {

    const loser = game.turn
    const winner = game.players.find(p => p !== loser)

    delete partidas[from]

    await sock.sendMessage(from, {
      text: `⏰ Tiempo agotado\n🏆 Gana: @${winner.split('@')[0]}`,
      mentions: [winner]
    })

  }, 20000)
}

// ===============================
// 🧠 RENDER
// ===============================
function render(game) {

  const b = game.board.map((v, i) => v || `${i + 1}`)

  return `
🎮 *TRES EN RAYA*

${b[0]} | ${b[1]} | ${b[2]}
${b[3]} | ${b[4]} | ${b[5]}
${b[6]} | ${b[7]} | ${b[8]}

${
  !game.started
    ? `👥 Escribe *join* para jugar (${game.players.length}/2)`
    : `🎯 Turno: @${game.turn.split('@')[0]}`
}
`.trim()
}

// ===============================
// 🔄 EDITAR
// ===============================
async function actualizar(sock, from, game, extra = '') {

  const text = render(game) + extra

  try {
    await sock.sendMessage(from, {
      text,
      edit: game.messageKey,
      mentions: game.players
    })
  } catch {
    const msg = await sock.sendMessage(from, {
      text,
      mentions: game.players
    })
    game.messageKey = msg.key
  }
}

// ===============================
// 🏆 WIN
// ===============================
function checkWin(b) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ]

  return combos.some(([a,b1,c]) =>
    b[a] && b[a] === b[b1] && b[a] === b[c]
  )
}

