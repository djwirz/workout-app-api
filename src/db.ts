import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function getDBConnection() {
  return open({
    filename: "./workout.db",
    driver: sqlite3.Database,
  });
}
