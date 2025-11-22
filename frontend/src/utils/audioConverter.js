/**
 * Convert audio blob to WAV format for Gemini API compatibility
 * @param {Blob} audioBlob - The audio blob to convert
 * @param {string} mimeType - Original MIME type
 * @returns {Promise<Blob>} WAV format blob
 */
export async function convertToWav(audioBlob, mimeType) {
  // If already WAV, return as-is
  if (mimeType.includes('wav')) {
    return audioBlob;
  }

  try {
    // Check if Web Audio API is supported
    if (!window.AudioContext && !window.webkitAudioContext) {
      throw new Error('Web Audio API is not supported in your browser.');
    }
    
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Convert to WAV
    const wavBlob = audioBufferToWav(audioBuffer);
    
    return wavBlob;
  } catch (error) {
    console.error('Error converting audio to WAV:', error);
    // If conversion fails, return original blob and let API handle it
    return audioBlob;
  }
}

/**
 * Convert AudioBuffer to WAV Blob
 * @param {AudioBuffer} audioBuffer - The audio buffer to convert
 * @returns {Blob} WAV format blob
 */
function audioBufferToWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = audioBuffer.length;
  const buffer = new ArrayBuffer(44 + length * numChannels * bytesPerSample);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numChannels * bytesPerSample, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, length * numChannels * bytesPerSample, true);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

