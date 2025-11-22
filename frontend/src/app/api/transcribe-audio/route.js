import { NextResponse } from 'next/server';

/**
 * API route for transcribing audio using Gemini API
 * Works both locally and on Vercel
 */
export async function POST(request) {
  try {
    const { audioData, mimeType, fieldId } = await request.json();

    if (!audioData) {
      return NextResponse.json(
        { error: 'No audio data provided' },
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
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

