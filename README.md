# Leafy Smart Meters

This demo will showcase integration with MQTT providers like Cedalo, statistical analysis with change streams to identify anomalies in data and also highlighting some benefits of time series collections 

## Step 0. Setup MQTT Broker

First, setup your MQTT broker. Lets use [Cedalo](https://cedalo.com/mqtt-broker-pro-mosquitto/) which has a MongoDB extension.

Install Cedalo pro Mosquitto broker from here: <https://cedalo.com/mqtt-broker-pro-mosquitto/trial-signup/?trialType=onPremise>. A more detailed manual can be found here: <https://docs.cedalo.com/mosquitto/getting-started/onprem/>

Setup MongoDB extension using this doc <https://docs.cedalo.com/mosquitto/broker/Mosquitto%20Manual/Bridges/mosquitto-mongodb-bridge> 

Edit your MongoDB Bridge configuration `mosquitto/data/mongodb-bridge.json` as follows

```
[
    {
        "name": "connection-to-mongodb",
        "mongodb": {
            "connectionURI": "YOUR_MONGODB_URI",
            "queueSize": 100000,
            "reconnectMinDelay": 5,
            "reconnectMaxDelay": 25000
        },
        "schemaMappings": [
            {
                "name": "reduced-mapping",
                "schema": {
                    "data": "payload",
                    "nodeId": "hostname",
                    "createdAt": "timestamp"
                }
            }
        ],
        "topicMappings": [
            {
                "name": "topic-mapping",
                "collection": "raw_data",
                "schema": "reduced-mapping",
                "topics": ["smartmeter/data"]
            }
        ]
    }
]
```

Run the Management Server as per the instructions here <https://docs.cedalo.com/mosquitto/getting-started/onprem> 

Open the Management Center via <http://localhost:8088/> and use the default credentials:

* Username: `cedalo`
* Password: `mmcisawesome`

To access the logs use the following command from the root folder:

```sh
docker-compose logs
```


## Step 1. Configure Environment Variables

To run this project, you will need to create an `.env` file:


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
RAW_DATA_COLLECTION_NAME=raw_data
```

Replace the placeholder values with your actual configuration values.

## Step 2. Run the Demo

Make sure the MQTT Broker is running

### Install Dependencies
- In `/smart-meter-frontend`

```
npm i
```

### Run Server

```
npm run dev
```
Use a browser to open the link http://localhost:3000/

Click on "Start Simulation" to start the demo. You will see raw data as well as anomaly data coming in. At the bottom of the page, you will find some metrics around compression in Time Series Collection. Important to note here is that performance metrics depend on many factors including how they are calculated in the application. This example is showing just one simple method of calculating these metrics.



