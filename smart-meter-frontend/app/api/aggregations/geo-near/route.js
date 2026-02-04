import clientPromise from "../../../../utils/mongoClient";
import dotenv from "dotenv";
dotenv.config();

const dbName = process.env.DB_NAME;
const tsCollection = process.env.TRANSFORMED_TS_COLLECTION_NAME;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "40.75");
  const lng = parseFloat(searchParams.get("lng") || "-73.95");

  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        key: "metadata.location",
        distanceField: "dist_m",
        spherical: true,
      },
    },
    { $limit: 5 },
    {
      $project: {
        _id: 0,
        timestamp: 1,
        meter_id: "$metadata.meter_id",
        voltage: 1,
        current: 1,
        power: 1,
        dist_m: 1,
        location: "$metadata.location",
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
