const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Create Event
const createEvent = async (req, res) => {
    const { title, description, start_date, start_time, end_date, end_time, location, admin_id, price } = req.body;
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const query = 'INSERT INTO Events (title, description, start_date, start_time, end_date, end_time, location, admin_id, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
        const values = [title, description, start_date, start_time, end_date, end_time, location, admin_id, price || 0.00];
        const result = await client.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

// Get All Events
const getEvents = async (req, res) => {
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
                   COUNT(er.user_id) AS registrations_count 
            FROM Events e 
            LEFT JOIN EventRegistrations er ON e.event_id = er.event_id 
            JOIN Admins a ON e.admin_id = a.admin_id
            GROUP BY e.event_id, a.full_name
            ORDER BY e.start_date;
        `;
        const result = await client.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting events:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

// Get Event by ID
const getEventById = async (req, res) => {
    const { event_id } = req.params;
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
                   a.full_name AS created_by
            FROM Events e
            JOIN Admins a ON e.admin_id = a.admin_id
            WHERE e.event_id = $1
        `;
        const result = await client.query(query, [event_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error getting event:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

// Update Event
const updateEvent = async (req, res) => {
    const { event_id } = req.params;
    const { title, description, start_date, start_time, end_date, end_time, location, price } = req.body;

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
            UPDATE events
            SET 
                title = $1,
                description = $2,
                start_date = $3,
                start_time = $4,
                end_date = $5,
                end_time = $6,
                location = $7,
                price = $8
            WHERE event_id = $9
        `;
        const values = [
            title,
            description,
            start_date,
            start_time || null,
            end_date,
            end_time || null,
            location,
            price || 0.00,
            parseInt(event_id, 10)
        ];

        const result = await client.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.status(200).json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error during updateEvent:', error.stack);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        await client.end();
    }
};

// Delete Event
const deleteEvent = async (req, res) => {
    const { event_id } = req.params;
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const query = 'DELETE FROM Events WHERE event_id = $1';
        await client.query(query, [event_id]);
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

// Register Student for Event
const registerStudentForEvent = async (req, res) => {
    const { user_id, event_id } = req.body;
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const query = 'INSERT INTO EventRegistrations (user_id, event_id) VALUES ($1, $2)';
        await client.query(query, [user_id, event_id]);
        res.json({ message: 'Student registered successfully' });
    } catch (err) {
        console.error('Error registering student:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

// Get Students Registered for Event
const getStudentsRegisteredForEvent = async (req, res) => {
    const { event_id } = req.params;
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
            SELECT u.user_id, u.full_name, u.student_id, u.email, u.phone_number
            FROM Users u
            JOIN EventRegistrations er ON u.user_id = er.user_id
            WHERE er.event_id = $1;
        `;
        const result = await client.query(query, [event_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting registered students:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    registerStudentForEvent,
    getStudentsRegisteredForEvent,
};