import client from '../../../utils/mqttClient';
import clientPromise from '../../../utils/mongoClient';
const dotenv = require('dotenv');

dotenv.config();

const USE_MQTT_BROKER = process.env.USE_MQTT_BROKER !== 'false';
const dbName = process.env.DB_NAME;
const rawDataCollectionName = process.env.RAW_DATA_COLLECTION_NAME;

let meterData = {};

// MQTT mode: Listen to MQTT messages

if (USE_MQTT_BROKER && client) {
  client.on('message', (topic, message) => {
    const data = JSON.parse(message.toString());
    meterData[data.meter_id] = data;
    //console.log(`Received data for meter ${data.meter_id}:`, data);
  });
}

// Direct mode: Fetch from MongoDB
async function fetchMeterDataFromMongoDB() {
  try {
    const client = await clientPromise;

    // Return empty data if MongoDB is not configured
    if (!client) {
      console.log("MongoDB not configured. Returning empty data.");
      return {};
    }
    const db = client.db(dbName);
    const collection = db.collection(rawDataCollectionName);
    
    // Get latest data for each meter from raw_data collection
    const pipeline = [
      { $sort: { timestamp: -1 } },
      { 
        $group: {
          _id: { $toInt: { $jsonSchema: { bsonType: "string" } } },
          latestDoc: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$latestDoc" } },
      { $limit: 5 } // Get latest for up to 5 meters
    ];
    
    // Simpler approach: get recent documents and group by meter_id
    const recentDocs = await collection.find({}).sort({ timestamp: -1 }).limit(50).toArray();
    const directMeterData = {};
    
    recentDocs.forEach(doc => {
      try {
        // Parse the JSON data field (same format as MQTT bridge stores)
        const meterData = JSON.parse(doc.data);
        const meterId = meterData.meter_id;
        
        // Keep only the latest data for each meter
        if (!directMeterData[meterId] || meterData.timestamp > directMeterData[meterId].timestamp) {
          directMeterData[meterId] = meterData;
        }
      } catch (parseError) {
        console.error("Error parsing meter data JSON:", parseError);
      }
    });
    
    return directMeterData;
  } catch (error) {
    console.error("Error fetching meter data from MongoDB:", error);
    return {};
  }
}

export async function GET() {
  let responseData;
  
  if (USE_MQTT_BROKER) {
    // MQTT mode: return cached MQTT data
    responseData = meterData;
  } else {
    // Direct mode: fetch from MongoDB
    responseData = await fetchMeterDataFromMongoDB();
  }
  
  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}



