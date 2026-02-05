import { setSimulateGaps } from '../../../../utils/simulation';

export async function POST(request) {
  const { enabled } = await request.json();
  setSimulateGaps(enabled);
  return Response.json({ success: true, gapsEnabled: enabled });
}
