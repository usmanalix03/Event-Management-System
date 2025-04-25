const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const getUserProfile = async (req, res) => {
    const { user_id } = req.params;

    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const query = `
            SELECT full_name, student_id, email, phone_number, department
            FROM Users
            WHERE user_id = $1
        `;
        const result = await client.query(query, [user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

const getUserRegisteredEvents = async (req, res) => {
    const { user_id } = req.params;
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const query = `
            SELECT e.event_id, e.title, e.description, e.start_date, e.start_time, 
                   e.end_date, e.end_time, e.location, e.admin_id, e.price, 
                   a.full_name AS created_by, 
                   COUNT(er2.user_id) AS registrations_count
            FROM Events e
            JOIN EventRegistrations er ON e.event_id = er.event_id
            LEFT JOIN EventRegistrations er2 ON e.event_id = er2.event_id
            JOIN Admins a ON e.admin_id = a.admin_id
            WHERE er.user_id = $1
            GROUP BY e.event_id, a.full_name
            ORDER BY e.start_date;
        `;
        const result = await client.query(query, [user_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting registered events:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

const updateUserProfile = async (req, res) => {
    const { user_id, full_name, phone_number } = req.body;

    if (!user_id || !full_name || !phone_number) {
        return res.status(400).json({ error: 'User ID, full name, and phone number are required' });
    }

    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const query = 'UPDATE Users SET full_name = $1, phone_number = $2 WHERE user_id = $3';
        await client.query(query, [full_name, phone_number, user_id]);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        try {
            await client.end();
        } catch (endError) {
            console.error('Error closing database connection:', endError);
        }
    }
};

module.exports = {
    getUserProfile,
    getUserRegisteredEvents,
    updateUserProfile,
};