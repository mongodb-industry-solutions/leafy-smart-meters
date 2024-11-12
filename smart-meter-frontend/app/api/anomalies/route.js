
import clientPromise from '../../../utils/mongoClient';
const dotenv = require('dotenv');


dotenv.config();

const dbName = process.env.DB_NAME;
const collName = process.env.ANOMALIES_TS_COLLECTION_NAME;

let anomaliesData = [];

async function fetchAnomaliesData() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const anomaliesCollection = db.collection(collName);
    anomaliesData = await anomaliesCollection.find().sort({ timestamp: -1 }).limit(100).toArray();
  } catch (error) {
    console.error('Error connecting to database or fetching data:', error);
  }
}

fetchAnomaliesData();

// Refresh the data every 60 seconds
setInterval(fetchAnomaliesData, 60000);

export async function GET() {
  return new Response(JSON.stringify(anomaliesData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
