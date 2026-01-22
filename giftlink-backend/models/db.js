require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'giftsdb';

let db;

async function connectToDatabase() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is undefined');
  }

  if (db) return db;

  const client = new MongoClient(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  db = client.db(DB_NAME);

  return db;
}

module.exports = connectToDatabase;
