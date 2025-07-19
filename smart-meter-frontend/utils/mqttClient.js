import mqtt from "mqtt";
import dotenv from "dotenv";
dotenv.config();

const USE_MQTT_BROKER = process.env.USE_MQTT_BROKER === 'true';

let client = null;

if (USE_MQTT_BROKER) {
  const options = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  };

  const client = mqtt.connect(process.env.MQTT_BROKER, options);

  client.on("connect", () => {
    //console.log('Connected to MQTT Broker');
    client.subscribe(process.env.MQTT_TOPIC, (err) => {
      if (err) {
        console.error("Failed to subscribe to topic:", err);
      } else {
        console.log("Subscribed to smartmeter/data");
      }
    });
  });

  client.on("error", (err) => {
    console.error("MQTT client connection error:", err);
    client.end();
  });
} else {
  console.log("MQTT broker is not enabled. Skipping connection.");
}

export default client;
