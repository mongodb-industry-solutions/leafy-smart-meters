import mqtt from "mqtt";
import dotenv from "dotenv";
import clientPromise from "./mongoClient.js";

dotenv.config();

const BROKER_ADDRESS = process.env.MQTT_BROKER;
const TOPIC = process.env.MQTT_TOPIC;
const USE_MQTT_BROKER = process.env.USE_MQTT_BROKER !== 'false';
const DB_NAME = process.env.DB_NAME;
const RAW_DATA_COLLECTION_NAME = process.env.RAW_DATA_COLLECTION_NAME;

const options = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

const meters = 5; // Start publishing data for 5 meters
const simulationDelay = 5000; // Publish data every 5 seconds

let simulationIntervals = [];
let simulationTimeout;
let client = null; // Ensure client is declared here and initialized as null

function generateTypicalMeterData(meter_id, halfHour) {
  let baseVoltage = 220;
  let baseCurrent = 0;
  if (halfHour >= 12 && halfHour < 18) {
    baseCurrent = 5; // morning
  } else if (halfHour >= 36 && halfHour < 44) {
    baseCurrent = 8; // evening
  } else {
    baseCurrent = 1; // offpeak
  }
  let voltage = baseVoltage + Math.random() * 2 - 1; // small random fluctuation
  let current = baseCurrent + Math.random() * 0.2 - 0.1; // small random fluctuation
  let power = voltage * current;
  let energy = power / 1000;
  let power_factor = 0.9 + Math.random() * 0.02 - 0.01;
  let frequency = 49.8 + Math.random() * 0.1 - 0.05;

  return {
    meter_id,
    timestamp: Date.now() / 1000,
    voltage: voltage.toFixed(2),
    current: current.toFixed(2),
    power: power.toFixed(2),
    energy: energy.toFixed(2),
    power_factor: power_factor.toFixed(2),
    frequency: frequency.toFixed(2),
  };
}

function generateAnomalousMeterData(meter_id) {
  let voltage =
    Math.random() > 0.5 ? 240 + Math.random() * 10 : 200 - Math.random() * 10;
  let current = 15 + Math.random() * 5;
  let power = voltage * current;
  let energy = power / 1000;
  let power_factor = Math.random();
  let frequency = 49 + Math.random() * 1;

  return {
    meter_id,
    timestamp: Date.now() / 1000,
    voltage: voltage.toFixed(2),
    current: current.toFixed(2),
    power: power.toFixed(2),
    energy: energy.toFixed(2),
    power_factor: power_factor.toFixed(2),
    frequency: frequency.toFixed(2),
  };
}

async function insertDirectToMongoDB(data) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(RAW_DATA_COLLECTION_NAME);
    
    await collection.insertOne({
      data: JSON.stringify(data),
      timestamp: new Date()
    });
    console.log(`Direct MongoDB insertion for meter ${data.meter_id}`);
  } catch (error) {
    console.error("Error inserting data directly to MongoDB:", error);
  }
}

function publishMeterData(meter_id) {
  let halfHour = 0;
  const interval = setInterval(async () => {
    if (USE_MQTT_BROKER && (!client || client.disconnected)) {
      clearInterval(interval);
      return;
    }
    if (halfHour >= 48) {
      halfHour = 0; // Reset after a full day
    }
    let data;
    if (Math.random() < 0.2) {
      // 20% chance to generate an anomaly
      data = generateAnomalousMeterData(meter_id);
      console.log(`Publishing anomalous data for meter ${meter_id}`);
    } else {
      data = generateTypicalMeterData(meter_id, halfHour);
      console.log(
        `Publishing typical data for meter ${meter_id} at half-hour ${halfHour}:`
      );
    }
    
    if (USE_MQTT_BROKER) {
      client.publish(TOPIC, JSON.stringify(data));
    } else {
      await insertDirectToMongoDB(data);
    }
    halfHour++;
  }, simulationDelay);
  simulationIntervals.push(interval);
}

function startSimulation() {
  console.log(`Starting simulation in ${USE_MQTT_BROKER ? 'MQTT' : 'Direct'} mode`);
  
  if (USE_MQTT_BROKER) {
    // MQTT Mode
    if (!client || client.disconnected) {
      client = mqtt.connect(BROKER_ADDRESS, options);
      console.log("Connected to MQTT ", BROKER_ADDRESS);
      client.on("connect", () => {
        console.log("Connected to MQTT Broker");
        for (let meter_id = 1; meter_id <= meters; meter_id++) {
          publishMeterData(meter_id);
        }

        simulationTimeout = setTimeout(() => {
          stopSimulation();
          console.log("Simulation automatically stopped after 2 minutes");
        }, 2 * 60 * 1000);
      });

      client.on("error", (err) => {
        console.error("MQTT Client connection error during simulation:", err);
        client.end();
      });

      process.on("SIGINT", () => {
        console.log("Simulator process terminated");
        if (client) {
          client.end();
          client = null;
        }
        process.exit(0);
      });
    }
  } else {
    // Direct MongoDB Mode
    console.log("Starting direct MongoDB insertion mode");
    for (let meter_id = 1; meter_id <= meters; meter_id++) {
      publishMeterData(meter_id);
    }

    simulationTimeout = setTimeout(() => {
      stopSimulation();
      console.log("Simulation automatically stopped after 2 minutes");
    }, 2 * 60 * 1000);

    process.on("SIGINT", () => {
      console.log("Simulator process terminated");
      process.exit(0);
    });
  }
}

function stopSimulation() {
  console.log("Stopping simulation...");
  if (simulationIntervals.length > 0) {
    simulationIntervals.forEach(clearInterval);
    simulationIntervals = [];
    console.log("Simulation intervals cleared");
  }
  if (simulationTimeout) {
    clearTimeout(simulationTimeout);
    simulationTimeout = null;
    console.log("Simulation timeout cleared");
  }
  if (client) {
    console.log("Client is connected, disconnecting...");
    client.end(() => {
      console.log("MQTT client disconnected");
      client = null;
    });
  } else {
    console.log("Client is null or already disconnected");
  }
}

export { startSimulation, stopSimulation };
