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
import Button from "@leafygreen-ui/button";

export default function Home() {
  const [meters, setMeters] = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [dataSize, setDataSize] = useState({});
  const [metrics, setMetrics] = useState({});
  const maxAnomalies = 10; // Limit the number of anomalies displayed
  const [isRunning, setIsRunning] = useState(false); // For start/stop simulation button
  const iframeSrc = process.env.NEXT_PUBLIC_APP_IFRAME_SRC;

  const handleButtonClick = async () => {
    if (isRunning) {
      await axios.get('/api/simulation/stop');
      setIsRunning(false);
    } else {
      await axios.get('/api/simulation/start');
      setIsRunning(true);
      // Automatically stop the simulation after 5 minutes
      setTimeout(async () => {
        await axios.get('/api/simulation/stop');
        setIsRunning(false);
      }, 2 * 60 * 1000); // 2 minutes in milliseconds
    }
  };

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

    if (isRunning) {
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
    }
  }, [isRunning]);

  return (
    <div className="app-container">
      <div className="container">
        <H1>Smart Meter Demo</H1>
        <Body className="body">
          This demo simulates 5 smart meters sending data every 5 seconds - The meters are sending data to MongoDB via Cedalo's MongoDB Bridge to MongoDB
        </Body>
        <Body className="body">
Click on Start Simulation to run the demo. The simulation will auto stop after 2 minutes.   
</Body>
        {!isRunning && (
          <div className="button-container">
            <Button
              className="simulation-button"
              variant="baseGreen"
              onClick={handleButtonClick}
            >
              Start Simulation
            </Button>
          </div>
        )}

        {isRunning && (
          <>
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
            <Body className="explanation">
              Anomalies are calculated by comparing the current reading of a meter against the rolling average and standard deviation of the last 24 hour readings for various metrics (voltage, current, power, etc.). If the current reading deviates from the average by more than three times the standard deviation, it is flagged as an anomaly.
            </Body>
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
            <Banner className="banner">
              <b>MongoDB's Time Series </b>offers significant benefits, including a high compression ratio and fast read/write operations.
              <a href="https://www.mongodb.com/products/capabilities/time-series">Find out more</a>&nbsp;
            </Banner>
            <div className="data-size">
              <div className="data-size-card">
                <Badge>Regular Collection</Badge>
                <h4> Data Storage Size (without bucketing)</h4>
                <p>{dataSize.transformedStorageSize} KB</p>
              </div>
              <div className="data-size-card">
                <Badge variant="green">Time Series Collection</Badge>
                <h4> Data Storage Size</h4>
                <p>{dataSize.transformedTSStorageSize} KB</p>
              </div>
              <div className="data-size-card">
                <Badge>Regular Collections</Badge>
                <h4>Data Storage Size (without bucketing)</h4>
                <p>{dataSize.anomaliesStorageSize} KB</p>
              </div>
              <div className="data-size-card">
                <Badge variant="green">Time Series Collection</Badge>
                <h4>Data Storage Size</h4>
                <p>{dataSize.anomaliesTSStorageSize} KB</p>
              </div>
            </div>
            <div>
              <iframe
                className="charts"
                src={iframeSrc}
              ></iframe>
            </div>
           {/* <H3 className="h3">Other Metrics</H3>
            <div className="metrics">
              <div className="metrics-card">
                <h4>Write Speed</h4>
                <p>{metrics.writeSpeed} ms</p>
              </div>
              <div className="metrics-card">
                <h4>Read Speed</h4>
                <p>{metrics.readSpeed} ms</p>
              </div>
                  </div>*/}
          </>
        )}
      </div>
      <footer className="footer">
        <p>A Smart Meter System demo developed by Industry Solutions Team at MongoDB</p>
      </footer>
    </div>
  );
}
