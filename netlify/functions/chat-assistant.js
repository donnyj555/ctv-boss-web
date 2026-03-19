const { OpenAI } = require('openai');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { currentScript, userMessage } = data;

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
    You are an AI Creative Director helping a user edit a 30-second TV commercial script.
    
    Current Script: "${currentScript}"
    User's Request: "${userMessage}"
    
    Based on the user's request, update the script.
    Output your response in valid JSON format ONLY, exactly like this:
    {
      "assistantReply": "A short, friendly message acknowledging the change.",
      "newScript": "The updated full text of the script."
    }
    Make sure the new script remains around 60 words and has no stage directions.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", "content": "You are a helpful JSON-only API that assists in writing commercial scripts." },
        { role: "user", "content": prompt}
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const resultText = response.choices[0].message.content.trim();
    const resultObj = JSON.parse(resultText);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(resultObj),
    };

  } catch (error) {
    console.error("OpenAI Chat Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process chat request. " + error.message }),
    };
  }
};
