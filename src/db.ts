import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import fs from "fs";

// Ensure the database directory exists
const dbPath = path.resolve(__dirname, "../workout.db");

export async function getDBConnection() {
  // Check if database file exists, create if not
  if (!fs.existsSync(dbPath)) {
    console.log(`Creating new SQLite database at ${dbPath}`);
    fs.writeFileSync(dbPath, "");
  }

  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}
