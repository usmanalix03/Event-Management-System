const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const getAdminProfile = async (req, res) => {
    const { admin_id } = req.params;

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
            SELECT full_name, email, phone_number, admin_id_manual, department
            FROM Admins
            WHERE admin_id = $1
        `;
        const result = await client.query(query, [admin_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching admin profile:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

module.exports = { getAdminProfile };