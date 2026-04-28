// netlify/functions/admin-activate-lead.js

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
        const payload = JSON.parse(event.body);
        const { lead_id, email, name, business_name, mntn_api_key, mntn_advertiser_id, temporary_password } = payload;

        if (!lead_id || !email || !name || !mntn_api_key || !mntn_advertiser_id || !temporary_password) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields for activation' }) };
        }

        const headers = {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
        };

        // 1. Create Supabase Auth User via GoTrue Admin API
        const createUserRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: temporary_password,
                email_confirm: true // Auto-confirm the user so they can log in immediately
            })
        });

        const userData = await createUserRes.json();
        
        // If user creation fails, check if it's just because the user already exists
        if (!createUserRes.ok) {
            if (userData.error_code === 'email_exists' || (userData.msg && userData.msg.includes('already been registered'))) {
                console.warn(`User with email ${email} already exists in Auth. Proceeding with client creation.`);
                // We do not throw an error here, we let the script continue
            } else {
                console.error("Supabase Auth Error full response:", userData);
                throw new Error(`Auth Error: ${userData.message || userData.msg || JSON.stringify(userData) || 'Failed to create user account'}`);
            }
        }

        // 2. Insert into `clients` table
        const insertClientRes = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
            method: 'POST',
            headers: {
                ...headers,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                name: name,
                email: email,
                business_name: business_name,
                mntn_api_key: mntn_api_key,
                mntn_advertiser_id: mntn_advertiser_id
            })
        });

        if (!insertClientRes.ok) {
            const err = await insertClientRes.text();
            console.error("Database Insert Error:", err);
            throw new Error('Failed to insert client record into database');
        }

        // 3. Mark the Lead as 'active' so it greys out in the portal
        const patchLeadRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead_id}`, {
            method: 'PATCH',
            headers: {
                ...headers,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ status: 'active' })
        });

        if (!patchLeadRes.ok) {
            console.warn("Failed to update lead status, but client was created.");
            // We won't crash the whole flow here since the important part (client creation) succeeded
        }

        // 4. Send Welcome Email via Resend
        try {
            const RESEND_API_KEY = process.env.RESEND_API_KEY;
            if (RESEND_API_KEY) {
                const firstName = name.split(' ')[0] || 'there';
                
                const emailHtml = `
                <div style="background-color: #0a0a0f; color: #fcfcfd; font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px 20px; text-align: center;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #13131c; border: 1px solid rgba(255, 51, 102, 0.3); border-radius: 12px; padding: 40px; text-align: left;">
                        <h1 style="color: #ff3366; font-size: 28px; margin-top: 0;">CTV HOMES</h1>
                        <h2 style="font-size: 22px; margin-bottom: 20px;">Welcome, ${firstName}!</h2>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #a0a0ab;">
                            Great news! Your TV campaign is now <strong>live on premium streaming networks</strong>. 
                            Your ads are being delivered to highly targeted screens right now.
                        </p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="https://ctvhomes.com/login" style="background-color: #ff3366; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Access Your Dashboard</a>
                        </div>
                        
                        <p style="font-size: 15px; line-height: 1.6; color: #a0a0ab; background-color: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                            <strong>Getting Started:</strong> Log in using your email address (<strong>${email}</strong>) and your temporary password: <strong>${temporary_password}</strong>.<br><br>
                            <em>Please set a new password on your first login to keep your account secure.</em>
                        </p>

                        <h3 style="font-size: 18px; margin-top: 35px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Understanding Your Metrics</h3>
                        
                        <ul style="color: #a0a0ab; font-size: 15px; line-height: 1.6; padding-left: 20px;">
                            <li style="margin-bottom: 10px;"><strong style="color: #fcfcfd;">Total Impressions:</strong> See exactly how many times your commercial was viewed on the big screen.</li>
                            <li style="margin-bottom: 10px;"><strong style="color: #4ade80;">Verified Site Visits:</strong> We track users who saw your TV ad and then visited your website on their phone, tablet, or laptop!</li>
                            <li><strong style="color: #fcfcfd;">Cost Per Visit:</strong> Your total campaign spend divided by the verified site visits, showing your true return on investment.</li>
                        </ul>
                        
                        <p style="font-size: 14px; margin-top: 40px; color: #666; text-align: center;">
                            Questions? Reply to this email and our team will be happy to help.<br>
                            &copy; ${new Date().getFullYear()} CTV HOMES
                        </p>
                    </div>
                </div>
                `;

                const resendRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'CTV HOMES <hello@ctvhomes.com>',
                        to: email,
                        subject: 'Your CTV Homes Campaign Is Live 🎉',
                        html: emailHtml
                    })
                });

                if (!resendRes.ok) {
                    const resendErr = await resendRes.text();
                    console.error("Resend API Warning: Failed to send email.", resendErr);
                } else {
                    console.log(`Welcome email successfully sent to ${email}`);
                }
            } else {
                console.warn("RESEND_API_KEY is not set. Skipping welcome email.");
            }
        } catch (emailErr) {
            console.error("Resend API Exception:", emailErr);
            // Non-blocking: We catch this and continue down to the success state.
        }

        // Success Output
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, message: `Successfully activated ${business_name}` })
        };

    } catch (err) {
        console.error("Lead Activation Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message || 'Internal Server Error during activation' })
        };
    }
};
