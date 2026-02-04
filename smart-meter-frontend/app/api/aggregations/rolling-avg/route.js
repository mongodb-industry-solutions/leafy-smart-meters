import clientPromise from "../../../../utils/mongoClient";
import dotenv from "dotenv";
dotenv.config();

const dbName = process.env.DB_NAME;
const tsCollection = process.env.TRANSFORMED_TS_COLLECTION_NAME;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const meterId = parseInt(searchParams.get("meterId") || "1");

  const pipeline = [
    { $match: { "metadata.meter_id": meterId } },
    { $sort: { timestamp: 1 } },
    { $limit: 50 },
    {
      $setWindowFields: {
        partitionBy: "$metadata.meter_id",
        sortBy: { timestamp: 1 },
        output: {
          rolling_avg_voltage: {
            $avg: "$voltage",
            window: { range: [-300, 0], unit: "second" },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        timestamp: 1,
        voltage: 1,
        rolling_avg_voltage: 1,
        meter_id: "$metadata.meter_id",
      },
    },
  ];

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const results = await db.collection(tsCollection).aggregate(pipeline).toArray();

    return Response.json({ pipeline, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
