import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Clean and sanitize event titles to ensure they NEVER contain prompt filler words
function cleanEventTitle(rawTitle: string, rawPrompt: string): string {
  const p = (rawPrompt || '').trim();

  // 1. If explicit "named X" or "called X" is present in user prompt (e.g. "named TechRush", "called CodeSprint")
  const explicitMatch = p.match(/(?:named|called|titled)\s+["']?([A-Za-z0-9_\-\s]{2,35}?)["']?(?=\s+(?:on|at|in|with|fee|for|by|held|dated|\d|$))/i);
  if (explicitMatch && explicitMatch[1]) {
    const title = explicitMatch[1].trim();
    return title.split(/\s+/).slice(0, 5).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  let cleaned = (rawTitle || '').trim();
  if (!cleaned || cleaned.toLowerCase().startsWith('create') || cleaned.toLowerCase().startsWith('conduct') || cleaned.toLowerCase().startsWith('n by')) {
    cleaned = p;
  }

  // Strip quotes or code block wrappers
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '');

  // 2. Remove leading command words using STRICT word boundaries \b
  cleaned = cleaned.replace(/^\b(?:create|generate|conduct|organize|host|plan|arrange)\b\s*/i, '');
  cleaned = cleaned.replace(/^\b(?:a|an|the)\b\s*/i, '');
  cleaned = cleaned.replace(/^(?:24-hour|24\s*hr|48-hour|national|state|college)?\s*(?:hackathon|workshop|contest|event|competition)\s+\b(?:called|named)\b\s+/i, '');
  cleaned = cleaned.replace(/^\b(?:called|named)\b\s+/i, '');

  // 3. Remove trailing date, time, venue, fee, team details
  cleaned = cleaned.replace(/\s+\b(?:on|at|in|from|with|fee|for|held|dated)\b\s+.*$/i, '');
  cleaned = cleaned.replace(/\s+\b(?:10\s*AM|12\s*PM|24\s*hour|team\s*of|fee)\b.*$/i, '');

  // Strip leading 'by' or filler
  cleaned = cleaned.replace(/^\b(?:by)\b\s*/i, '');

  if (!cleaned || cleaned.length < 2) {
    cleaned = 'Campus Tech Event';
  }

  // Capitalize properly, max 2-5 words
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { feature, prompt, context } = body;

    const userPrompt = (prompt || '').trim();

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    const systemInstruction = `You are an elite AI Event Copilot for EventHub, an enterprise campus event management platform.
Your task is to analyze the user's prompt, extract all structured parameters, and generate high-quality, professional event content.

CRITICAL INSTRUCTIONS FOR EVENT CREATION:
1. EXTRACT ALL SPECIFIC PARAMETERS FROM THE USER PROMPT:
   - Event Name (Clean brand name only)
   - Category (Hackathon, Technical, Cultural, Sports, Workshop, Seminar, Robotics, Placement Drive, Competition, Other)
   - Event Type (offline, online, or hybrid)
   - Venue / Building / Room
   - Date & Time (convert relative or natural dates into ISO ISO 8601 strings YYYY-MM-DDTHH:mm if provided)
   - Registration Mode ('individual', 'team', or 'both')
   - Registration Fee (number in INR, 0 for free)
   - Max Participants, Max Teams, Max Team Size

2. EVENT TITLE RULES:
   - Must contain ONLY the brand event name (e.g., "TechRush", "Google Developers AI Workshop", "CodeSprint").
   - NEVER echo or paraphrase prompt sentences.
   - NEVER include words like "Create", "Generate", "Conduct", "Organize", "Named", "Called", "On Monday", "At", "Please", "In Room".
   - Length: strict 2 to 5 words max.

3. TAGLINE & DESCRIPTION RULES:
   - Generate a completely NEW, inspiring, professional tagline for short_description (1 line, 10-15 words). Do NOT copy text from the prompt.
   - Generate a full, professional announcement description (agenda, highlights, eligibility, awards) sounding like an official university press release.

4. MISSING FIELD INFERENCE:
   - If venue is missing, infer a realistic campus venue like "Main Auditorium, Academic Block".
   - If mode is missing, infer 'team' for hackathons/sports and 'individual' for workshops/seminars.
   - If fee is missing, set 0 if "free" is mentioned or 100 for paid competitions.

5. OUTPUT FORMAT:
   - Return ONLY a raw JSON object (NO Markdown, NO \`\`\`json code blocks).
   - Expected JSON Schema:
{
  "title": "TechRush",
  "short_description": "Empowering young innovators to build next-generation software solutions in a 24-hour hackathon.",
  "description": "TechRush is the premier 24-hour campus hackathon designed to challenge student developers, designers, and problem solvers...",
  "category": "Hackathon",
  "event_type": "offline",
  "venue": "F Building",
  "building": "F Building",
  "room": "Room 406",
  "start_date": "2026-07-27T12:00",
  "end_date": "2026-07-28T12:00",
  "registration_mode": "team",
  "registration_fee": 200,
  "max_participants": 200,
  "max_teams": 50,
  "max_team_size": 4,
  "rules": [
    "Participants must present valid student identity cards at venue entrance.",
    "All code and prototypes must be developed within the 24-hour competition window.",
    "Decisions of the jury panel are final and binding."
  ],
  "faqs": [
    { "question": "Who is eligible to participate?", "answer": "Open to all enrolled university undergraduate and postgraduate students." },
    { "question": "Are hardware kits provided?", "answer": "Standard power outlets and high-speed Wi-Fi will be provided. Teams should bring their own laptops." }
  ],
  "tags": ["hackathon", "coding", "innovation", "techrush"]
}`;

    let parsedResult: any = null;

    // 1. Try Gemini API
    if (geminiKey && !parsedResult) {
      const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      for (const modelName of modelsToTry) {
        try {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: modelName,
            contents: `User Prompt: ${userPrompt}\nContext: ${JSON.stringify(context || {})}`,
            config: {
              systemInstruction,
              ...(feature === 'event_creation' ? { responseMimeType: 'application/json' } : {})
            }
          });

          const text = response.text || '';
          if (text) {
            const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            parsedResult = JSON.parse(cleaned);
            if (parsedResult) break;
          }
        } catch (err: any) {
          console.warn(`Gemini model ${modelName} error:`, err?.message);
        }
      }
    }

    // 2. Try OpenAI API
    if (openAiKey && !parsedResult) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: `User Prompt: ${userPrompt}` }
            ],
            temperature: 0.5
          })
        });

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content || '';
        if (text) {
          const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsedResult = JSON.parse(cleaned);
        }
      } catch (err: any) {
        console.warn('OpenAI API error:', err?.message);
      }
    }

    // 3. Try DeepSeek or Groq API
    if ((deepseekKey || groqKey) && !parsedResult) {
      const endpoint = deepseekKey 
        ? 'https://api.deepseek.com/v1/chat/completions'
        : 'https://api.groq.com/openai/v1/chat/completions';
      const key = deepseekKey || groqKey;
      const model = deepseekKey ? 'deepseek-chat' : 'llama-3.3-70b-versatile';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: `User Prompt: ${userPrompt}` }
            ]
          })
        });

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content || '';
        if (text) {
          const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsedResult = JSON.parse(cleaned);
        }
      } catch (err: any) {
        console.warn('DeepSeek/Groq API error:', err?.message);
      }
    }

    // 4. Robust NLP Regex Rule-Based Fallback Engine (Runs when API keys are missing/offline/rate-limited)
    if (!parsedResult && feature === 'event_creation') {
      const pLower = userPrompt.toLowerCase();

      // Extract Event Name using sanitized cleanEventTitle parser
      const extractedName = cleanEventTitle('', userPrompt);

      // Infer Category
      let category = 'Technical';
      if (pLower.includes('hackathon') || pLower.includes('code') || pLower.includes('hack')) category = 'Hackathon';
      else if (pLower.includes('workshop')) category = 'Workshop';
      else if (pLower.includes('seminar') || pLower.includes('talk')) category = 'Seminar';
      else if (pLower.includes('robot')) category = 'Robotics';
      else if (pLower.includes('dance') || pLower.includes('music') || pLower.includes('cultur')) category = 'Cultural';
      else if (pLower.includes('sport') || pLower.includes('cricket') || pLower.includes('football')) category = 'Sports';

      // Extract Venue, Building, Room
      let venue = 'Main Campus Hall';
      let building = '';
      let room = '';
      const roomMatch = userPrompt.match(/(?:in|at|room)\s+([A-Za-z0-9\s\-]+(?:Building|Block|Hall|Room|Lab)\s*(?:[A-Za-z0-9\-]+)?)/i);
      if (roomMatch && roomMatch[1]) {
        venue = roomMatch[1].trim();
      }

      const bldMatch = userPrompt.match(/([A-Z0-9\s\-]+(?:Building|Block))/i);
      if (bldMatch) building = bldMatch[1].trim();

      const rmMatch = userPrompt.match(/(?:Room|Hall|Lab)\s*([A-Z0-9\-]+)/i);
      if (rmMatch) room = rmMatch[0].trim();

      // Extract Fee
      let fee = 0;
      const feeMatch = userPrompt.match(/(?:₹|rs\.?|fee of|fee\s*₹?)\s*(\d+)/i) || userPrompt.match(/(\d+)\s*(?:rupees|rs|fee)/i);
      if (feeMatch) {
        fee = parseInt(feeMatch[1], 10);
      } else if (!pLower.includes('free')) {
        fee = category === 'Hackathon' ? 200 : category === 'Workshop' ? 100 : 0;
      }

      // Extract Mode & Team Size
      let registration_mode: 'individual' | 'team' | 'both' = 'individual';
      let max_team_size = 1;
      let max_teams = 25;

      const teamSizeMatch = userPrompt.match(/(?:teams? of|team size|max team size)\s*(\d+)/i) || userPrompt.match(/(\d+)\s*(?:members|players|team members)/i);
      if (teamSizeMatch) {
        registration_mode = 'team';
        max_team_size = parseInt(teamSizeMatch[1], 10);
      } else if (pLower.includes('team')) {
        registration_mode = 'team';
        max_team_size = 4;
      } else if (pLower.includes('individual')) {
        registration_mode = 'individual';
        max_team_size = 1;
      } else if (category === 'Hackathon') {
        registration_mode = 'team';
        max_team_size = 4;
      }

      // Extract Dates & Times
      let start_date = '';
      let end_date = '';
      const dateMatch = userPrompt.match(/(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i) ||
                        userPrompt.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      
      let targetDateStr = dateMatch ? dateMatch[1] : '2026-07-27';
      try {
        const d = new Date(targetDateStr);
        if (!isNaN(d.getTime())) {
          d.setHours(12, 0, 0, 0);
          start_date = d.toISOString().slice(0, 16);
          const endD = new Date(d.getTime() + (pLower.includes('24 hour') || category === 'Hackathon' ? 24 : 4) * 3600000);
          end_date = endD.toISOString().slice(0, 16);
        }
      } catch {
        start_date = '2026-07-27T12:00';
        end_date = '2026-07-28T12:00';
      }

      parsedResult = {
        title: extractedName,
        short_description: `Empowering students through hands-on ${category.toLowerCase()} experience and collaborative learning.`,
        description: `Join us for ${extractedName}, the premier ${category.toLowerCase()} event hosted on campus.\n\nParticipants will engage with industry mentors, work on real-world challenges, and present solutions to expert faculty judges. Cash prizes, certificates, and networking opportunities await!`,
        category,
        event_type: 'offline',
        venue,
        building: building || venue,
        room: room || 'Main Hall',
        start_date: start_date || '2026-07-27T12:00',
        end_date: end_date || '2026-07-28T12:00',
        registration_mode,
        registration_fee: fee,
        max_participants: 200,
        max_teams,
        max_team_size,
        rules: [
          'All participants must carry valid physical college ID cards.',
          'Event participation must strictly adhere to the official campus timeline.',
          'Decisions of the event judges and faculty coordinators are final and binding.'
        ],
        faqs: [
          { question: 'Who can register for this event?', answer: 'Open to all enrolled university undergraduate and postgraduate students.' },
          { question: 'Will participation certificates be issued?', answer: 'Yes! Verified participants who scan their QR attendance pass will receive digital certificates.' }
        ],
        tags: [category.toLowerCase(), 'campus-event', 'competition', 'eventhub']
      };
    }

    // 5. Post-Processing & Sanitation Pass (Guarantees clean output under ALL conditions)
    if (parsedResult) {
      parsedResult.title = cleanEventTitle(parsedResult.title, userPrompt);
      return NextResponse.json({ success: true, data: parsedResult });
    }

    return NextResponse.json({
      success: true,
      data: `Generated response for ${feature}`
    });

  } catch (error: any) {
    console.error('Error in AI generate API:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to process AI request' }, { status: 500 });
  }
}
