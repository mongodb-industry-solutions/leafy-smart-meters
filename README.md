# Leafy Smart Meters

This demo will showcase integration with MQTT providers like Cedalo, statistical analysis with change streams to identify anomalies in data and also highlighting some benefits of time series collections 

## Step 0. Setup MQTT Broker

First, setup your MQTT broker. You can use something like [Cedalo](https://cedalo.com/mqtt-broker-pro-mosquitto/) which has a MongoDB extension.

## Step 1. Configure Environment Variables

To run this project, you will need to create two `.env` files:

- In `/smart-meter-simulator` add:

```env
MQTT_BROKER=<YOUR_MQTT_BROKER>
MQTT_USERNAME=<YOUR_MQTT_USERNAME>
MQTT_PASSWORD=<YOUR_MQTT_PASSWORD>
MQTT_TOPIC=smartmeter/data
```

- In `/smart-meter-frontend` add:

```env
MQTT_BROKER=<YOUR_MQTT_BROKER_URL>
MQTT_USERNAME=<YOUR_MQTT_USERNAME>
MQTT_PASSWORD=<YOUR_MQTT_PASSWORD>
MQTT_TOPIC=smartmeter/data
MONGODB_URI=<YOUR_MONGODB_URI>
DB_NAME=<YOUR_DB_NAME>
ANOMALIES_TS_COLLECTION_NAME=<YOUR_ANOMALIES_TS_COLLECTION_NAME>
ANOMALIES_COLLECTION_NAME=<YOUR_ANOMALIES_COLLECTION_NAME>
TRANSFORMED_COLLECTION_NAME=<YOUR_TRANSFORMED_COLLECTION_NAME>
TRANSFORMED_TS_COLLECTION_NAME=<YOUR_TRANSFORMED_TS_COLLECTION_NAME>
RAW_DATA_COLLECTION_NAME=<YOUR_RAW_DATA_COLLECTION_NAME>
```

Replace the placeholder values with your actual configuration values.

## Step 2. Run the Demo

### Install Dependencies

```
npm i
```

### Run Server

```
npm run dev
```
Use a browser to open the link http://localhost:3000/

