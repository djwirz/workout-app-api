# Workout App API

## Overview

A lightweight Fastify-based API designed to **sync, store, and retrieve workout exercises** from Notion. This API caches exercise videos locally to optimize performance for a Progressive Web App (PWA).

## Features

✅ **Manually sync exercises** from Notion  
✅ **Cache exercise videos** in SQLite  
✅ **Serve video data efficiently**  
✅ **Paginated exercise retrieval**

## Installation

### Prerequisites

- Node.js 18+
- SQLite installed (`brew install sqlite3` or equivalent)

### Setup

1. Clone the repository:

   ```sh
   git clone https://github.com/djwirz/workout-app-api.git
   cd workout-app-api
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file:

   ```sh
   NOTION_API_KEY=your_notion_api_key
   NOTION_EXERCISE_DB_ID=your_notion_database_id
   PORT=3000
   LOG_LEVEL=info
   ```

4. Start the server:
   ```sh
   npm run dev
   ```

## Endpoints

### **1. Get Exercises (Paginated)**

```
GET /exercises?limit=10&offset=0
```

- Returns a paginated list of exercises.
- Does **not** trigger a Notion sync; it only returns stored data.

### **2. Get Exercise Video**

```
GET /video/:id
```

- Returns the **cached video** for the given `id`.

### **3. Sync Exercises from Notion**

```
POST /sync
```

- Manually triggers a sync with Notion.
- Fetches exercises and caches their videos in the database.
- Should be called **only when new data is needed** to avoid unnecessary API requests.

## Logging

This API uses **Pino logging** for structured output. Logs include:

- Incoming API requests & responses
- Notion API interactions
- Exercise and video storage operations
- Errors & warnings

## Next Steps

- PWA integration for **offline workouts**
- Optimized syncing **only for changes** from Notion
- UI for **managing workout plans**
