const conversaciones = new Map()

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function preguntarIA(userId, texto) {
  try {
    if (!conversaciones.has(userId)) {
      conversaciones.set(userId, [])
    }

    const historial = conversaciones.get(userId)

    historial.push({ role: "user", content: texto })
    if (historial.length > 10) historial.shift()

    const systemPrompt = "Responde de forma sarcástica, directa y un poco grosera, como un pana fastidiado."

    // 🧠 INTENTO 1 → GROQ (IA PRO)
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b", // 🔥 modelo estable
          messages: [
            { role: "system", content: systemPrompt },
            ...historial
          ]
        })
      })

      const data = await res.json()

      const respuesta = data.choices?.[0]?.message?.content

      if (respuesta) {
        historial.push({ role: "assistant", content: respuesta })
        return respuesta
      }

      throw new Error("Groq sin respuesta")

    } catch (err) {
      console.log("⚠️ Groq falló, usando fallback...")
    }

    // 🟡 FALLBACK → SimSimi
    try {
      const res = await fetch('https://api.simsimi.vn/v2/simtalk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `text=${encodeURIComponent(texto)}&lc=es`
      })

      const data = await res.json()
      return data.message || "No jodas… ni sé qué decir 😑"

    } catch (err) {
      console.log("⚠️ SimSimi también murió...")
    }

    // 🔴 ULTRA FALLBACK
    return "Estoy vivo pero no tengo ganas de pensar 💀"

  } catch (err) {
    console.error("🔥 ERROR IA GENERAL:", err)
    return "Se jodió todo 😑"
  }
}