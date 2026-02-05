import { startSimulation } from '../../../../utils/simulation';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const simulateGaps = searchParams.get('simulateGaps') === 'true';

  startSimulation({ simulateGaps });
  return new Response('Simulation started', { status: 200 });
}