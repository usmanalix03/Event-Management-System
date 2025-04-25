const { Client } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const registerUser = async (req, res) => {
    const { full_name, student_id, email, password, phone_number, department } = req.body;

    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();

        // Check if student_id is pre-approved
        const checkStudentQuery = 'SELECT student_id FROM ApprovedStudentIds WHERE student_id = $1';
        const studentCheckResult = await client.query(checkStudentQuery, [student_id]);
        if (studentCheckResult.rows.length === 0) {
            return res.status(403).json({ error: 'Student ID not approved for registration' });
        }

        // Check if department exists in department_type ENUM
        const checkDepartmentQuery = "SELECT unnest(enum_range(NULL::department_type)) AS department";
        const departmentResult = await client.query(checkDepartmentQuery);
        const validDepartments = departmentResult.rows.map(row => row.department);
        if (!validDepartments.includes(department)) {
            return res.status(400).json({ error: 'Invalid department name' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO Users (full_name, student_id, email, password, phone_number, department, reset_password_token, reset_password_expires)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING user_id
        `;
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000);
        const values = [full_name, student_id, email, hashedPassword, phone_number, department, resetToken, resetExpires];

        const result = await client.query(query, values);
        const userId = result.rows[0].user_id;

        res.status(201).json({ message: 'User created successfully', user_id: userId });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    } finally {
        await client.end();
    }
};

const loginUser = async (req, res) => {
    const { email, password, user_type } = req.body;

    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const table = user_type === 'admin' ? 'Admins' : 'Users';
        const idColumn = user_type === 'admin' ? 'admin_id' : 'user_id';
        const query = `SELECT * FROM ${table} WHERE email = $1`;
        const result = await client.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        res.json({ 
            message: 'Login successful',
            user_id: user[idColumn],
            user_type: user_type,
            name: user.full_name,
            email: user.email
        });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const query = 'SELECT * FROM Users WHERE email = $1';
        const result = await client.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Email not found' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000);

        const updateQuery = 'UPDATE Users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3';
        await client.query(updateQuery, [token, expires, email]);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            text: `Hello,\n\nYou requested a password reset. Use this token to reset your password: ${token}\n\nIf you didn’t request this, ignore this email.\n\nBest regards,\nPoona College Team`,
        });

        res.json({ message: 'Password reset token generated' });
    } catch (err) {
        console.error('Error in forgotPassword:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const query = 'SELECT * FROM Users WHERE reset_password_token = $1 AND reset_password_expires > $2';
        const result = await client.query(query, [token, new Date()]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Token is invalid or has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updateQuery = 'UPDATE Users SET password = $1, reset_password_token = null, reset_password_expires = null WHERE reset_password_token = $2';
        await client.query(updateQuery, [hashedPassword, token]);

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Error in resetPassword:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

const registerAdmin = async (req, res) => {
    const { full_name, email, password, phone_number, admin_id_manual, department } = req.body;

    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();

        // Check if admin_id_manual is pre-approved
        const checkAdminQuery = 'SELECT admin_id FROM ApprovedAdminIds WHERE admin_id = $1';
        const adminCheckResult = await client.query(checkAdminQuery, [admin_id_manual]);
        if (adminCheckResult.rows.length === 0) {
            return res.status(403).json({ error: 'Admin ID not approved for registration' });
        }

        // Check if department exists in department_type ENUM
        const checkDepartmentQuery = "SELECT unnest(enum_range(NULL::department_type)) AS department";
        const departmentResult = await client.query(checkDepartmentQuery);
        const validDepartments = departmentResult.rows.map(row => row.department);
        if (!validDepartments.includes(department)) {
            return res.status(400).json({ error: 'Invalid department name' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO Admins (full_name, email, password, phone_number, admin_id_manual, department)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING admin_id
        `;
        const values = [full_name, email, hashedPassword, phone_number, admin_id_manual, department];
        const result = await client.query(query, values);
        const adminId = result.rows[0].admin_id;

        res.status(201).json({ message: 'Admin created successfully', admin_id: adminId });
    } catch (err) {
        console.error('Error registering admin:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

const updateAdmin = async (req, res) => {
    const { adminId } = req.params;
    const { full_name, email, phone_number } = req.body;

    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const query = 'UPDATE Admins SET full_name = $1, email = $2, phone_number = $3 WHERE admin_id = $4';
        const values = [full_name, email, phone_number, adminId];
        const result = await client.query(query, values);

        if (result.rowCount > 0) {
            res.json({ message: 'Admin updated successfully' });
        } else {
            res.status(404).json({ error: 'Admin not found' });
        }
    } catch (err) {
        console.error('Error updating admin:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

const forgotPasswordAdmin = async (req, res) => {
    const { email } = req.body;

    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const query = 'SELECT * FROM Admins WHERE email = $1';
        const result = await client.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Email not found' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000);

        const updateQuery = 'UPDATE Admins SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3';
        await client.query(updateQuery, [token, expires, email]);

        res.json({ message: 'Password reset token generated' });
    } catch (err) {
        console.error('Error in forgotPasswordAdmin:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

const resetPasswordAdmin = async (req, res) => {
    const { token, password } = req.body;

    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const query = 'SELECT * FROM Admins WHERE reset_password_token = $1 AND reset_password_expires > $2';
        const result = await client.query(query, [token, new Date()]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Token is invalid or has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updateQuery = 'UPDATE Admins SET password = $1, reset_password_token = null, reset_password_expires = null WHERE reset_password_token = $2';
        await client.query(updateQuery, [hashedPassword, token]);

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Error in resetPasswordAdmin:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

const getDepartmentOptions = async (req, res) => {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        const query = "SELECT unnest(enum_range(NULL::department_type)) AS department";
        const result = await client.query(query);
        const departments = result.rows.map(row => row.department);
        res.json(departments);
    } catch (err) {
        console.error('Error fetching department options:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
};

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    registerAdmin,
    updateAdmin,
    forgotPasswordAdmin,
    resetPasswordAdmin,
    getDepartmentOptions,
};