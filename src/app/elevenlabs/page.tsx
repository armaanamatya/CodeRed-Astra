'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TextToSpeechForm } from '@/components/elevenlabs/TextToSpeechForm';
import { SubscriptionInfo } from '@/components/elevenlabs/SubscriptionInfo';

export default function ElevenLabsPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">ElevenLabs AI Voice</h1>
            <p className="text-lg text-gray-600">
              Convert text to realistic speech using AI-powered voices
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Text-to-Speech Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <TextToSpeechForm />
              </div>
            </div>

            {/* Subscription Info Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border">
                <SubscriptionInfo />
              </div>

              {/* Quick Info */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">About ElevenLabs</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• High-quality AI-generated voices</p>
                  <p>• Multiple voice options and styles</p>
                  <p>• Adjustable voice settings</p>
                  <p>• Download as MP3 files</p>
                  <p>• Professional voice cloning available</p>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Tips</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Stability:</strong> Higher values = more consistent voice</p>
                  <p><strong>Similarity Boost:</strong> Higher values = closer to original voice</p>
                  <p><strong>Text Limit:</strong> Maximum 5,000 characters per request</p>
                  <p><strong>Best Results:</strong> Use clear punctuation and proper formatting</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}