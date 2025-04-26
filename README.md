Event Management System
Overview
This Event Management System is designed exclusively for college events. 
It helps streamline the event management process, making it easier for students and event organizers to handle various activities, such as event creation, registration, and scheduling.

Features
Event Creation and Management: Organizers can easily create and manage events, specifying details like dates, times, and locations.

User Registration: Users can register for events with ease, ensuring smooth participation management.

Admin Control: Admins can view, edit, and manage event information and user registrations.

Real-Time Updates: Any changes made by admins or organizers are immediately reflected to all users.

Technologies Used
Frontend: HTML, CSS, JavaScript for a responsive and interactive interface.

Backend: Node.js with Express for creating a robust server-side application.

Database: PostgreSQL for efficient, secure, and scalable data storage of event details and user registrations.

Setup Instructions
1. Clone the Repository
To get started with the Event Management System, first clone the repository to your local machine:

Copy code
git clone https://github.com/usmanalix03/Event-Management-System.git
This will download the entire project to your local machine.

2. Install Dependencies
Navigate to the backend/server directory and install the necessary dependencies using npm (Node Package Manager):

cd Event-Management-System/server
npm install
This will install all the required packages listed in the package.json file.

3. Setup PostgreSQL Database
Create a PostgreSQL Database:

If you don’t have PostgreSQL installed, download and install it from PostgreSQL's official site.

Once installed, log in to PostgreSQL and create a database for the project:

CREATE DATABASE event_management;
Configure Database Connection:

In the project, locate the database configuration file (usually config.js or db.js in the server folder).

Update the configuration with your PostgreSQL credentials:

const dbConfig = {
  user: 'your_username',
  host: 'localhost',
  database: 'event_management',
  password: 'your_password',
  port: 5432,
};

4. Contributions
If you want to contribute:

Fork the repository and create a new branch.

Make your changes, and submit a pull request for review.
