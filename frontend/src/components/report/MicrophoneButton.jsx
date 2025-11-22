'use client';

import { useState, useRef, useEffect } from 'react';
import { convertToWav } from '@/utils/audioConverter';

/**
 * MicrophoneButton component for recording audio and transcribing it
 * @param {Object} props
 * @param {Function} props.onTranscriptionComplete - Callback when transcription is complete
 * @param {string} props.fieldId - The field ID this button is associated with
 * @param {string} props.currentValue - Current value of the text field
 */
export default function MicrophoneButton({ onTranscriptionComplete, fieldId, currentValue }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const maxRecordingTime = 30; // 30 seconds max

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      
      // Check if MediaRecorder is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording. Please use a modern browser.');
      }
      
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder API is not supported in your browser.');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use a format supported by Gemini API
      // Supported: audio/wav, audio/mp3, audio/aiff, audio/aac, audio/ogg, audio/flac
      // MediaRecorder support varies by browser, so we'll try WAV first, fallback to WebM
      let mimeType = 'audio/webm';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      
      // Find a supported MIME type
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length > 0) {
          await processAudio(mimeType);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxRecordingTime) {
            stopRecording();
            return maxRecordingTime;
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const processAudio = async (mimeType) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Combine audio chunks into a single blob
      let audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      // Convert to WAV format for Gemini API compatibility
      // Gemini supports: audio/wav, audio/mp3, audio/aiff, audio/aac, audio/ogg, audio/flac
      // WebM is not directly supported, so we convert to WAV
      if (!mimeType.includes('wav')) {
        try {
          audioBlob = await convertToWav(audioBlob, mimeType);
        } catch (conversionError) {
          console.warn('Failed to convert to WAV, using original format:', conversionError);
          // Continue with original format - API route will handle it
        }
      }
      
      // Check file size (20MB limit)
      if (audioBlob.size > 20 * 1024 * 1024) {
        throw new Error('Audio file is too large. Maximum size is 20MB.');
      }

      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1]; // Remove data URL prefix
        
        try {
          // Call transcription API
          const response = await fetch('/api/transcribe-audio', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audioData: base64Audio,
              mimeType: 'audio/wav', // Always send as WAV after conversion
              fieldId: fieldId,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          
          if (data.transcription) {
            // Append transcription to current value
            const newValue = currentValue 
              ? `${currentValue} ${data.transcription}`.trim()
              : data.transcription;
            
            onTranscriptionComplete(newValue);
          } else {
            throw new Error('No transcription received from API');
          }
        } catch (err) {
          console.error('Transcription error:', err);
          setError(err.message || 'Failed to transcribe audio. Please try again.');
        } finally {
          setIsProcessing(false);
          setRecordingTime(0);
        }
      };

      reader.onerror = () => {
        setError('Failed to read audio file');
        setIsProcessing(false);
      };

      reader.readAsDataURL(audioBlob);
    } catch (err) {
      console.error('Error processing audio:', err);
      setError(err.message || 'Failed to process audio');
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isProcessing) {
      startRecording();
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleClick}
        disabled={isProcessing}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: isRecording 
            ? 'var(--accent-red, #ef4444)' 
            : isProcessing
            ? 'var(--bg-tertiary)'
            : 'var(--bg-secondary)',
          border: `1px solid ${isRecording ? 'var(--accent-red, #ef4444)' : 'var(--border-subtle)'}`,
          color: isRecording ? '#fff' : 'var(--text-primary)',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-fast, 0.2s)',
          opacity: isProcessing ? 0.6 : 1,
        }}
        title={isRecording ? 'Stop recording' : isProcessing ? 'Processing...' : 'Start voice recording'}
      >
        {isProcessing ? (
          <span style={{ fontSize: '14px' }}>⏳</span>
        ) : isRecording ? (
          <span style={{ fontSize: '14px' }}>⏹</span>
        ) : (
          <span style={{ fontSize: '14px' }}>🎤</span>
        )}
      </button>
      
      {isRecording && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '4px',
          fontSize: '0.75rem',
          color: 'var(--accent-red, #ef4444)',
          whiteSpace: 'nowrap',
          fontWeight: '500',
        }}>
          {maxRecordingTime - recordingTime}s
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '4px',
          fontSize: '0.75rem',
          color: 'var(--accent-red, #ef4444)',
          whiteSpace: 'nowrap',
          backgroundColor: 'var(--bg-primary)',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)',
          zIndex: 1000,
          maxWidth: '200px',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

