import clientPromise from "../../../../utils/mongoClient";
import dotenv from "dotenv";
dotenv.config();

const dbName = process.env.DB_NAME;
const tsCollection = process.env.TRANSFORMED_TS_COLLECTION_NAME;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const meterId = parseInt(searchParams.get("meterId") || "1");
  const windowMinutes = parseInt(searchParams.get("window") || "10");
  const stepSeconds = parseInt(searchParams.get("step") || "1");

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const coll = db.collection(tsCollection);

    const endTime = new Date();
    const rawStart = new Date(endTime.getTime() - windowMinutes * 60 * 1000);

    // Find the first real reading in the window
    const firstReal = await coll.findOne(
      { "metadata.meter_id": meterId, timestamp: { $gte: rawStart, $lte: endTime } },
      { sort: { timestamp: 1 }, projection: { timestamp: 1, _id: 0 } }
    );

    const startTime = firstReal ? firstReal.timestamp : rawStart;

    const pipeline = [
      {
        $match: {
          "metadata.meter_id": meterId,
          timestamp: { $gte: startTime, $lte: endTime },
        },
      },
      {
        $group: {
          _id: { meter_id: "$metadata.meter_id", ts: "$timestamp" },
          voltage: { $avg: "$voltage" },
          current: { $avg: "$current" },
          isSynthetic: { $first: false },
        },
      },
      {
        $project: {
          _id: 0,
          meter_id: "$_id.meter_id",
          timestamp: "$_id.ts",
          voltage: 1,
          current: 1,
          isSynthetic: 1,
        },
      },
      {
        $densify: {
          field: "timestamp",
          range: {
            step: stepSeconds,
            unit: "second",
            bounds: [startTime, endTime],
          },
          partitionByFields: ["meter_id"],
        },
      },
      { $set: { isSynthetic: { $ifNull: ["$isSynthetic", true] } } },
      { $sort: { timestamp: 1 } },
      {
        $fill: {
          sortBy: { timestamp: 1 },
          output: {
            voltage: { method: "locf" },
            current: { method: "linear" },
          },
        },
      },
      { $limit: 100 },
      {
        $project: {
          _id: 0,
          timestamp: 1,
          voltage: 1,
          current: 1,
          isSynthetic: 1,
        },
      },
    ];

    const results = await coll.aggregate(pipeline).toArray();

    return Response.json({ pipeline, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
