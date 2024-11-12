# Leafy Smart Meters

This demo will showcase integration with MQTT providers like Cedalo, statistical analysis with change streams to identify anomalies in data and also highlighting some benefits of time series collections 

## Step 0. Setup MQTT Broker

First, setup your MQTT broker. Lets use [Cedalo](https://cedalo.com/mqtt-broker-pro-mosquitto/) which has a MongoDB extension.

Install Cedalo pro Mosquitto broker from [here](https://cedalo.com/mqtt-broker-pro-mosquitto/trial-signup/?trialType=onPremise). A more detailed manual can be found [here](https://docs.cedalo.com/mosquitto/getting-started/onprem/)

Setup MongoDB extension using this [doc](https://docs.cedalo.com/mosquitto/bridges/mongodb-bridge) 

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
METRICS_TS_COLLECTION_NAME=metrics_ts
NEXT_PUBLIC_APP_IFRAME_SRC=<YOUR_ATLAS_CHARTS_IFRAME_SRC_URL>
```

Replace the placeholder values with your actual configuration values. You would have to create a MongoDB database and respective collections. Do note that the variables with TS in their names are time series collections. So ANOMALIES_TS_COLLECTION_NAME, METRICS_TS_COLLECTION_NAME and TRANSFORMED_TS_COLLECTION_NAME have to be setup as TS collections in MongoDB

## Step 2. Run the Demo

Make sure the MQTT Broker is running


### Integrating Atlas Charts
To integrate Atlas Charts, you will need to create a charts dashboard on MongoDB Atlas and copy the iframe link into the `NEXT_PUBLIC_APP_IFRAME_SRC` in your .env file. Follow this [tutorial](https://www.mongodb.com/docs/charts/embedding-charts-iframe/) on how to get the iframe link from Atlas Charts.

We have included a `Smart Meters.charts` file in [public](https://github.com/mongodb-industry-solutions/Leafy-Smart-Meters/tree/main/smart-meter-frontend/public) folder. You can use that. Just follow this [tutorial](https://www.mongodb.com/docs/charts/dashboards/dashboard-import-export) on how to import Charts and link the Atlas charts dashboard to your metrics_ts collection. 


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

Note that by default, the probablity of anomaly coming in is only 20%. So there will be cases where you dont see anomalies. If you want to increase the probability, just increase the value `0.20` in `Leafy-Smart-Meters/smart-meter-frontend/utils/simulation.js` line 82.


