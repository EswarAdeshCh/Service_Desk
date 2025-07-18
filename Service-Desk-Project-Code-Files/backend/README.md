# Backend Service Desk API

This directory contains the backend API for the Service Desk application. It is built using Node.js and Express, providing the necessary endpoints for user authentication, complaint management, and messaging.

## Project Structure

- `middleware/`: Contains middleware functions for authentication and other request processing.
- `models/`: Defines the Mongoose schemas for the database, including `User`, `Complaint`, and `Message`.
- `routes/`: Handles API routing, separating concerns for `admin`, `agents`, `auth`, `complaints`, `messages`, and `users`.
- `server.js`: The main entry point for the backend application, setting up the Express server and connecting to the database.

## Getting Started

To run the backend, navigate to this directory and install the dependencies:

```bash
npm install
```

Then, start the server:

```bash
npm start
```

Ensure you have a `.env` file with your database connection string and other necessary environment variables.