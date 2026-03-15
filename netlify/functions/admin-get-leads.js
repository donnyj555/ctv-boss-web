// netlify/functions/admin-get-leads.js

exports.handler = async (event, context) => {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ADMIN_SECRET = process.env.ADMIN_SECRET;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_SECRET) {
        console.error("Missing Admin Environment Variables");
        return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfiguration.' }) };
    }

    // Verify Admin Secret from the Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
        return { statusCode: 401, body: JSON.stringify({ error: `Unauthorized Access. You sent: '${authHeader}'. Netlify expects: 'Bearer ${ADMIN_SECRET}'. Make sure there are no spaces or quotes in your Netlify variable!` }) };
    }

    try {
        // Query the leads table using the Service Role Key (bypasses RLS)
        // Ordered by creation date descending
        const response = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=id,name,email,business_name,status,created_at&order=created_at.desc`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Supabase REST Fetch Error:", errorText);
            throw new Error(`Failed to fetch leads from database. Supabase says: ${errorText}. Double check your SUPABASE_SERVICE_ROLE_KEY in Netlify!`);
        }

        const leads = await response.json();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leads })
        };

    } catch (err) {
        console.error("Admin Get Leads Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message || 'Internal Server Error' })
        };
    }
};
