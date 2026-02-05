import clientPromise from "../../../../utils/mongoClient";
import dotenv from "dotenv";
dotenv.config();

const dbName = process.env.DB_NAME;
const tsCollection = process.env.TRANSFORMED_TS_COLLECTION_NAME;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "40.75");
  const lng = parseFloat(searchParams.get("lng") || "-73.95");
  const radiusKm = parseFloat(searchParams.get("radius") || "5");

  const pipeline = [
    {
      $match: {
        "metadata.location": {
          $geoWithin: {
            $centerSphere: [[lng, lat], radiusKm / 6378.1],
          },
        },
      },
    },
    {
      $group: {
        _id: "$metadata.meter_id",
        latest_timestamp: { $max: "$timestamp" },
        latest_voltage: { $last: "$voltage" },
        reading_count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        meter_id: "$_id",
        latest_timestamp: 1,
        latest_voltage: 1,
        reading_count: 1,
      },
    },
    { $sort: { meter_id: 1 } },
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
