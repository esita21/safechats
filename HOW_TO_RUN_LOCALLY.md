+# How to Run KidChat on Your Computer

Follow these steps to download and run KidChat on your own computer.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/) (optional, for cloning the repository)

 
## Step 1: Download the Code

### Option 1: Download as ZIP file
1. Click on the "Download ZIP" button in the Replit interface
2. Extract the ZIP file to a folder on your computer

### Option 2: Clone using Git
```bash
git clone https://github.com/yourusername/kidchat.git
cd kidchat
```

## Step 2: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all the required dependencies.

## Step 3: Start the Application

Run the development server:

```bash
npm run dev
```

This will start the application on [http://localhost:5000](http://localhost:5000).

## Step 4: Using the Application

1. Open your browser and go to [http://localhost:5000](http://localhost:5000)
2. Create a parent account by registering
3. Create child accounts from the parent dashboard
4. Log in with each account to test the functionality

## Using PostgreSQL (Optional)

If you want to use PostgreSQL for persistent data storage instead of in-memory storage:

1. Install PostgreSQL on your computer
2. Create a database for the application
3. Create a `.env` file in the root directory with:

```
DATABASE_URL=postgresql://username:password@localhost:5432/kidchat
```

Replace `username`, `password`, and database name as needed.

4. In `server/storage.ts`, change the storage implementation to use DatabaseStorage:

```typescript
import { DatabaseStorage } from './database-storage';
export const storage = new DatabaseStorage();
```

5. Restart the application

## Project Structure

- `client/` - Frontend React application
- `server/` - Express backend server
- `shared/` - Shared types and utilities

## Troubleshooting

- If you have issues with the database connection, make sure your PostgreSQL server is running
- In case of "module not found" errors, try running `npm install` again
- For port conflicts, you can change the port in `server/index.ts`