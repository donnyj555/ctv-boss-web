exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    console.log("Saving new campaign to database...", data);
    
    // In a real app, this would use Supabase, Firebase, or MongoDB to save the campaign
    // For now, we simulate a successful DB write
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ 
        success: true, 
        message: "Campaign scheduled successfully",
        campaignId: "cmp_" + Math.random().toString(36).substring(2, 9)
      })
    };

  } catch (error) {
    console.error("Launch Campaign Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to launch campaign. " + error.message })
    };
  }
};
