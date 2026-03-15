// netlify/functions/fetch-client-data.js

exports.handler = async (event, context) => {
    // Only allow POST or GET
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Get the Authorization header from the request to verify the user
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Missing Authorization header' }),
        };
    }

    try {
        // Environment variables injected by Netlify dashboard
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server misconfiguration.' }),
            };
        }

        // 1. Verify User Session with Supabase GoTrue API using the provided token
        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader, // 'Bearer XYZ'
                'apikey': SUPABASE_ANON_KEY,
            }
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid or expired session' }),
            };
        }

        const userEmail = userData.email;

        // 2. Fetch the specific client record from the 'clients' table using the validated email
        const clientResponse = await fetch(`${SUPABASE_URL}/rest/v1/clients?email=eq.${encodeURIComponent(userEmail)}&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': authHeader // Use the user's auth token for Row Level Security
            }
        });

        const clientData = await clientResponse.json();

        if (!clientResponse.ok || !clientData || clientData.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Client profile not found in database.' }),
            };
        }

        // 3. Return the client data to the frontend
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client: clientData[0]
            }),
        };

    } catch (err) {
        console.error("Function error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
