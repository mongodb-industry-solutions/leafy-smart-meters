import { getMetrics } from '../../../anomaly_detection.js';

export async function GET() {
  const metrics = getMetrics();
  return new Response(JSON.stringify(metrics), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
