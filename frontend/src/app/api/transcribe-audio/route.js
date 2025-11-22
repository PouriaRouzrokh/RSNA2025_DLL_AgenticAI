import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/utils/rateLimiter';

/**
 * API route for transcribing audio using Gemini API
 * Works both locally and on Vercel
 * 
 * Security features:
 * - Rate limiting: 10 requests per minute per IP (normal), 60 req/min (workshop mode)
 * - Request size validation: Max 20MB
 * - MIME type validation
 * - Field ID validation
 * - CORS protection (implicit via Next.js same-origin policy)
 * 
 * Note: For production, consider:
 * - Using Vercel KV or Upstash for distributed rate limiting
 * - Enabling Vercel Bot Protection in project settings
 * - Adding authentication if this is a private application
 * - Set WORKSHOP_MODE=true for workshops to increase rate limit to 60 req/min
 */
export async function POST(request) {
  try {
    // Rate limiting: Adaptive based on environment
    // For workshops: Higher limit (60 req/min) to handle shared IPs and multiple submissions per person
    // Normal: 10 req/min per IP
    const clientIP = getClientIP(request);
    const isWorkshopMode = process.env.WORKSHOP_MODE === 'true';
    const maxRequests = isWorkshopMode ? 60 : 10; // Higher limit for workshops (allows ~2 req/min per person for 30 people)
    const rateLimit = checkRateLimit(clientIP, maxRequests, 60000);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
          }
        }
      );
    }

    const { audioData, mimeType, fieldId } = await request.json();

    // Validate required fields
    if (!audioData) {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // Validate audio data size (20MB limit for Gemini API)
    // Base64 encoded data is ~33% larger than original
    const base64Size = audioData.length;
    const estimatedSize = (base64Size * 3) / 4;
    const maxSize = 20 * 1024 * 1024; // 20MB
    
    if (estimatedSize > maxSize) {
      return NextResponse.json(
        { error: 'Audio file is too large. Maximum size is 20MB.' },
        { status: 400 }
      );
    }

    // Validate MIME type (only allow supported audio formats)
    const allowedMimeTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/aiff',
      'audio/aac',
      'audio/ogg',
      'audio/flac'
    ];
    
    const audioMimeType = mimeType || 'audio/wav';
    if (!allowedMimeTypes.includes(audioMimeType)) {
      return NextResponse.json(
        { error: `Unsupported audio format. Supported formats: ${allowedMimeTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate fieldId (optional but helps prevent abuse)
    const allowedFieldIds = [
      'indication',
      'findings',
      'impression',
      'custom-instruction',
      'custom-style-instructions'
    ];
    
    if (fieldId && !allowedFieldIds.includes(fieldId)) {
      return NextResponse.json(
        { error: 'Invalid field ID' },
        { status: 400 }
      );
    }

    // Get Gemini API key from environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Audio is converted to WAV format in the browser before being sent here
    // Gemini API supports: audio/wav, audio/mp3, audio/aiff, audio/aac, audio/ogg, audio/flac
    // We use WAV format for maximum compatibility
    
    const prompt = 'Generate a transcript of the speech. Provide only the transcribed text without any additional commentary or formatting.';
    
    // Use Gemini API with inline audio data (REST API format)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType || 'audio/wav',
                    data: audioData,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      
      // Try to parse error JSON
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      return NextResponse.json(
        { error: errorData.error?.message || `Gemini API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract transcription from response
    const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!transcription) {
      return NextResponse.json(
        { error: 'No transcription found in response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transcription: transcription.trim(),
      fieldId: fieldId,
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
      }
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

