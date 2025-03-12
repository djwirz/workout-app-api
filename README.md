# Workout App API

## Overview

A Fastify-based API for syncing, storing, and retrieving workout exercises from Notion. Caches exercise videos locally to optimize performance for a Progressive Web App (PWA).

## Features

- Manually sync exercises, workouts, and entries from Notion
- Cache and serve exercise videos from SQLite
- Retrieve paginated exercise lists
- Fetch stored workouts and associated entries

## Setup

### Prerequisites

- Node.js 18+
- SQLite (`brew install sqlite3` or equivalent)

### Installation

```sh
git clone https://github.com/djwirz/workout-app-api.git
cd workout-app-api
pnpm install
```

### Configuration

Create a `.env` file with:

```sh
NOTION_API_KEY=your_notion_api_key
NOTION_EXERCISE_DB_ID=your_exercise_db_id
NOTION_WORKOUT_DB_ID=your_workout_db_id
NOTION_WORKOUT_ENTRY_DB_ID=your_workout_entry_db_id
PORT=3000
LOG_LEVEL=info
```

### Running the Server

```sh
pnpm run dev
```

## Endpoints

### **Exercises**

- `GET /exercises?limit=10&offset=0` - Returns stored exercises
- `POST /sync` - Syncs exercises from Notion

### **Videos**

- `GET /video/:id` - Fetches cached video for an exercise

### **Workouts**

- `GET /workouts` - Returns stored workouts
- `GET /workout/:id` - Retrieves a single workout with entries
- `POST /sync-workouts` - Syncs workouts from Notion
- `POST /sync-workout-entries` - Syncs workout entries from Notion

## Logging

Uses Pino for structured logging with request tracking and sync status monitoring.

## Notes

- Syncing operations are manual to avoid unnecessary API calls.
- Designed for offline-friendly usage with a PWA integration in mind.
- No user authentication; intended for personal use.

## Next Steps

- Optimize sync to only fetch changed records
- Background job support for sync operations
- UI for managing and editing workouts
