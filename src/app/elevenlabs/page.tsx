'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TextToSpeechForm } from '@/components/elevenlabs/TextToSpeechForm';
import { SpeechToTextForm } from '@/components/elevenlabs/SpeechToTextForm';
import { SubscriptionInfo } from '@/components/elevenlabs/SubscriptionInfo';

export default function ElevenLabsPage() {
  const [activeTab, setActiveTab] = useState<'tts' | 'stt'>('tts');

  return (
    <ProtectedRoute>
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">ElevenLabs AI Voice</h1>
            <p className="text-lg text-gray-600">
              Convert between text and speech using AI-powered technology
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-1">
              <button
                onClick={() => setActiveTab('tts')}
                className={`px-8 py-3 rounded-md transition-all duration-200 font-medium ${
                  activeTab === 'tts'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                🎵 Text to Speech
              </button>
              <button
                onClick={() => setActiveTab('stt')}
                className={`px-8 py-3 rounded-md transition-all duration-200 font-medium ${
                  activeTab === 'stt'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                🎤 Speech to Text
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                {activeTab === 'tts' ? <TextToSpeechForm /> : <SpeechToTextForm />}
              </div>
            </div>

            {/* Subscription Info Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border">
                <SubscriptionInfo />
              </div>

              {/* Quick Info */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Features</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  {activeTab === 'tts' ? (
                    <>
                      <p>• High-quality AI-generated voices</p>
                      <p>• Multiple voice options and styles</p>
                      <p>• Adjustable voice settings</p>
                      <p>• Download as MP3 files</p>
                      <p>• Professional voice cloning available</p>
                    </>
                  ) : (
                    <>
                      <p>• Real-time speech recognition</p>
                      <p>• File upload transcription</p>
                      <p>• 99+ language support</p>
                      <p>• High accuracy AI transcription</p>
                      <p>• Copy transcript to clipboard</p>
                      <p>• Works in modern browsers</p>
                    </>
                  )}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Tips</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  {activeTab === 'tts' ? (
                    <>
                      <p><strong>Stability:</strong> Higher values = more consistent voice</p>
                      <p><strong>Similarity Boost:</strong> Higher values = closer to original voice</p>
                      <p><strong>Text Limit:</strong> Maximum 5,000 characters per request</p>
                      <p><strong>Best Results:</strong> Use clear punctuation and proper formatting</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Real-time Mode:</strong> Ensure browser has mic permissions</p>
                      <p><strong>File Mode:</strong> Supports MP3, WAV, FLAC, M4A, OGG files</p>
                      <p><strong>Environment:</strong> Use in a quiet space for best results</p>
                      <p><strong>Languages:</strong> 99+ languages supported in file mode</p>
                      <p><strong>File Size:</strong> Up to 3GB files, 10 hours duration</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}