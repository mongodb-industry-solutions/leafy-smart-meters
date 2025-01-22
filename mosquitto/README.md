# Setup your MQTT Broker

First, setup your MQTT broker. Lets use [Cedalo](https://cedalo.com/mqtt-broker-pro-mosquitto/) which has a MongoDB extension.

Install Cedalo Pro Mosquitto broker from [here](https://cedalo.com/mqtt-broker-pro-mosquitto/trial-signup/?trialType=onPremise). A more detailed manual can be found [here](https://docs.cedalo.com/mosquitto/getting-started/onprem/)

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

- Username: `cedalo`
- Password: `mmcisawesome`

To access the logs use the following command from the root folder:

```sh
docker-compose logs
```
