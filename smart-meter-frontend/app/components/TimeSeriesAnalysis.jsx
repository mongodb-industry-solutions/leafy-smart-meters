"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import { Tabs, Tab } from "@leafygreen-ui/tabs";
import { H3, Body, Subtitle } from "@leafygreen-ui/typography";
import Button from "@leafygreen-ui/button";
import Badge from "@leafygreen-ui/badge";
import Banner from "@leafygreen-ui/banner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./TimeSeriesAnalysis.module.css";

export default function TimeSeriesAnalysis() {
  const [selected, setSelected] = useState(0);

  const [rollingAvg, setRollingAvg] = useState({ loading: false, data: null, error: null });
  const [gapFill, setGapFill] = useState({ loading: false, data: null, error: null });
  const [extremes, setExtremes] = useState({ loading: false, data: null, error: null });
  const [geoData, setGeoData] = useState({ loading: false, data: null, error: null });
  const [benchmark, setBenchmark] = useState({ loading: false, data: null, error: null });

  const [rollingMeterId, setRollingMeterId] = useState(1);
  const [gapMeterId, setGapMeterId] = useState(1);
  const [gapWindow, setGapWindow] = useState(10);
  const [gapStep, setGapStep] = useState(1);
  const [geoMode, setGeoMode] = useState("near");
  const [geoLat, setGeoLat] = useState(40.75);
  const [geoLng, setGeoLng] = useState(-73.95);
  const [geoRadius, setGeoRadius] = useState(5);

  const fetchRollingAvg = useCallback(async () => {
    setRollingAvg({ loading: true, data: null, error: null });
    try {
      const res = await axios.get(`/api/aggregations/rolling-avg?meterId=${rollingMeterId}`);
      setRollingAvg({ loading: false, data: res.data, error: null });
    } catch (err) {
      setRollingAvg({ loading: false, data: null, error: err.message });
    }
  }, [rollingMeterId]);

  const fetchGapFill = useCallback(async () => {
    setGapFill({ loading: true, data: null, error: null });
    try {
      const res = await axios.get(`/api/aggregations/gap-fill?meterId=${gapMeterId}&window=${gapWindow}&step=${gapStep}`);
      setGapFill({ loading: false, data: res.data, error: null });
    } catch (err) {
      setGapFill({ loading: false, data: null, error: err.message });
    }
  }, [gapMeterId, gapWindow, gapStep]);

  const fetchExtremes = useCallback(async () => {
    setExtremes({ loading: true, data: null, error: null });
    try {
      const res = await axios.get("/api/aggregations/extremes");
      setExtremes({ loading: false, data: res.data, error: null });
    } catch (err) {
      setExtremes({ loading: false, data: null, error: err.message });
    }
  }, []);

  const fetchGeo = useCallback(async () => {
    setGeoData({ loading: true, data: null, error: null });
    try {
      const url = geoMode === "near"
        ? `/api/aggregations/geo-near?lat=${geoLat}&lng=${geoLng}`
        : `/api/aggregations/geo-fence?lat=${geoLat}&lng=${geoLng}&radius=${geoRadius}`;
      const res = await axios.get(url);
      setGeoData({ loading: false, data: res.data, error: null });
    } catch (err) {
      setGeoData({ loading: false, data: null, error: err.message });
    }
  }, [geoMode, geoLat, geoLng, geoRadius]);

  const fetchBenchmark = useCallback(async () => {
    setBenchmark({ loading: true, data: null, error: null });
    try {
      const res = await axios.get("/api/aggregations/benchmark");
      setBenchmark({ loading: false, data: res.data, error: null });
    } catch (err) {
      setBenchmark({ loading: false, data: null, error: err.message });
    }
  }, []);

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  return (
    <div className={styles.container}>
      <H3 className={styles.sectionTitle}>Time Series Analysis</H3>
      <Body className={styles.description}>
        Explore MongoDB Time Series aggregation pipelines. Select a tab and
        click <strong>Run Query</strong> to execute the pipeline and view
        results.
      </Body>

      <Tabs
        selected={selected}
        setSelected={setSelected}
        aria-label="Time Series Analysis Tabs"
      >
        {/* Rolling Average */}
        <Tab name="Rolling Average">
          <div className={styles.tabContent}>
            <Body className={styles.tabDescription}>
              Uses <code>$setWindowFields</code> to compute a 5-minute rolling
              average of voltage readings, partitioned by meter.
            </Body>
            <div className={styles.controls}>
              <label>
                Meter ID:
                <select
                  value={rollingMeterId}
                  onChange={(e) => setRollingMeterId(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((id) => (
                    <option key={id} value={id}>
                      Meter {id}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="baseGreen"
                onClick={fetchRollingAvg}
                disabled={rollingAvg.loading}
              >
                {rollingAvg.loading ? "Running..." : "Run Query"}
              </Button>
            </div>

            {rollingAvg.data && (
              <>
                <div className={styles.pipelineBlock}>
                  <Subtitle>Pipeline</Subtitle>
                  <pre className={styles.code}>
                    {JSON.stringify(rollingAvg.data.pipeline, null, 2)}
                  </pre>
                </div>
                <div className={styles.resultBlock}>
                  <Subtitle>
                    Results ({rollingAvg.data.results.length} documents)
                  </Subtitle>
                  {rollingAvg.data.results.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={rollingAvg.data.results.map((r) => ({
                          ...r,
                          time: formatTimestamp(r.timestamp),
                          voltage: Number(r.voltage?.toFixed(2)),
                          rolling_avg_voltage: Number(
                            r.rolling_avg_voltage?.toFixed(2)
                          ),
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis domain={["auto", "auto"]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="voltage"
                          stroke="#00684A"
                          name="Voltage"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="rolling_avg_voltage"
                          stroke="#016BF8"
                          name="Rolling Avg"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Body>
                      No data available. Ensure the simulation has been running
                      to generate data.
                    </Body>
                  )}
                </div>
              </>
            )}
            {rollingAvg.error && (
              <Banner variant="danger">{rollingAvg.error}</Banner>
            )}
          </div>
        </Tab>

        {/* Gap-Fill */}
        <Tab name="Gap-Fill">
          <div className={styles.tabContent}>
            <Body className={styles.tabDescription}>
              Uses <code>$densify</code> and <code>$fill</code> to create
              evenly-spaced time series data, filling gaps with LOCF (voltage)
              and linear interpolation (current).
            </Body>
            <div className={styles.controls}>
              <label>
                Meter ID:
                <select
                  value={gapMeterId}
                  onChange={(e) => setGapMeterId(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((id) => (
                    <option key={id} value={id}>
                      Meter {id}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Window (min):
                <input
                  type="number"
                  value={gapWindow}
                  onChange={(e) => setGapWindow(Number(e.target.value))}
                  min={1}
                  max={60}
                />
              </label>
              <label>
                Step (sec):
                <input
                  type="number"
                  value={gapStep}
                  onChange={(e) => setGapStep(Number(e.target.value))}
                  min={1}
                  max={60}
                />
              </label>
              <Button
                variant="baseGreen"
                onClick={fetchGapFill}
                disabled={gapFill.loading}
              >
                {gapFill.loading ? "Running..." : "Run Query"}
              </Button>
            </div>

            {gapFill.data && (
              <>
                <div className={styles.pipelineBlock}>
                  <Subtitle>Pipeline</Subtitle>
                  <pre className={styles.code}>
                    {JSON.stringify(gapFill.data.pipeline, null, 2)}
                  </pre>
                </div>
                <div className={styles.resultBlock}>
                  <Subtitle>
                    Results ({gapFill.data.results.length} documents)
                  </Subtitle>
                  {gapFill.data.results.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={gapFill.data.results.map((r) => ({
                            ...r,
                            time: formatTimestamp(r.timestamp),
                            voltage:
                              r.voltage != null
                                ? Number(r.voltage.toFixed(2))
                                : null,
                            current:
                              r.current != null
                                ? Number(r.current.toFixed(2))
                                : null,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis
                            yAxisId="left"
                            domain={["auto", "auto"]}
                            label={{
                              value: "Voltage",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={["auto", "auto"]}
                            label={{
                              value: "Current",
                              angle: 90,
                              position: "insideRight",
                            }}
                          />
                          <Tooltip />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="voltage"
                            stroke="#00684A"
                            name="Voltage (LOCF)"
                            dot={(props) => {
                              const { cx, cy, payload } = props;
                              if (payload.isSynthetic) {
                                return (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={3}
                                    fill="#FF6B6B"
                                    stroke="#FF6B6B"
                                  />
                                );
                              }
                              return null;
                            }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="current"
                            stroke="#016BF8"
                            name="Current (Linear)"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <Body className={styles.chartLegend}>
                        <span className={styles.syntheticDot}></span> Red dots
                        indicate synthetic (gap-filled) data points
                      </Body>
                    </>
                  ) : (
                    <Body>
                      No data available. Ensure the simulation has been running
                      to generate data.
                    </Body>
                  )}
                </div>
              </>
            )}
            {gapFill.error && (
              <Banner variant="danger">{gapFill.error}</Banner>
            )}
          </div>
        </Tab>

        {/* Extremes */}
        <Tab name="Extremes">
          <div className={styles.tabContent}>
            <Body className={styles.tabDescription}>
              Uses <code>$firstN</code>, <code>$lastN</code>,{" "}
              <code>$minN</code>, <code>$maxN</code>, <code>$bottomN</code>,
              and <code>$topN</code> accumulators to find extreme voltage values
              per meter over the last 24 hours.
            </Body>
            <div className={styles.controls}>
              <Button
                variant="baseGreen"
                onClick={fetchExtremes}
                disabled={extremes.loading}
              >
                {extremes.loading ? "Running..." : "Run Query"}
              </Button>
            </div>

            {extremes.data && (
              <>
                <div className={styles.pipelineBlock}>
                  <Subtitle>Pipeline</Subtitle>
                  <pre className={styles.code}>
                    {JSON.stringify(extremes.data.pipeline, null, 2)}
                  </pre>
                </div>
                <div className={styles.resultBlock}>
                  <Subtitle>
                    Results ({extremes.data.results.length} meters)
                  </Subtitle>
                  {extremes.data.results.length > 0 ? (
                    <div className={styles.extremesGrid}>
                      {extremes.data.results.map((meter) => (
                        <div key={meter.meter_id} className={styles.extremeCard}>
                          <h4>Meter {meter.meter_id}</h4>
                          <table className={styles.extremeTable}>
                            <tbody>
                              <tr>
                                <td>First 3</td>
                                <td>
                                  {meter.first_voltages
                                    ?.map((v) => v?.toFixed(1))
                                    .join(", ")}
                                </td>
                              </tr>
                              <tr>
                                <td>Last 3</td>
                                <td>
                                  {meter.last_voltages
                                    ?.map((v) => v?.toFixed(1))
                                    .join(", ")}
                                </td>
                              </tr>
                              <tr>
                                <td>Min</td>
                                <td>
                                  {meter.min_voltages
                                    ?.map((v) => v?.toFixed(2))
                                    .join(", ")}
                                </td>
                              </tr>
                              <tr>
                                <td>Max</td>
                                <td>
                                  {meter.max_voltages
                                    ?.map((v) => v?.toFixed(2))
                                    .join(", ")}
                                </td>
                              </tr>
                              <tr>
                                <td>Bottom 3</td>
                                <td>
                                  {meter.bottom_voltages
                                    ?.map((v) => v?.toFixed(2))
                                    .join(", ")}
                                </td>
                              </tr>
                              <tr>
                                <td>Top 3</td>
                                <td>
                                  {meter.top_voltages
                                    ?.map((v) => v?.toFixed(2))
                                    .join(", ")}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Body>
                      No data available. Ensure the simulation has been running
                      to generate data.
                    </Body>
                  )}
                </div>
              </>
            )}
            {extremes.error && (
              <Banner variant="danger">{extremes.error}</Banner>
            )}
          </div>
        </Tab>

        {/* Geospatial */}
        <Tab name="Geospatial">
          <div className={styles.tabContent}>
            <Body className={styles.tabDescription}>
              {geoMode === "near"
                ? "Uses $geoNear to find the 5 closest meter readings to a given coordinate."
                : "Uses $geoWithin with $centerSphere to find all meters within a radius, grouped by meter."}
            </Body>
            <div className={styles.controls}>
              <label>
                Mode:
                <select
                  value={geoMode}
                  onChange={(e) => setGeoMode(e.target.value)}
                >
                  <option value="near">Geo Near</option>
                  <option value="fence">Geo Fence</option>
                </select>
              </label>
              <label>
                Latitude:
                <input
                  type="number"
                  step="0.01"
                  value={geoLat}
                  onChange={(e) => setGeoLat(Number(e.target.value))}
                />
              </label>
              <label>
                Longitude:
                <input
                  type="number"
                  step="0.01"
                  value={geoLng}
                  onChange={(e) => setGeoLng(Number(e.target.value))}
                />
              </label>
              {geoMode === "fence" && (
                <label>
                  Radius (km):
                  <input
                    type="number"
                    step="0.5"
                    value={geoRadius}
                    onChange={(e) => setGeoRadius(Number(e.target.value))}
                    min={0.1}
                  />
                </label>
              )}
              <Button
                variant="baseGreen"
                onClick={fetchGeo}
                disabled={geoData.loading}
              >
                {geoData.loading ? "Running..." : "Run Query"}
              </Button>
            </div>

            {geoData.data && (
              <>
                <div className={styles.pipelineBlock}>
                  <Subtitle>Pipeline</Subtitle>
                  <pre className={styles.code}>
                    {JSON.stringify(geoData.data.pipeline, null, 2)}
                  </pre>
                </div>
                <div className={styles.resultBlock}>
                  <Subtitle>
                    Results ({geoData.data.results.length}{" "}
                    {geoMode === "near" ? "readings" : "meters"})
                  </Subtitle>
                  {geoData.data.results.length > 0 ? (
                    geoMode === "near" ? (
                      <table>
                        <thead>
                          <tr>
                            <th>Meter ID</th>
                            <th>Timestamp</th>
                            <th>Voltage</th>
                            <th>Current</th>
                            <th>Power</th>
                            <th>Distance (m)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {geoData.data.results.map((r, i) => (
                            <tr key={i}>
                              <td>{r.meter_id}</td>
                              <td>
                                {new Date(r.timestamp).toLocaleString()}
                              </td>
                              <td>{r.voltage?.toFixed(2)}</td>
                              <td>{r.current?.toFixed(2)}</td>
                              <td>{r.power?.toFixed(2)}</td>
                              <td>{r.dist_m?.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Meter ID</th>
                            <th>Latest Timestamp</th>
                            <th>Latest Voltage</th>
                            <th>Reading Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {geoData.data.results.map((r, i) => (
                            <tr key={i}>
                              <td>{r.meter_id}</td>
                              <td>
                                {new Date(
                                  r.latest_timestamp
                                ).toLocaleString()}
                              </td>
                              <td>{r.latest_voltage?.toFixed(2)}</td>
                              <td>{r.reading_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  ) : (
                    <Body>
                      No results found. Ensure data with location fields exists
                      and 2dsphere index is created.
                    </Body>
                  )}
                </div>
              </>
            )}
            {geoData.error && (
              <Banner variant="danger">{geoData.error}</Banner>
            )}
          </div>
        </Tab>

        {/* Benchmark */}
        <Tab name="TS vs Standard">
          <div className={styles.tabContent}>
            <Body className={styles.tabDescription}>
              Runs the same aggregation pipeline on both the Time Series and
              Standard collections, comparing query performance and explain
              plans.
            </Body>
            <div className={styles.controls}>
              <Button
                variant="baseGreen"
                onClick={fetchBenchmark}
                disabled={benchmark.loading}
              >
                {benchmark.loading ? "Running..." : "Run Query"}
              </Button>
            </div>

            {benchmark.data && (
              <>
                <div className={styles.pipelineBlock}>
                  <Subtitle>Pipeline</Subtitle>
                  <pre className={styles.code}>
                    {JSON.stringify(benchmark.data.pipeline, null, 2)}
                  </pre>
                </div>
                <div className={styles.resultBlock}>
                  <Subtitle>Performance Comparison</Subtitle>
                  <div className={styles.benchmarkCards}>
                    <div className={styles.benchmarkCard}>
                      <Badge variant="green">Time Series Collection</Badge>
                      <h4>Query Time</h4>
                      <p className={styles.benchmarkTime}>
                        {benchmark.data.tsResult?.queryTime} ms
                      </p>
                      <p className={styles.benchmarkCount}>
                        {benchmark.data.tsResult?.data?.length} documents
                        returned
                      </p>
                    </div>
                    <div className={styles.benchmarkCard}>
                      <Badge>Standard Collection</Badge>
                      <h4>Query Time</h4>
                      <p className={styles.benchmarkTime}>
                        {benchmark.data.stdResult?.queryTime} ms
                      </p>
                      <p className={styles.benchmarkCount}>
                        {benchmark.data.stdResult?.data?.length} documents
                        returned
                      </p>
                    </div>
                  </div>

                  <details className={styles.explainDetails}>
                    <summary>Time Series Explain Plan</summary>
                    <pre className={styles.code}>
                      {JSON.stringify(
                        benchmark.data.tsResult?.explain,
                        null,
                        2
                      )}
                    </pre>
                  </details>
                  <details className={styles.explainDetails}>
                    <summary>Standard Collection Explain Plan</summary>
                    <pre className={styles.code}>
                      {JSON.stringify(
                        benchmark.data.stdResult?.explain,
                        null,
                        2
                      )}
                    </pre>
                  </details>
                </div>
              </>
            )}
            {benchmark.error && (
              <Banner variant="danger">{benchmark.error}</Banner>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
