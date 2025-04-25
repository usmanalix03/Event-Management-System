-- Create ENUM for department types
CREATE TYPE department_type AS ENUM (
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Commerce',
    'Arts'
);

-- Table for Approved Student IDs
CREATE TABLE ApprovedStudentIds (
    student_id VARCHAR(255) PRIMARY KEY
);

-- Table for Approved Admin IDs
CREATE TABLE ApprovedAdminIds (
    admin_id VARCHAR(255) PRIMARY KEY
);

-- Table for Users (Students)
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL,
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    department department_type
);

-- Table for Admins
CREATE TABLE Admins (
    admin_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL,
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    department department_type,
    admin_id_manual VARCHAR(255) UNIQUE
);

-- Table for Events
CREATE TABLE Events (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    start_time TIME,
    end_date DATE NOT NULL,
    end_time TIME,
    location VARCHAR(255) NOT NULL,
    admin_id INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT price_non_negative CHECK (price >= 0),
    CONSTRAINT events_admin_id_fkey FOREIGN KEY (admin_id) 
        REFERENCES Admins(admin_id) ON DELETE CASCADE
);

-- Table for Event Registrations
CREATE TABLE EventRegistrations (
    registration_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    registration_date TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_event UNIQUE (user_id, event_id),
    CONSTRAINT eventregistrations_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT eventregistrations_event_id_fkey FOREIGN KEY (event_id) 
        REFERENCES Events(event_id) ON DELETE CASCADE
);