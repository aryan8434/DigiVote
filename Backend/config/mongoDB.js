const mongoose = require("mongoose");

async function main() {
  const uri = process.env.MONGO_KEY;
  if (!uri) {
    throw new Error("MONGO_KEY is not set in environment variables.");
  }

  await mongoose.connect(uri, {
    // Keeps behavior predictable if Atlas is unreachable.
    serverSelectionTimeoutMS: 10000,
    dbName: process.env.MONGO_DB_NAME || "digi",
  });
}

module.exports = main;
