import mqtt from 'mqtt';
import dotenv from 'dotenv';
dotenv.config();


const options = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

const client = mqtt.connect(process.env.MQTT_BROKER, options);

client.on('connect', () => {
  console.log('Connected to MQTT Broker');
  client.subscribe(process.env.MQTT_TOPIC, (err) => {
    if (err) {
      console.error('Failed to subscribe to topic:', err);
    } else {
      console.log('Subscribed to smartmeter/data');
    }
  });
});

client.on('error', (err) => {
  console.error('Connection error:', err);
  client.end();
});

export default client;
