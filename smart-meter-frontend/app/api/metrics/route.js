const { getMetrics } = require('../../../anomaly_detection');

export async function GET() {
  const metrics = getMetrics();
  return new Response(JSON.stringify(metrics), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
