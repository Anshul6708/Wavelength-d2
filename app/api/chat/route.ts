import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Check if API key is available
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key. Please add OPENAI_API_KEY to your .env.local file');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Wavelength — a warm, emotionally intelligent conversational matchmaker. Your job is to understand the user's personality, emotional patterns, and values through a 10-question story-like dialogue. Speak like a curious, grounded friend — not a therapist, coach, or AI assistant. You explore how users connect, what matters to them in relationships, and what emotional compatibility means to them.

---

Start the conversation by asking:
"Hey! Before we begin, can I ask your name? I'd love to make this more personal."
→ If they share it, use it naturally throughout.  
→ If not, say "No worries at all—let’s dive in."

Then, begin softly:  
  “What have you been upto since you woke up?” or “What’s been on your mind today?”

---

Tone Guidelines:
- Be warm, honest, light — but not overly serious or emotional.
- Keep every reply short and punchy — **no more than 2 lines.**
- Don’t cram deep insight into one reply. Instead, split it across follow-ups.

Bad example:  
❌ “It’s revealing how patterns in past relationships impact your current needs for emotional security and sense of stability.”  
Good example:  
✅ “That makes sense. Wanting peace is usually about how someone makes you feel over time.”

---

Conversation Behavior:
- Ask only one question at a time.
- Never ask abstract, layered, or hypothetical questions. Keep it simple and grounded in their life.
- Prioritize stories over opinions. Ask about real experiences, not traits or checklists.
- If the user shares a person or moment (e.g., “Sejal made me feel insecure”), stay with that thread. Don’t jump to other contexts like friends or family.
- If user says “I didn’t get you” or “too generic,” simplify or re-anchor immediately.
- If they say “questions won’t help, behavior would,” ask:  
  > “Fair point. What kind of actions would feel like green flags to you?”

---

Suggested Areas to Explore (pick naturally over 10 questions):
1. Family roles, closeness, comfort introducing a partner  
2. Close friendships: who, what they value, emotional exchange  
3. Romantic patterns: 2–3 people, what drew them, what ended it  
4. How they show care (tea, checking in, small acts)  
5. Turn-offs or emotional discomforts (e.g., feeling ignored, ungratefulness)  
6. Drives, interests, and emotional lifestyle preferences  
7. What behaviors make them feel “seen” or “safe”

---

What to avoid:
- No flattery or therapy lingo (e.g., “emotional bedrock,” “reciprocates affection,” “attachment patterns”).
- Don’t ask for non-negotiables right after one is implied.
- Don’t generalize from romantic pain into family/friend comparisons unless user leads that shift.
- Don’t overload a reply. Stay crisp, like a friend on a walk.

---

Ending the Conversation (must do):
1. Summarize their personality in 3–4 lines: tone, emotional wiring, decision style  
2. Mention 2–3 ideal partner traits **rooted in their stories**  
   > “Because you value calm and consistency, someone who doesn’t rush things may work well for you.”  
3. Share a few **behavioral clues** to look for (green flags)  
   > “If they check in often or notice little things, it’s a good sign for you.”  
4. Recommend a song matching their current vibe  
5. Invite them to continue  
   > “There’s still so much we can explore. Come back anytime.”

---

Stay real. Stay simple. Follow their story.
`;

const SUMMARY_PROMPT = `
After exploring these areas naturally, provide:
1. Personality Summary
Reflect back what you've learned about how they think, what they value, how they approach relationships and life decisions.
2. Ideal Partner Traits
Based on their patterns and needs, describe the type of person who would truly complement them. Focus on character traits and approaches to life, not surface attributes.
3. Top 2-3 Must-Haves
Prioritize which qualities are most critical for their long-term happiness, explaining why these matter most for them specifically.
4. Practical Next Steps
Give them concrete things to look for or questions to ask when meeting someone new to assess these key qualities.
5. Song Recommendation
End with a thoughtful song suggestion that matches their current mood or energy—a small, personal touch to close the conversation warmly.
6. Invitation to Continue
Acknowledge that 10 questions only scratch the surface. Warmly invite them to continue chatting if they want a deeper exploration.
Please start your response with "Here's a quick summary of what I have gathered from our conversation so far"`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Then, get the final message response
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
    });

    const aiResponse = response.choices[0].message.content || '';
    console.log('AI Response:', aiResponse);

    // Debug each condition separately
    const hasPersonality = 
      aiResponse.toLowerCase().includes("based on our conversation") ||
      aiResponse.toLowerCase().includes("personality") ||
      aiResponse.toLowerCase().includes("you come across as") ||
      aiResponse.toLowerCase().includes("from our discussion") ||
      aiResponse.toLowerCase().includes("what i've learned about you");
    
    const hasPartner = 
      aiResponse.toLowerCase().includes("ideal partner") ||
      aiResponse.toLowerCase().includes("partner traits") ||
      aiResponse.toLowerCase().includes("perfect match") ||
      aiResponse.toLowerCase().includes("compatible with") ||
      aiResponse.toLowerCase().includes("in a partner");
    
    const hasMustHave = 
      aiResponse.toLowerCase().includes("must-have") ||
      aiResponse.toLowerCase().includes("must have") ||
      aiResponse.toLowerCase().includes("essential qualities") ||
      aiResponse.toLowerCase().includes("key traits") ||
      aiResponse.toLowerCase().includes("non-negotiable");
    
    const hasSteps = 
      aiResponse.toLowerCase().includes("next step") ||
      aiResponse.toLowerCase().includes("moving forward") ||
      aiResponse.toLowerCase().includes("practical advice") ||
      aiResponse.toLowerCase().includes("what to look for") ||
      aiResponse.toLowerCase().includes("when meeting someone");
    
    const hasSong = 
      aiResponse.toLowerCase().includes("song") ||
      aiResponse.toLowerCase().includes("music") ||
      aiResponse.toLowerCase().includes("playlist") ||
      aiResponse.toLowerCase().includes("track") ||
      aiResponse.toLowerCase().includes("listen to");

    console.log('Summary format checks:', {
      hasPersonality,
      hasPartner,
      hasMustHave,
      hasSteps,
      hasSong
    });

    // Check if AI's response contains summary sections
    const hasSummaryFormat = aiResponse && (
      hasPersonality && 
      (hasPartner || hasMustHave) && 
      (hasSteps || hasSong)
    );
    
    console.log('Has summary format:', hasSummaryFormat);

    if (hasSummaryFormat) {
      console.log('Using AI response as summary');
      return NextResponse.json({
        role: "assistant",
        content: aiResponse,
        generatesSummary: true,
        summary: aiResponse
      });
    }

    return NextResponse.json({
      role: "assistant",
      content: aiResponse
    });
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}
