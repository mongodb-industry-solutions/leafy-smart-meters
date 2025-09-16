import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'leafy-smart-meters',
      mode: process.env.DEMO_MODE === 'true' ? 'demo' : 'production',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    // Optional: Check MongoDB connection if configured
    if (process.env.MONGODB_URI && process.env.DEMO_MODE !== 'true') {
      try {
        const { MongoClient } = await import('mongodb');
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        await client.db().admin().ping();
        await client.close();
        healthStatus.database = 'connected';
      } catch (dbError) {
        healthStatus.database = 'disconnected';
        healthStatus.dbError = dbError.message;
      }
    } else if (process.env.DEMO_MODE === 'true') {
      healthStatus.database = 'demo-mode';
    }

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

// Also support HEAD requests for simpler health checks
export async function HEAD() {
  return new Response(null, { status: 200 });
}