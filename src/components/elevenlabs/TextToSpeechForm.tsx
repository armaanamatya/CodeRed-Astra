'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export function TextToSpeechForm() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0,
    useSpeakerBoost: true,
  });

  // Fetch available voices on component mount
  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/elevenlabs/voices');
      const data = await response.json();
      
      if (data.success) {
        setVoices(data.voices);
        if (data.voices.length > 0) {
          setSelectedVoice(data.voices[0].voice_id);
        }
      } else {
        setError(data.error || 'Failed to fetch voices');
      }
    } catch (err) {
      setError('Network error fetching voices');
    }
  };

  const generateSpeech = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    if (!selectedVoice) {
      setError('Please select a voice');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/elevenlabs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice,
          settings: voiceSettings,
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate speech');
      }
    } catch (err) {
      setError('Network error generating speech');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `speech-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Text to Speech</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Text to Convert ({text.length}/5000)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter the text you want to convert to speech..."
            maxLength={5000}
          />
        </div>

        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Voice</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a voice...</option>
            {voices.map((voice) => (
              <option key={voice.voice_id} value={voice.voice_id}>
                {voice.name} ({voice.category})
              </option>
            ))}
          </select>
        </div>

        {/* Voice Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Stability: {voiceSettings.stability}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.stability}
              onChange={(e) =>
                setVoiceSettings({
                  ...voiceSettings,
                  stability: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Similarity Boost: {voiceSettings.similarityBoost}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.similarityBoost}
              onChange={(e) =>
                setVoiceSettings({
                  ...voiceSettings,
                  similarityBoost: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateSpeech}
          disabled={loading || !text.trim() || !selectedVoice}
          className="w-full"
        >
          {loading ? 'Generating...' : 'Generate Speech'}
        </Button>

        {/* Audio Controls */}
        {audioUrl && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-3">Speech Generated!</h3>
            <div className="flex gap-2">
              <Button onClick={playAudio} variant="outline">
                Play Audio
              </Button>
              <Button onClick={downloadAudio} variant="outline">
                Download MP3
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}