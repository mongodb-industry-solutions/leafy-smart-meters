
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || '';

let client;
let clientPromise;

// Only create MongoDB client if URI is provided
if (uri && !clientPromise) {
  client = new MongoClient(uri);
  clientPromise = client.connect();
} else if (!uri) {
  // Create a dummy promise for build time
  clientPromise = Promise.resolve(null);
}

export default clientPromise;
