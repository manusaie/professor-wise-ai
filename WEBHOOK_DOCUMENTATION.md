# Chat Webhook API Documentation

## Overview

Production-ready webhook endpoint for multimodal chat integration with N8N automation platform. Supports text, audio, images, and file uploads with complete data persistence in Supabase.

## Endpoint URL

**Production URL:** `https://mdlmvizqxtqtzoyxlgif.functions.supabase.co/chat-webhook`

**Method:** `POST`  
**Authentication:** None (Public endpoint)  
**Content-Type:** `application/json`

## Request Payload Format

### Basic Text Message
```json
{
  "user_id": "uuid-string",
  "conversation_id": "uuid-string-optional",
  "message_type": "text",
  "content": "Hello, can you help me with math?"
}
```

### Audio Message
```json
{
  "user_id": "uuid-string",
  "conversation_id": "uuid-string-optional",
  "message_type": "audio",
  "audio": {
    "data": "base64-encoded-audio-data",
    "format": "wav"
  }
}
```

### Image/File Upload
```json
{
  "user_id": "uuid-string",
  "conversation_id": "uuid-string-optional",
  "message_type": "image",
  "content": "What's in this image?",
  "file": {
    "name": "screenshot.png",
    "type": "image/png",
    "data": "base64-encoded-file-data"
  }
}
```

### Document Upload
```json
{
  "user_id": "uuid-string",
  "conversation_id": "uuid-string-optional",
  "message_type": "file",
  "content": "Please analyze this document",
  "file": {
    "name": "document.pdf",
    "type": "application/pdf",
    "data": "base64-encoded-file-data"
  }
}
```

## Request Field Specifications

### Required Fields
- `user_id` (string): UUID of the authenticated user
- `message_type` (string): One of: "text", "audio", "image", "file"

### Optional Fields
- `conversation_id` (string): UUID of existing conversation. If not provided, creates new conversation
- `content` (string): Text content of the message
- `file` (object): File upload data
  - `name` (string): Original filename
  - `type` (string): MIME type (e.g., "image/jpeg", "application/pdf")
  - `data` (string): Base64 encoded file content
- `audio` (object): Audio upload data
  - `data` (string): Base64 encoded audio content
  - `format` (string): Audio format ("wav", "mp3", "ogg", etc.)

## N8N Integration Payload

The webhook sends this payload to your N8N automation:

```json
{
  "message": {
    "content": "User message content",
    "file_url": "https://storage-url/file.png",
    "file_type": "image/png",
    "message_type": "text",
    "user_id": "uuid",
    "conversation_id": "uuid"
  },
  "user_profile": {
    "display_name": "Student Name",
    "tutor_name": "Professor",
    "tutor_gender": "neutral"
  },
  "conversation_history": [
    {
      "content": "Previous message",
      "sender": "user",
      "created_at": "2025-01-23T10:30:00Z"
    },
    {
      "content": "AI response",
      "sender": "ai", 
      "created_at": "2025-01-23T10:30:05Z"
    }
  ]
}
```

## Expected N8N Response Format

Your N8N workflow must return this JSON structure:

### Text Response
```json
{
  "response": {
    "content": "AI generated response text",
    "message_type": "text"
  },
  "xp_awarded": 10,
  "coins_awarded": 5
}
```

### Audio Response
```json
{
  "response": {
    "content": "Audio transcript (optional)",
    "message_type": "audio",
    "audio": {
      "data": "base64-encoded-audio-response",
      "format": "wav"
    }
  },
  "xp_awarded": 15,
  "coins_awarded": 8
}
```

### File/Image Response
```json
{
  "response": {
    "content": "Generated image description",
    "message_type": "image",
    "file": {
      "url": "https://external-service.com/generated-image.png",
      "type": "image/png",
      "name": "ai-generated.png"
    }
  },
  "xp_awarded": 20,
  "coins_awarded": 10
}
```

## Webhook Response Format

### Success Response
```json
{
  "success": true,
  "conversation_id": "uuid",
  "user_message_id": "uuid", 
  "ai_message_id": "uuid",
  "response": {
    "content": "AI response content",
    "message_type": "text",
    "file_url": "https://storage-url/file.png",
    "file_type": "image/png",
    "audio_url": "https://storage-url/audio.wav"
  },
  "rewards": {
    "xp_awarded": 10,
    "coins_awarded": 5
  }
}
```

### Error Response
```json
{
  "error": "Error description",
  "details": "Specific error details"
}
```

## Supported File Types

### Images
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WebP (`image/webp`)

### Audio
- WAV (`audio/wav`)
- MP3 (`audio/mpeg`)
- OGG (`audio/ogg`)
- M4A (`audio/mp4`)

### Documents
- PDF (`application/pdf`)
- Word (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- Text (`text/plain`)
- Markdown (`text/markdown`)

### Maximum File Sizes
- Images: 10 MB
- Audio: 25 MB
- Documents: 50 MB

## Data Persistence

All data is automatically stored in Supabase:

### Tables Used
- `conversations`: Chat sessions
- `messages`: Individual messages with file references
- `profiles`: User profiles and tutor settings
- `xp_transactions`: Experience point history
- `storage.objects`: File storage in 'chat-files' bucket

### Storage Structure
```
chat-files/
├── {user_id}/
│   ├── {timestamp}-{filename}
│   ├── {timestamp}-audio.wav
│   └── {timestamp}-ai-audio.wav
```

## Environment Variables

Configure these in your Supabase Edge Functions:

- `N8N_WEBHOOK_URL`: Your N8N webhook endpoint URL
- `SUPABASE_URL`: Automatically provided
- `SUPABASE_SERVICE_ROLE_KEY`: Automatically provided

## Error Handling

### Common Error Codes
- `400`: Bad Request - Missing required fields
- `405`: Method Not Allowed - Use POST only
- `413`: Payload Too Large - File size exceeds limits
- `500`: Internal Server Error - Check logs

### File Upload Errors
- Invalid base64 encoding
- Unsupported file type
- File size exceeds limit
- Storage quota exceeded

## Rate Limiting

- **Production**: 1000 requests per minute per user
- **Burst**: Up to 100 requests in 10 seconds
- **File uploads**: 10 files per minute per user

## Security Features

- Input validation and sanitization
- File type verification
- Base64 encoding validation
- Automatic virus scanning (Supabase Storage)
- Row Level Security (RLS) on all database operations

## Testing the Webhook

### Using cURL
```bash
curl -X POST https://mdlmvizqxtqtzoyxlgif.functions.supabase.co/chat-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-uuid",
    "message_type": "text",
    "content": "Hello, test message!"
  }'
```

### Using JavaScript
```javascript
const response = await fetch('https://mdlmvizqxtqtzoyxlgif.functions.supabase.co/chat-webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 'your-user-uuid',
    message_type: 'text', 
    content: 'Hello from JavaScript!'
  })
});

const result = await response.json();
console.log(result);
```

## Monitoring & Logs

Monitor webhook performance:
- **Logs**: [Edge Function Logs](https://supabase.com/dashboard/project/mdlmvizqxtqtzoyxlgif/functions/chat-webhook/logs)
- **Metrics**: Response times, error rates, file upload success
- **Storage**: [File Storage Dashboard](https://supabase.com/dashboard/project/mdlmvizqxtqtzoyxlgif/storage/buckets/chat-files)

## Support

For webhook integration support:
1. Check the Edge Function logs for detailed error messages
2. Verify your N8N endpoint is responding correctly
3. Test with simple text messages before trying file uploads
4. Ensure user authentication is working in your app