import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collName = process.env.ANOMALIES_TS_COLLECTION_NAME;

const client = new MongoClient(uri);

let anomaliesData = [];

async function fetchAnomaliesData() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const anomaliesCollection = db.collection(collName);
    anomaliesData = await anomaliesCollection.find().sort({ timestamp: -1 }).limit(100).toArray();
  } catch (error) {
    console.error('Error connecting to database or fetching data:', error);
  } finally {
    await client.close();
  }
}

fetchAnomaliesData();

//  refresh the data every 60 secs
setInterval(fetchAnomaliesData, 60000); 

export async function GET() {
  return new Response(JSON.stringify(anomaliesData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
