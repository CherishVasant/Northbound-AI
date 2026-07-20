import { NextResponse } from 'next/server'
import { getSystemPrompt } from '@/lib/ai/orchestrator'

export const maxDuration = 60

const MODELS = [
  'google/gemini-2.5-flash',
  'openrouter/free',
]

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: Request) {
  try {
    const { prompt, pageContext, history, generateTitle } = await req.json()
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API Key is not configured on the server. Please check your .env file.' },
        { status: 500 },
      )
    }

    const systemPrompt = getSystemPrompt(pageContext || 'dashboard')

    // Prior turns give the assistant conversational memory. Error bubbles are
    // dropped so a past failure isn't fed back in as if the model had said it.
    const priorTurns = (Array.isArray(history) ? (history as HistoryMessage[]) : [])
      .filter((m) => m?.content && !m.content.startsWith('⚠️'))
      .map((m) => {
        // If content is a structured JSON response, extract only the response text for prior conversation history context.
        let contentText = m.content;
        try {
          if (m.content.startsWith('{') || m.content.includes('"response"')) {
            const parsed = JSON.parse(m.content);
            if (parsed && typeof parsed.response === 'string') {
              contentText = parsed.response;
            }
          }
        } catch {
          // ignore
        }
        return {
          role: m.role === 'user' ? 'user' : 'assistant',
          content: contentText,
        };
      })

    const messages = [
      { role: 'system', content: systemPrompt },
      ...priorTurns,
      { role: 'user', content: prompt },
    ]

    let lastError: string | null = null

    // Generate title in parallel if requested
    let generatedTitle = '';
    if (generateTitle) {
      try {
        const titlePrompt = `Summarize this user request into a short 3-5 word conversation title (do not include quotes, markdown, or punctuation): "${prompt}"`;
        const titleRes = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/user/preptrack',
            'X-Title': 'PrepTrack Title Generator',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: titlePrompt }],
            temperature: 0.1,
            max_tokens: 20,
          }),
        });
        if (titleRes.ok) {
          const titleData = await titleRes.json();
          generatedTitle = (titleData.choices?.[0]?.message?.content || '').trim().replace(/^"(.*)"$/, '$1');
        }
      } catch (e) {
        console.warn('[AI] Failed to generate title:', e);
      }
    }

    for (const model of MODELS) {
      try {
        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/user/northbound-ai',
            'X-Title': 'Northbound AI',
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

        let replyJson: any = null;
        let cleanText = replyText.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(json)?\n/, '').replace(/\n```$/, '').trim();
        }
        try {
          replyJson = JSON.parse(cleanText);
        } catch (e) {
          console.warn('[AI] Failed to parse reply as JSON:', cleanText);
          replyJson = {
            response: replyText,
            action: null
          };
        }

        return NextResponse.json({ ...replyJson, model, title: generatedTitle })
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
