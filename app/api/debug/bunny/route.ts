export async function GET() {
  return Response.json({
    BUNNY_API_KEY: process.env.BUNNY_API_KEY ? process.env.BUNNY_API_KEY.substring(0, 8) + '...' : 'EMPTY',
    BUNNY_STREAM_LIBRARY_API_KEY: process.env.BUNNY_STREAM_LIBRARY_API_KEY ? process.env.BUNNY_STREAM_LIBRARY_API_KEY.substring(0, 8) + '...' : 'EMPTY',
    BUNNY_VIDEO_LIBRARY_ID: process.env.BUNNY_VIDEO_LIBRARY_ID || 'EMPTY',
    BUNNY_STREAM_LIBRARY_ID: process.env.BUNNY_STREAM_LIBRARY_ID || 'EMPTY',
  })
}
