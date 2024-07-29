const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const transformedDataCollectionName = process.env.TRANSFORMED_COLLECTION_NAME;
const transformedDataCollectionTSName = process.env.TRANSFORMED_TS_COLLECTION_NAME;
const anomaliesTSCollectionName = process.env.ANOMALIES_TS_COLLECTION_NAME;
const anomaliesCollectionName = process.env.ANOMALIES_COLLECTION_NAME;
const rawdata = process.env.RAW_DATA_COLLECTION_NAME;
const client = new MongoClient(uri);

// size of the sliding window
const SLIDING_WINDOW_SIZE = 48;

// metrics object to store read and write speeds
let metrics = {
  writeSpeed: 0,
  readSpeed: 0
};

async function updateSummaryAndDetectAnomalies(change) {
  const database = client.db(dbName);
  const summaryCollection = database.collection(transformedDataCollectionName);
  const summaryTSCollection = database.collection(transformedDataCollectionTSName); // TS collection
  const anomaliesCollection = database.collection(anomaliesCollectionName);
  const anomaliesTSCollection = database.collection(anomaliesTSCollectionName); // TS collection

  const doc = change.fullDocument;

 // console.log('Processing change:', doc);

  // Parse the JSON string in the 'data' field
  let meterData;
  try {
    meterData = JSON.parse(doc.data);
  } catch (error) {
    console.error('Error parsing meter data:', error);
    return;
  }

  //console.log('Parsed meter data:', meterData);

  // write speed
  const writeStart = Date.now();
  
  const summaryDocument = {
    meter_id: meterData.meter_id,
    timestamp: new Date(meterData.timestamp * 1000),
    voltage: parseFloat(meterData.voltage),
    current: parseFloat(meterData.current),
    power: parseFloat(meterData.power),
    energy: parseFloat(meterData.energy),
    power_factor: parseFloat(meterData.power_factor),
    frequency: parseFloat(meterData.frequency)
  };

  await summaryTSCollection.insertOne(summaryDocument);
  const writeEnd = Date.now();
  await summaryCollection.insertOne(summaryDocument);


  metrics.writeSpeed = writeEnd - writeStart;

  //  read speed
  const readStart = Date.now();
  
  const recentDataPoints = await summaryCollection.find({ meter_id: meterData.meter_id })
    .sort({ timestamp: -1 })
    .limit(SLIDING_WINDOW_SIZE)
    .toArray();

  const readEnd = Date.now();
  metrics.readSpeed = readEnd - readStart;

  if (recentDataPoints.length < SLIDING_WINDOW_SIZE) {
    console.log(`Not enough data points yet for meter ${meterData.meter_id}. Need ${SLIDING_WINDOW_SIZE - recentDataPoints.length} more.`);
    return;
  }

  const metricsArray = ['voltage', 'current', 'power', 'energy', 'power_factor', 'frequency'];

  // rolling averages and standard deviations
  const stats = metricsArray.reduce((acc, metric) => {
    const values = recentDataPoints.map(dp => dp[metric]);
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    const stddev = Math.sqrt(values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length);
    acc[metric] = { avg, stddev };
    return acc;
  }, {});

  //console.log(`Calculated stats for meter ${meterData.meter_id}:`, stats);

  // checking for anomalies based on standard deviation .  can change 3 to some other number if needed
  const anomalies = metricsArray.reduce((acc, metric) => {
    const value = parseFloat(meterData[metric]);
    const { avg, stddev } = stats[metric];
    if (stddev && Math.abs(value - avg) > 3 * stddev) {
      acc.push(metric);
    }
    return acc;
  }, []);

  if (anomalies.length > 0) {
    const anomaly = {
      meter_id: meterData.meter_id,
      timestamp: new Date(meterData.timestamp * 1000),
      anomalies,
      data: meterData,
    };

    // insert the anomaly into the anomalies collections
    await anomaliesCollection.insertOne(anomaly);
    await anomaliesTSCollection.insertOne(anomaly);

    console.log('Anomaly detected and stored:', anomaly);
  }
}

async function monitorAnomalies() {
  try {
    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection(rawdata);

    // Open a change stream on the collection
    const changeStream = collection.watch();

    console.log('Watching for anomalies...');

    // Process each change
    changeStream.on('change', async change => {
      if (change.operationType === 'insert') {
        await updateSummaryAndDetectAnomalies(change);
      }
    });

  } catch (error) {
    console.error(error);
  }
}

monitorAnomalies().catch(console.error);

// export metrics for API endpoint
module.exports.getMetrics = () => metrics;
