import clientPromise from "../../../../utils/mongoClient";
import dotenv from "dotenv";
dotenv.config();

const dbName = process.env.DB_NAME;
const tsCollection = process.env.TRANSFORMED_TS_COLLECTION_NAME;

export async function GET() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const pipeline = [
    { $match: { timestamp: { $gte: oneDayAgo } } },
    {
      $group: {
        _id: "$metadata.meter_id",
        first_voltages: { $firstN: { input: "$voltage", n: 3 } },
        last_voltages: { $lastN: { input: "$voltage", n: 3 } },
        min_voltages: { $minN: { input: "$voltage", n: 1 } },
        max_voltages: { $maxN: { input: "$voltage", n: 1 } },
        bottom_voltages: {
          $bottomN: {
            n: 3,
            sortBy: { voltage: 1 },
            output: "$voltage",
          },
        },
        top_voltages: {
          $topN: {
            n: 3,
            sortBy: { voltage: -1 },
            output: "$voltage",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        meter_id: "$_id",
        first_voltages: 1,
        last_voltages: 1,
        min_voltages: 1,
        max_voltages: 1,
        bottom_voltages: 1,
        top_voltages: 1,
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
