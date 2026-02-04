import clientPromise from "../../../../utils/mongoClient";
import dotenv from "dotenv";
dotenv.config();

const dbName = process.env.DB_NAME;
const tsCollection = process.env.TRANSFORMED_TS_COLLECTION_NAME;
const stdCollection = process.env.TRANSFORMED_COLLECTION_NAME;

export async function GET() {
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

  const pipeline = [
    { $match: { timestamp: { $gte: twelveHoursAgo } } },
    {
      $group: {
        _id: "$metadata.meter_id",
        avg_voltage: { $avg: "$voltage" },
      },
    },
    { $project: { _id: 0, meter_id: "$_id", avg_voltage: 1 } },
  ];

  try {
    const client = await clientPromise;
    const db = client.db(dbName);

    // Time Series collection
    const tsStart = Date.now();
    const tsData = await db.collection(tsCollection).aggregate(pipeline).toArray();
    const tsTime = Date.now() - tsStart;
    const tsExplain = await db.command({
      aggregate: tsCollection,
      pipeline,
      explain: true,
    });

    // Standard collection
    const stdStart = Date.now();
    const stdData = await db.collection(stdCollection).aggregate(pipeline).toArray();
    const stdTime = Date.now() - stdStart;
    const stdExplain = await db.command({
      aggregate: stdCollection,
      pipeline,
      explain: true,
    });

    return Response.json({
      pipeline,
      tsResult: { data: tsData, queryTime: tsTime, explain: tsExplain },
      stdResult: { data: stdData, queryTime: stdTime, explain: stdExplain },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
