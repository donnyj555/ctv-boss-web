const { OpenAI } = require('openai');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { topic = 'promotional', voiceDirection = 'Professional and trustworthy', cta = 'Visit us today!' } = data;

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "PASTE_YOUR_OPENAI_KEY_HERE") {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "OpenAI API key is missing or invalid in .env file." })
        };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
    Write a 60-word video commercial script for a local business.
    Topic/Theme: ${topic}
    Voice Direction/Tone: ${voiceDirection}
    Call to Action to include at the end: ${cta}
    
    Make it punchy, engaging, and suitable for a 30-second broadcast. Do not include stage directions, music notes, or formatting like [Music starts] - return ONLY the spoken words.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", "content": "You are an expert commercial scriptwriter." },
        { role: "user", "content": prompt}
      ],
      max_tokens: 150,
    });

    const scriptText = response.choices[0].message.content.trim();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // CORS headers for local testing if needed
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ script: scriptText }),
    };

  } catch (error) {
    console.error("OpenAI Script Generation Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate script. " + error.message }),
    };
  }
};
