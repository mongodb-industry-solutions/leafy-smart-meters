const mqtt = require('mqtt');
const dotenv = require('dotenv');

dotenv.config();


const BROKER_ADDRESS = process.env.BROKER_ADDRESS;
const TOPIC = process.env.MQTT_TOPIC;

const options = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

const meters = 5; // Start publishing data for 5 meters
const simulationDelay = 5000; // Publish data every 5 seconds



// daily readings for a household
function generateTypicalMeterData(meter_id, halfHour) {
  let baseVoltage = 220;
  let baseCurrent = 0;
  if (halfHour >= 12 && halfHour < 18) {
    baseCurrent = 5;  // morning 
  } else if (halfHour >= 36 && halfHour < 44) {
    baseCurrent = 8;  // evening 
  } else {
    baseCurrent = 1;  // offpeak 
  }
  let voltage = baseVoltage + Math.random() * 2 - 1;  // small random fluctuation
  let current = baseCurrent + Math.random() * 0.2 - 0.1;  // small random fluctuation
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

// Generate anomalous readings
function generateAnomalousMeterData(meter_id) {
  let voltage = Math.random() > 0.5 ? 240 + Math.random() * 10 : 200 - Math.random() * 10;
  let current = 15 + Math.random() * 5;
  let power = voltage * current;
  let energy = power / 1000;  // Simplified energy calculation
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

function publishMeterData(client, meter_id) {
  let halfHour = 0;
  const publishData = () => {
    if (halfHour >= 48) {
      halfHour = 0; // Reset after a full day
    }
    let data;
    if (Math.random() < 0.05) {  // 5% chance to generate an anomaly
      data = generateAnomalousMeterData(meter_id);
      console.log(`Publishing anomalous data for meter ${meter_id}:`, data);
    } else {
      data = generateTypicalMeterData(meter_id, halfHour);
      console.log(`Publishing typical data for meter ${meter_id} at half-hour ${halfHour}:`, data);
    }
    client.publish(TOPIC, JSON.stringify(data));
    halfHour++;
  };

  setInterval(publishData, simulationDelay); 
}

function startSimulation() {
  const client = mqtt.connect(BROKER_ADDRESS, options);

  client.on('connect', () => {
    console.log('Connected to MQTT Broker');
    
    for (let meter_id = 1; meter_id <= meters; meter_id++) {
      publishMeterData(client, meter_id);
    }
  });

  client.on('error', (err) => {
    console.error('Connection error:', err);
    client.end();
  });

  process.on('SIGINT', () => {
    console.log('Simulator process terminated');
    client.end();
    process.exit(0);
  });
}

// Start the simulation
startSimulation();