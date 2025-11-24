# S&OP MVP Application

This application is a Minimum Viable Product (MVP) for Sales and Operations Planning (S&OP), integrating sales, production, logistics, and financial plans with AI-driven adjustment proposals.

## Features

*   **Dashboard**: Visualization of PSI (Production, Sales, Inventory), Opportunity Loss, AI Proposals, and Financial Performance (Budget vs Actual).
*   **Sales Plan**: Monthly sales quantity and price input (Spreadsheet-like UI, Copy-Paste support).
*   **Production Plan**: Monthly production quantity and cost input.
*   **Logistics Plan**: Configuration for initial inventory, warehouse capacity, and storage costs.
*   **Financial Plan**: Budget setting for each department.
*   **AI Proposals**: Suggestions for inventory optimization and risk mitigation.
*   **Data Persistence**: Local data storage using SQLite.

## How to Run Locally

Follow these steps to run the project locally.

### Prerequisites

*   Node.js (v18 or higher) installed.

### Steps

1.  **Clone the repository**
    ```bash
    git clone https://github.com/miumigy/sandopmvp.git
    cd sandopmvp
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Access the application**
    Open your browser and navigate to `http://localhost:3000`.

## Running Tests

To run unit and component tests:

```bash
npm test
```

## GitHub Repository

This project is managed at:
https://github.com/miumigy/sandopmvp

To push local changes:
```bash
git add .
git commit -m "Your changes"
git push
```

## Architecture

```mermaid
graph TD
    subgraph Frontend [Frontend (Next.js App Router)]
        Dashboard[Dashboard Page]
        Inputs[Input Pages (Sales, Prod, etc.)]
        Context[SOPContext (State Management)]
    end

    subgraph Backend [Backend (Next.js API Routes)]
        API[API Route (/api/data)]
        Logic[Business Logic (psiLogic, aiLogic)]
    end

    subgraph Database [Database]
        SQLite[(SQLite DB)]
    end

    Dashboard --> Context
    Inputs --> Context
    Context -- Fetch/Save Data --> API
    API --> Logic
    Logic --> SQLite
    SQLite --> Logic
    Logic --> API
```

## Tech Stack

*   **Frontend**: Next.js (App Router), React, Recharts, Lucide React
*   **Styling**: Vanilla CSS (CSS Modules)
*   **Backend/DB**: Next.js API Routes, SQLite (better-sqlite3)
*   **Testing**: Jest, React Testing Library
