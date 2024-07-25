import { startSimulation } from '../../../../utils/simulation';

export async function GET() {
  startSimulation();
  return new Response('Simulation started', { status: 200 });
}