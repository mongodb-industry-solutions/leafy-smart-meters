"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.css';

export default function Home() {
  const [meters, setMeters] = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [dataSize, setDataSize] = useState({});
  const [metrics, setMetrics] = useState({});
  const maxAnomalies = 10; // Limit the number of anomalies displayed

  useEffect(() => {
    const fetchMeterData = async () => {
      const response = await axios.get('/api/meterData');
      setMeters(response.data);
    };

    const fetchAnomaliesData = async () => {
      const response = await axios.get('/api/anomalies');
      setAnomalies(response.data.slice(0, maxAnomalies));
    };

    const fetchDataSize = async () => {
      const response = await axios.get('/api/dataSize');
      setDataSize(response.data);
    };

    const fetchMetricsData = async () => {
      const response = await axios.get('/api/metrics');
      setMetrics(response.data);
    };

    fetchMeterData();
    fetchAnomaliesData();
    fetchDataSize();
    fetchMetricsData();

    const intervalId = setInterval(() => {
      fetchMeterData();
      fetchAnomaliesData();
      fetchDataSize();
      fetchMetricsData();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="app-container">
      <div className="container">
        <h1>Smart Meter Headend System</h1>
        <h2>Recent Meter Data</h2>
        <p>This demo simulates 5 smart meters sending data every 5 seconds - The meters are sending data via MQTT protocol to MongoDB</p>
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
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(meters).map((meter) => (
              <tr key={meter.meter_id}>
                <td>{meter.meter_id}</td>
                <td>{new Date(meter.timestamp * 1000).toLocaleString()}</td>
                <td>{meter.voltage}</td>
                <td>{meter.current}</td>
                <td>{meter.power}</td>
                <td>{meter.energy}</td>
                <td>{meter.power_factor}</td>
                <td>{meter.frequency}</td>
                <td>{meter.location || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Recent Anomalies</h2>
        <div className="anomalies-table-container">
          <table>
            <thead>
              <tr>
                <th>Meter ID</th>
                <th>Timestamp</th>
                <th>Anomalies</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((anomaly) => (
                <tr key={anomaly._id}>
                  <td>{anomaly.meter_id}</td>
                  <td>{new Date(anomaly.timestamp).toLocaleString()}</td>
                  <td>{anomaly.anomalies.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>MongoDB Time Series Benefits</h2>
        <h4>High Compression Ratio and Fast Reads/Writes</h4>
        <div className="data-size">
          <div>
            <h4>Transformed Data Storage Size (Regular)</h4>
            <p>{dataSize.transformedStorageSize} KB</p>
          </div>
          <div>
            <h4>Transformed Data Storage Size (Time Series)</h4>
            <p>{dataSize.transformedTSStorageSize} KB</p>
          </div>
          <div>
            <h4>Anomalies Storage Size (Regular)</h4>
            <p>{dataSize.anomaliesStorageSize} KB</p>
          </div>
          <div>
            <h4>Anomalies Storage Size (Time Series)</h4>
            <p>{dataSize.anomaliesTSStorageSize} KB</p>
          </div>
        </div>
        <h2>Performance Metrics</h2>
        <div className="metrics">
          <div>
            <h4>Write Speed</h4>
            <p>{metrics.writeSpeed} ms</p>
          </div>
          <div>
            <h4>Read Speed</h4>
            <p>{metrics.readSpeed} ms</p>
          </div>
        </div>
      </div>
      <footer>
        <p>A Smart Meter System demo developed by Industry Solutions Team at MongoDB</p>
      </footer>
    </div>
  );
}
