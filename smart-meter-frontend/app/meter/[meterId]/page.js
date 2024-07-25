"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Meter({ params }) {
  const { meterId } = params;
  const [meterData, setMeterData] = useState(null);

  useEffect(() => {
    const fetchMeterData = async () => {
      if (meterId) {
        //const response = await axios.get('/api/meterData');
       // setMeterData(response.data[meterId]);
      }
    };

    const intervalId = setInterval(fetchMeterData, 5000);
    return () => clearInterval(intervalId);
  }, [meterId]);

  if (!meterData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Smart Meter {meterId}</h1>
      <table>
        <thead>
          <tr>
            <th>Meter ID</th>
            <th>Timestamp</th>
            <th>Voltage (V)</th>
            <th>Current (A)</th>
            <th>Power (W)</th>
            <th>Energy (kWh)</th>
            <th>Power Factor</th>
            <th>Frequency (Hz)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{meterData.meter_id}</td>
            <td>{new Date(meterData.timestamp * 1000).toLocaleString()}</td>
            <td>{meterData.voltage}</td>
            <td>{meterData.current}</td>
            <td>{meterData.power}</td>
            <td>{meterData.energy}</td>
            <td>{meterData.power_factor}</td>
            <td>{meterData.frequency}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
