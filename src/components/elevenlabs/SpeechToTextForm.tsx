'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

export function SpeechToTextForm() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as Window & typeof globalThis & { 
        SpeechRecognition?: typeof window.SpeechRecognition;
        webkitSpeechRecognition?: typeof window.SpeechRecognition;
      }).SpeechRecognition || (window as Window & typeof globalThis & {
        webkitSpeechRecognition?: typeof window.SpeechRecognition;
      }).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
      }

      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        switch (event.error) {
          case 'no-speech':
            setError('No speech was detected. Please try again.');
            break;
          case 'audio-capture':
            setError('No microphone was found. Ensure it is connected and allowed.');
            break;
          case 'not-allowed':
            setError('Microphone permission was denied. Please allow microphone access.');
            break;
          default:
            setError(`Error occurred: ${event.error}`);
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = transcript;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }

        setTranscript(final);
        setInterimTranscript(interim);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript + interimTranscript);
      // You could add a toast notification here
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  if (!isSupported) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Speech to Text</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Speech to Text</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Microphone Control */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={toggleListening}
            size="lg"
            variant={isListening ? "destructive" : "default"}
            className="rounded-full w-24 h-24 p-0"
          >
            {isListening ? (
              <span className="text-4xl">🔇</span>
            ) : (
              <span className="text-4xl">🎤</span>
            )}
          </Button>
        </div>

        {/* Status */}
        <div className="text-center mb-4">
          {isListening ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-pulse flex space-x-1">
                <div className="w-1 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-red-600 font-medium">Listening...</span>
            </div>
          ) : (
            <span className="text-gray-600">Click the microphone to start recording</span>
          )}
        </div>

        {/* Transcript Display */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">
              Transcript
            </label>
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                disabled={!transcript && !interimTranscript}
              >
                📋 Copy
              </Button>
              <Button
                onClick={clearTranscript}
                variant="outline"
                size="sm"
                disabled={!transcript && !interimTranscript}
              >
                🗑️ Clear
              </Button>
            </div>
          </div>
          <div className="w-full min-h-32 p-3 border border-gray-300 rounded-lg bg-gray-50">
            {transcript || interimTranscript ? (
              <>
                <span className="text-gray-800">{transcript}</span>
                <span className="text-gray-500 italic">{interimTranscript}</span>
              </>
            ) : (
              <span className="text-gray-400">Your speech will appear here...</span>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Click the microphone button to start recording</li>
            <li>• Speak clearly into your microphone</li>
            <li>• Your speech will be transcribed in real-time</li>
            <li>• Click the microphone again to stop recording</li>
            <li>• Use the Copy button to copy the transcript</li>
          </ul>
        </div>

        {/* Language Selection (Future Enhancement) */}
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Currently set to English (US). Multi-language support coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}