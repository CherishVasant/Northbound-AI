import { NextResponse } from 'next/server'

/**
 * Vercel caps function duration (10s by default). The fallback chain below can
 * try several models in sequence, so raise the ceiling — and keep the chain
 * short enough that it cannot run past it.
 */
export const maxDuration = 60

/**
 * Ordered fallback chain, ported from the retired Express backend.
 *
 * Deliberately trimmed from the original seven: each failed attempt costs a
 * full round-trip, and seven could exceed the function timeout, turning a
 * degraded-but-working request into a hard failure. Four covers the realistic
 * cases (rate limit, model outage) while staying inside the budget.
 */
const MODELS = [
  'google/gemini-2.5-flash',
  'nvidia/nemotron-nano-9b-v2',
  'openai/gpt-oss-20b',
  'meta-llama/llama-3.3-70b-instruct',
]

/** Overridable so the fallback chain can be exercised against a stub. */
const OPENROUTER_URL =
  process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1/chat/completions'

interface HistoryMessage {
  role?: string
  content?: string
}

export async function POST(req: Request) {
  try {
    const { prompt, systemPrompt, history } = await req.json()
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API Key is not configured on the server. Please check your .env file.' },
        { status: 500 },
      )
    }

    // Prior turns give the assistant conversational memory. Error bubbles are
    // dropped so a past failure isn't fed back in as if the model had said it.
    const priorTurns = (Array.isArray(history) ? (history as HistoryMessage[]) : [])
      .filter((m) => m?.content && !m.content.startsWith('⚠️'))
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content as string,
      }))

    const messages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...priorTurns,
      { role: 'user', content: prompt },
    ]

    let lastError: string | null = null

    for (const model of MODELS) {
      try {
        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/user/preptrack',
            'X-Title': 'PrepTrack Placement Tracker',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.2,
            max_tokens: 1500,
          }),
        })

        if (!response.ok) {
          lastError = `OpenRouter returned HTTP ${response.status}: ${await response.text()}`
          console.warn(`[AI] model ${model} failed: ${lastError}`)
          continue
        }

        const data = await response.json()
        const replyText: string = data.choices?.[0]?.message?.content || ''

        // An empty completion is a failure worth retrying on the next model,
        // not a valid answer to hand back to the user.
        if (!replyText) {
          lastError = `Model ${model} returned an empty completion.`
          console.warn(`[AI] ${lastError}`)
          continue
        }

        return NextResponse.json({ text: replyText, model })
      } catch (err: any) {
        lastError = err?.message ?? String(err)
        console.warn(`[AI] model ${model} threw: ${lastError}`)
      }
    }

    console.error('[AI] every model in the fallback chain failed:', lastError)
    return NextResponse.json(
      { error: lastError ?? 'All model completion attempts failed.' },
      { status: 502 },
    )
  } catch (error: any) {
    console.error('[API AI Error]', error)
    return NextResponse.json(
      { error: error.message || 'An internal server error occurred while contacting the AI.' },
      { status: 500 },
    )
  }
}
