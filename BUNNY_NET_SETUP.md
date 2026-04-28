# Bunny.net Video Hosting Setup

This guide explains how to configure Bunny.net video hosting for the New Era Platform.

## Prerequisites

1. **Bunny.net Account**: Sign up at [bunny.net](https://bunny.net)
2. **Video Library**: Create a video library in your Bunny.net dashboard
3. **API Key**: Generate an API key with video management permissions

## Environment Variables

Add these variables to your `.env` file:

```bash
# Bunny.net Video Hosting
BUNNY_API_KEY=your_bunny_api_key_here
BUNNY_VIDEO_LIBRARY_ID=your_video_library_id_here
```

## Configuration Steps

### 1. Get Your API Key

1. Log into your Bunny.net dashboard
2. Go to **Account** → **API Keys**
3. Click **Generate New Key**
4. Select **Video Management** permissions
5. Copy the generated key

### 2. Get Your Video Library ID

1. In your Bunny.net dashboard, go to **Video**
2. Find your video library
3. The library ID is displayed in the URL: `https://video.bunnycdn.com/library/{LIBRARY_ID}/videos`
4. Copy the library ID

### 3. Test the Configuration

1. Start your development server
2. Go to `/admin/courses`
3. Create a course and sub-course
4. Try to create a lesson with a video file
5. Check the console for upload progress

## How It Works

### Video Upload Process

1. **File Selection**: User selects a video file (MP4, AVI, MOV, WMV, FLV, WebM)
2. **Bunny.net Upload**: Video is uploaded directly to Bunny.net's servers
3. **Metadata Storage**: Video information is saved to MongoDB
4. **Lesson Creation**: Lesson is created with video references

### Supported Formats

- **Video**: MP4, AVI, MOV, WMV, FLV, WebM
- **Max Size**: No file size restrictions
- **Quality**: Automatically optimized by Bunny.net

### Database Storage

Videos are stored in the `videos` collection with:

```json
{
  "uploadId": "unique_upload_id",
  "bunnyVideoId": "bunny_video_guid",
  "videoUrl": "https://iframe.mediadelivery.net/embed/...",
  "title": "Video Title",
  "description": "Video Description",
  "filename": "original_filename.mp4",
  "fileSize": 1234567,
  "fileType": "video/mp4",
  "uploadedBy": "user_id",
  "uploadedAt": "2025-08-24T...",
  "status": "processing",
  "createdAt": "2025-08-24T...",
  "updatedAt": "2025-08-24T..."
}
```

## Troubleshooting

### Common Issues

1. **"Bunny.net credentials not configured"**
   - Check your `.env` file
   - Ensure variables are named correctly
   - Restart your development server

2. **"Failed to upload video"**
   - Verify your API key has correct permissions
   - Check your video library ID
   - Ensure video file meets requirements

3. **"Unauthorized" error**
   - Verify your API key is valid
   - Check if your account has video hosting enabled

### Testing

To test without real credentials, you can temporarily modify the code to use mock uploads:

```typescript
// In lib/bunny-video.ts, add this fallback
if (!this.apiKey || !this.libraryId) {
  // Return mock response for testing
  return {
    success: true,
    videoId: `mock_${Date.now()}`,
    videoUrl: 'https://example.com/mock-video'
  }
}
```

## Production Considerations

1. **File Size Limits**: No file size restrictions - videos of any size can be uploaded
2. **Video Processing**: Bunny.net automatically processes videos for multiple formats
3. **CDN**: Videos are served through Bunny.net's global CDN
4. **Analytics**: Track video performance through Bunny.net dashboard
5. **Costs**: Monitor bandwidth and storage usage

## Security

- API keys are stored in environment variables (never commit to git)
- File type validation prevents malicious uploads
- No file size restrictions for video uploads
- Admin-only access to upload functionality
