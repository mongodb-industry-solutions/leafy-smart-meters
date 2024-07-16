"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.css';
import Banner from "@leafygreen-ui/banner";
import Badge from "@leafygreen-ui/badge";
import {
  H1,
  H2,
  H3,
  Body,
  Subtitle,
  Description,
  Link,
} from "@leafygreen-ui/typography";


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
        <H1>Smart Meter Headend System</H1>
        
        <Body className="body">This demo simulates 5 smart meters sending data every 5 seconds - The meters are sending data via MQTT protocol to MongoDB</Body>
        
        <H3 className="h3">Recent Meter Data</H3>

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
        <H3 className="h3">Recent Anomalies</H3>
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

        <Banner className="banner"> <b>MongoDB's Time Series </b>offers significant benefits, including a high compression ratio and fast read/write operations.
          <a href="https://www.mongodb.com/products/capabilities/time-series">Find out more</a>&nbsp;

        </Banner>

        <div className="data-size">
          <div className="data-size-card">
            <Badge>Regular</Badge>
            <h4>Transformed Data Storage Size</h4>
            <p>{dataSize.transformedStorageSize} KB</p>
          </div>
          <div className="data-size-card">
          <Badge variant="green">Time Series</Badge>
            <h4>Transformed Data Storage Size</h4>
            <p>{dataSize.transformedTSStorageSize} KB</p>
          </div>
          <div className="data-size-card">
          <Badge>Regular</Badge>
            <h4>Anomalies Storage Size</h4>
            <p>{dataSize.anomaliesStorageSize} KB</p>
          </div>
          <div className="data-size-card">
          <Badge variant="green">Time Series</Badge>
            <h4>Anomalies Storage Size</h4>
            <p>{dataSize.anomaliesTSStorageSize} KB</p>
          </div>
        </div>
        <H3 className="h3">Performance Metrics</H3>
        <div className="metrics">
          <div className="metrics-card">
            <h4>Write Speed</h4>
            <p>{metrics.writeSpeed} ms</p>
          </div>
          <div className="metrics-card">
            <h4>Read Speed</h4>
            <p>{metrics.readSpeed} ms</p>
          </div>
        </div>
      </div>
      <footer className="footer">
        <p>A Smart Meter System demo developed by Industry Solutions Team at MongoDB</p>
      </footer>
    </div>
  );
}
