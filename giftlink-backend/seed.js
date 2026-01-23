require('dotenv').config();
const fs = require('fs');
const connectToDatabase = require('./models/db');

async function seedGifts() {
  const db = await connectToDatabase();
  const collection = db.collection('gifts');

  const dataFile = JSON.parse(fs.readFileSync('gifts.json', 'utf-8'));

  // Use the array inside "docs"
  const data = dataFile.docs;

  if (!Array.isArray(data)) {
    console.error("Error: 'docs' is not an array in gifts.json");
    process.exit(1);
  }

  // Clear existing data
  await collection.deleteMany({});

  // Insert new data
  await collection.insertMany(data);

  console.log('Seed completed');
  process.exit();
}

seedGifts().catch(err => {
  console.error(err);
  process.exit(1);
});
