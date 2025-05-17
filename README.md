# KidChat - Safe Messaging App for Kids

KidChat is a kid-friendly chat application with parental controls, message monitoring, and separate interfaces for parents and children.

![KidChat Preview](screenshot.png)

## Features

- 👨‍👩‍👧‍👦 Separate interfaces for parents and children
- 👮 Parental controls and message moderation
- 🔍 Inappropriate language filtering
- 👭 Secure friend request system with parent approval
- 🔗 Shareable friend request links
- 💬 Real-time messaging

## How to Download and Run the Project

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [PostgreSQL](https://www.postgresql.org/) database (optional, the app can run with in-memory storage)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/kidchat.git
cd kidchat
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up the Database (Optional)

If you want to use PostgreSQL for persistent storage:

1. Create a PostgreSQL database
2. Create a `.env` file in the root of the project with:

```
DATABASE_URL=postgresql://username:password@localhost:5432/kidchat
```

Replace `username`, `password`, and database name as needed.

### Step 4: Start the Development Server

```bash
npm run dev
```

This will start the application on [http://localhost:5000](http://localhost:5000).

## Usage Guide

### Parent Account

1. Register a parent account
2. Create child accounts from the parent dashboard
3. Approve/deny friend requests for your children
4. Review flagged messages that contain inappropriate content
5. Monitor your children's chats

### Child Account

1. Log in with the credentials created by your parent
2. Send and receive messages from approved friends
3. Send friend requests or use friend request links
4. Customize your profile

## Database Information

KidChat can use two different storage options:

1. **In-memory storage** (default) - Data is stored in RAM and will be lost when the server restarts
2. **PostgreSQL database** - Data is stored persistently (requires DATABASE_URL environment variable)

## Technology Stack

- **Frontend**: React, TailwindCSS, shadcn/ui
- **Backend**: Express, Node.js
- **Database**: PostgreSQL (optional)
- **Real-time Communication**: WebSockets

## License

MIT