// netlify/functions/admin-add-lead.js

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ADMIN_SECRET = process.env.ADMIN_SECRET;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_SECRET) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfiguration.' }) };
    }

    // Verify Admin Secret
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized Access' }) };
    }

    try {
        const body = JSON.parse(event.body);
        const { name, email, business_name } = body;

        if (!name || !email) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Name and email are required.' }) };
        }

        // Insert into Supabase leads table
        const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                name,
                email,
                business_name,
                status: 'new'
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Supabase insert error:", errText);
            throw new Error("Failed to insert into database");
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, message: 'Lead added manually' })
        };

    } catch (err) {
        console.error("Add Lead Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message || 'Internal Server Error' })
        };
    }
};
