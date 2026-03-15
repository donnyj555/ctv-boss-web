// netlify/functions/admin-delete-lead.js

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'DELETE') {
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
        const payload = JSON.parse(event.body);
        const { lead_id } = payload;

        if (!lead_id) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing lead_id for deletion' }) };
        }

        // Delete the lead from Supabase
        const response = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead_id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                // Prefer: return=representation tells Supabase to return the deleted row data
                'Prefer': 'return=representation' 
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Supabase delete error:", errText);
            throw new Error("Failed to delete lead from database");
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, message: 'Lead successfully deleted' })
        };

    } catch (err) {
        console.error("Delete Lead Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message || 'Internal Server Error' })
        };
    }
};
