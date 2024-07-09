import client from '../../../utils/mqttClient';

let meterData = {};

client.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());
  meterData[data.meter_id] = data;
  //console.log(`Received data for meter ${data.meter_id}:`, data);
});

export async function GET() {
  return new Response(JSON.stringify(meterData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}



