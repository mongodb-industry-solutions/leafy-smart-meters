
import clientPromise from '../../../utils/mongoClient';
const dotenv = require('dotenv');

dotenv.config();

const dbName = process.env.DB_NAME;
const collName1 = process.env.TRANSFORMED_COLLECTION_NAME;
const collName2 = process.env.TRANSFORMED_TS_COLLECTION_NAME;
const collName3 = process.env.ANOMALIES_COLLECTION_NAME;
const collName4 = process.env.ANOMALIES_TS_COLLECTION_NAME;
const metricscoll = process.env.METRICS_TS_COLLECTION_NAME;

export async function GET() {
  try {
    const client = await clientPromise;

    const db = client.db(dbName);
    const metricsTSCollection = db.collection(metricscoll); // TS collection

    // Regular collections stats
    const transformedDataStats = await db.command({ collStats: collName1 });
    const anomaliesDataStats = await db.command({ collStats: collName3 });

    // Time series collections stats
    const transformedTSDataStats = await db.command({ collStats: collName2 });
    const anomaliesTSDataStats = await db.command({ collStats: collName4 });

    // Storage sizes in KB
    const transformedStorageSize = transformedDataStats.storageSize / 1000;
    const anomaliesStorageSize = anomaliesDataStats.storageSize / 1000;
    const transformedTSStorageSize = transformedTSDataStats.storageSize / 1000;
    const anomaliesTSStorageSize = anomaliesTSDataStats.storageSize / 1000;

    const metricsDocument = {
      ts: new Date(),
      ts_size: transformedTSStorageSize,
      reg_size: transformedStorageSize,
    };
    await metricsTSCollection.insertOne(metricsDocument);

    return new Response(
      JSON.stringify({
        transformedStorageSize,
        transformedTSStorageSize,
        anomaliesStorageSize,
        anomaliesTSStorageSize,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error connecting to database or fetching data:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
