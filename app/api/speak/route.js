import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Common female first names — expand as needed
const FEMALE_NAMES = new Set([
  'mary','patricia','jennifer','linda','barbara','elizabeth','susan','jessica','sarah','karen',
  'lisa','nancy','betty','margaret','sandra','ashley','emily','dorothy','kimberly','donna',
  'carol','michelle','amanda','melissa','deborah','stephanie','rebecca','sharon','laura','cynthia',
  'kathleen','amy','angela','shirley','anna','brenda','pamela','emma','nicole','helen',
  'samantha','katherine','christine','debra','rachel','carolyn','janet','catherine','heather','diane',
  'julie','joyce','victoria','kelly','christina','joan','evelyn','lauren','judith','olivia',
  'frances','martha','cheryl','megan','andrea','hannah','jacqueline','ann','gloria','jean',
  'kathryn','alice','teresa','sara','janice','doris','madison','julia','grace','judy',
  'abigail','marie','denise','beverly','amber','theresa','danielle','marilyn','brittany','diana',
  'sophia','brittney','alexis','tiffany','kayla','vanessa','natalie','crystal','brianna','alyssa',
  'stacy','tracy','dawn','april','tara','rebekah','cindy','whitney','miranda','faith',
  'alicia','courtney','molly','brooke','shelby','jenna','jillian','paige','leah','autumn',
  'shannon','chelsea','destiny','skylar','miranda','hailey','kaitlyn','madison','brooklyn','aubrey',
])

function detectVoice(name) {
  if (!name) return 'nova'
  const first = name.trim().split(' ')[0].toLowerCase()
  return FEMALE_NAMES.has(first) ? 'nova' : 'onyx'
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { text, speakerName } = body

    if (!text?.trim()) return Response.json({ error: 'No text' }, { status: 400 })

    // Strip any scoring blocks before sending to TTS
    const clean = text
      .replace(/SIMULATION_COMPLETE[\s\S]*/g, '')
      .replace(/DELIVERY_COMPLETE[\s\S]*/g, '')
      .trim()

    if (!clean) return Response.json({ error: 'No text after cleaning' }, { status: 400 })

    const voice = detectVoice(speakerName)

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: clean,
      speed: 0.95,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())
    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('TTS error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
