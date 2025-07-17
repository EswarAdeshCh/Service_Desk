# Frontend Service Desk Application

This directory contains the frontend application for the Service Desk. It is a React-based single-page application that interacts with the backend API to provide a user interface for managing service requests.

## Project Structure

- `public/`: Contains static assets like `index.html`, images, and logos.
- `src/`: Houses the main source code for the React application.
  - `app.jsx`: The main React component.
  - `components/`: Reusable React components, categorized by functionality (e.g., `auth`, `client`, `supervisor`, `technician`).
  - `index.js`: The entry point for the React application.
  - `styles/`: Contains CSS files, including `main.css`.
- `postcss.config.mjs`, `tailwind.config.ts`: Configuration files for PostCSS and Tailwind CSS.
- `tsconfig.json`: TypeScript configuration file.

## Getting Started

To run the frontend, navigate to this directory and install the dependencies:

```bash
npm install
```

Then, start the development server:

```bash
npm run dev
```

The application will typically be available at `http://localhost:5173` or a similar address.