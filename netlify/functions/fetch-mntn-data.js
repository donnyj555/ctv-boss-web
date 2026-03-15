// netlify/functions/fetch-mntn-data.js

exports.handler = async (event, context) => {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Get the Authorization header from the request to verify the user
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Missing Authorization header' }) };
    }

    try {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfiguration.' }) };
        }

        // 1. Verify User Session with Supabase GoTrue API
        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader, // 'Bearer XYZ'
                'apikey': SUPABASE_ANON_KEY,
            }
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired session' }) };
        }

        const userEmail = userData.email;

        // 2. Fetch the specific client record to get their MNTN API Key
        // We use the user's auth token for Row Level Security
        const clientResponse = await fetch(`${SUPABASE_URL}/rest/v1/clients?email=eq.${encodeURIComponent(userEmail)}&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': authHeader
            }
        });

        const clientData = await clientResponse.json();

        if (!clientResponse.ok || !clientData || clientData.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Client profile not found.' }) };
        }

        const client = clientData[0];
        const mntnKey = client.mntn_api_key;

        if (!mntnKey) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Your campaign data is loading — check back shortly' }) };
        }

        // 3. Make Secure Request to MNTN API
        // Parse date range from query string, default to monthtodate
        const dateRange = event.queryStringParameters.begin || 'monthtodate'; 
        
        // We add Campaign.Cost to correctly calculate Cost Per Visit as requested
        const mntnApiUrl = `https://api3.mountain.com/apidata?key=${mntnKey}&begin=${dateRange}&format=json&data=Campaign.Impressions,Campaign.Visits,Campaign.Conversions,Campaign.Cost`;

        const mntnResponse = await fetch(mntnApiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        const mntnData = await mntnResponse.json();

        // If MNTN fails, provide the friendly message
        if (!mntnResponse.ok) {
            console.error("MNTN API Error:", mntnData);
            return { 
                statusCode: 502, 
                body: JSON.stringify({ error: 'Your campaign data is loading — check back shortly' }) 
            };
        }

        // 4. Return Data to Frontend
        // Assuming MNTN returns an array of objects or a single data object.
        // We send it back to the client to parse, along with basic client info.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_name: client.name,
                business_name: client.business_name,
                metrics: mntnData
            }),
        };

    } catch (err) {
        console.error("Function error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Your campaign data is loading — check back shortly' }) // Friendly generic error
        };
    }
};
