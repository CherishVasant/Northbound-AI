import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt, systemPrompt } = await req.json()
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API Key is not configured on the server. Please check your .env file.' },
        { status: 500 }
      )
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/user/preptrack',
        'X-Title': 'PrepTrack Placement Tracker',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[OpenRouter Error]', errText)
      return NextResponse.json(
        { error: `OpenRouter API Error: ${response.status} - ${errText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const replyText = data.choices?.[0]?.message?.content || ''
    
    return NextResponse.json({ text: replyText })
  } catch (error: any) {
    console.error('[API AI Error]', error)
    return NextResponse.json(
      { error: error.message || 'An internal server error occurred while contacting the AI.' },
      { status: 500 }
    )
  }
}
