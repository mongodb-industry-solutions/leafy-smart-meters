import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collName1 = process.env.TRANSFORMED_COLLECTION_NAME;
const collName2 = process.env.TRANSFORMED_TS_COLLECTION_NAME;
const metricscoll = process.env.METRICS_TS_COLLECTION_NAME;

const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const metricsTSCollection = db.collection(metricscoll); // TS collection

    // regular collections stat
    const transformedDataStats = await db.command({ collStats: collName1 });
    const anomaliesDataStats = await db.command({ collStats: collName1 });

    // time series collections stat
    const transformedTSDataStats = await db.command({ collStats: collName2 });
    const anomaliesTSDataStats = await db.command({ collStats: collName2 });

    // storage size for regular collections
    const transformedStorageSize = transformedDataStats.storageSize / 1000;
    //const transformedStorageSize = transformedDataStats.latencyStats.writes;

    const anomaliesStorageSize = anomaliesDataStats.storageSize / 1000;

    // storage size for time series collections
    const transformedTSStorageSize = transformedTSDataStats.storageSize / 1000;
    const anomaliesTSStorageSize = anomaliesTSDataStats.storageSize / 1000;


    const metricsDocument = {
      ts: new Date(),
      ts_size: transformedTSStorageSize,
      reg_size: transformedStorageSize
    };
    await metricsTSCollection.insertOne(metricsDocument);


    return new Response(JSON.stringify({
      transformedStorageSize,
      transformedTSStorageSize,
      anomaliesStorageSize,
      anomaliesTSStorageSize
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error connecting to database or fetching data:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } finally {
    await client.close();
  }
}
