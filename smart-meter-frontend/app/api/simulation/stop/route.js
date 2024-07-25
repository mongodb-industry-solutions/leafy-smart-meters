import { stopSimulation } from '../../../../utils/simulation';

export async function GET() {
  stopSimulation();
  return new Response('Simulation stopped', { status: 200 });
}
