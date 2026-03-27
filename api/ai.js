/**
 * Vercel serverless funktio Claude API:lle.
 * API-avain pysyy serverillä — ei koskaan selaimessa.
 */

const SYSTEM_PROMPT = `
Olet jalkapallon harjoitussuunnitteluassistentti.
Kommunikoi aina suomeksi.

KENTTÄ:
- Koordinaatit: x: 0-800, y: 0-500
- Origo: vasen yläkulma
- Vasen maali: x=0, y=175-325
- Oikea maali: x=800, y=175-325
- Keskiviiva: x=400
- Keskiympyrä: x=400, y=250, säde=75
- Vasen rangaistusalue: x=0-130, y=150-350
- Oikea rangaistusalue: x=670-800, y=150-350

ELEMENTTITYYPIT:
Pelaaja:
{ "type": "player", "x": 400, "y": 250,
  "color": "#2563EB", "number": 1 }
Värit:
  Sininen: #2563EB
  Punainen: #DC2626
  Vihreä: #16A34A
  Maalivahti: #EF9F27

Tötsä: { "type": "cone", "x": 300, "y": 200 }
Keppi: { "type": "pole", "x": 300, "y": 200 }
Pallo: { "type": "ball", "x": 400, "y": 250 }
Rengas: { "type": "ring", "x": 300, "y": 200 }
Mannekiini: { "type": "mannequin", "x": 300, "y": 200 }

Maali: { "type": "goal", "x": 10, "y": 250,
  "side": "left" }

Pienmaali: { "type": "small_goal",
  "x": 400, "y": 150, "rotation": 0 }

Nuoli: { "type": "arrow",
  "x1": 100, "y1": 100,
  "x2": 200, "y2": 150,
  "arrowType": "pass" }
Nuolityypit:
  pass = syöttö (valkoinen)
  move = liike (katkoviiva)
  shot = laukaus (punainen)
  dribble = kuljetus (aaltoviiva)
  curve = kaareva (oranssi)
  both_ways = edestakaisin (sininen)
  without_ball = ilman palloa (violetti)

Vyöhyke: { "type": "zone",
  "x": 200, "y": 150,
  "width": 200, "height": 150 }

SIJOITTELUSÄÄNNÖT:
1. Pelaajien minimietäisyys: 35px
2. Elementit pysyvät: x:25-775, y:25-475
3. Passeliringissä käytä trigonometriaa:
   x = cx + r * cos(i * 2π/n)
   y = cy + r * sin(i * 2π/n)
4. Nuolet alkavat 20px pelaajan reunasta
5. Max 20 elementtiä per harjoite

VASTAUSMUOTO — VAIN JSON, ei muuta tekstiä:
{
  "elements": [...],
  "description": "Lyhyt kuvaus suomeksi",
  "coaching_tip": "Valmentajan vinkki"
}

Jos pyyntö on epäselvä:
{ "clarification": "Kysymys suomeksi" }

ESIMERKKI — passelirinki 6 pelaajaa:
{
  "elements": [
    { "type": "player", "x": 500, "y": 150, "color": "#2563EB", "number": 1 },
    { "type": "player", "x": 587, "y": 200, "color": "#2563EB", "number": 2 },
    { "type": "player", "x": 587, "y": 300, "color": "#2563EB", "number": 3 },
    { "type": "player", "x": 500, "y": 350, "color": "#2563EB", "number": 4 },
    { "type": "player", "x": 413, "y": 300, "color": "#2563EB", "number": 5 },
    { "type": "player", "x": 413, "y": 200, "color": "#2563EB", "number": 6 },
    { "type": "player", "x": 500, "y": 250, "color": "#DC2626", "number": 7 },
    { "type": "cone", "x": 470, "y": 220 },
    { "type": "cone", "x": 530, "y": 220 },
    { "type": "cone", "x": 470, "y": 280 },
    { "type": "cone", "x": 530, "y": 280 },
    { "type": "arrow", "x1": 500, "y1": 168, "x2": 590, "y2": 218, "arrowType": "pass" }
  ],
  "description": "Passelirinki: 6 pelaajaa ringissä, punainen yrittää katkaista.",
  "coaching_tip": "Muistuta pelaajia liikkumaan heti syötön jälkeen."
}
`

/**
 * Vercel serverless handler Claude API -kutsuille.
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  // CORS-headerit
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Salli vain POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Tarkista API-avain
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API-avain puuttuu palvelimelta' })
  }

  try {
    const { message, history } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Viesti puuttuu' })
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        ...(history ?? []),
        { role: 'user', content: message },
      ],
    })

    return res.status(200).json({ content: response.content[0].text })
  } catch (error) {
    console.error('Claude API virhe:', error)
    return res.status(500).json({ error: 'AI-pyyntö epäonnistui — yritä uudelleen' })
  }
}
