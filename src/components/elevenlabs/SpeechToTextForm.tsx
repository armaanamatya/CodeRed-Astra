'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { SUPPORTED_LANGUAGES } from '@/lib/elevenlabs';

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

type TranscriptionMode = 'realtime' | 'file';

export function SpeechToTextForm() {
  // Real-time transcription state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // File-based transcription state
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>('realtime');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [uploadProgress, setUploadProgress] = useState(0);

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

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when in real-time mode
      if (transcriptionMode !== 'realtime') return;
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      
      // Debug logging (remove in production)
      console.log('Key pressed:', {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        isMac
      });
      
      // Mac: Function + Control (F12 key with Ctrl modifier)
      // Windows: Just Control key (but not with other modifiers)
      const isShortcut = isMac 
        ? event.key === 'F12' && event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey
        : event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.key !== 'Control';

      if (isShortcut && recognitionRef.current) {
        console.log('Shortcut activated!');
        event.preventDefault();
        event.stopPropagation();
        toggleListening();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown, true);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [transcriptionMode, isListening]);

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
      const textToCopy = transcriptionMode === 'realtime' 
        ? transcript + interimTranscript 
        : transcriptionResult;
      await navigator.clipboard.writeText(textToCopy);
      // You could add a toast notification here
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleFileTranscription = async () => {
    if (!selectedFile) {
      setError('Please select an audio file');
      return;
    }

    setIsTranscribing(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('language', selectedLanguage);

      const response = await fetch('/api/elevenlabs/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to transcribe audio');
      }

      setTranscriptionResult(result.transcription);
      setUploadProgress(100);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearFileTranscription = () => {
    setSelectedFile(null);
    setTranscriptionResult('');
    setUploadProgress(0);
  };

  const clearAllTranscripts = () => {
    if (transcriptionMode === 'realtime') {
      setTranscript('');
      setInterimTranscript('');
    } else {
      clearFileTranscription();
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

      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-1">
          <button
            onClick={() => setTranscriptionMode('realtime')}
            className={`px-4 py-2 rounded-md transition-colors ${
              transcriptionMode === 'realtime'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🎤 Real-time
          </button>
          <button
            onClick={() => setTranscriptionMode('file')}
            className={`px-4 py-2 rounded-md transition-colors ${
              transcriptionMode === 'file'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📁 Upload File
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {transcriptionMode === 'realtime' ? (
          <>
            {/* Real-time Mode UI */}
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
                <div className="space-y-2">
                  <span className="text-gray-600">Click the microphone to start recording</span>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>⌨️ Keyboard shortcut:</div>
                    <div className="flex justify-center text-xs">
                      <span className="bg-gray-100 px-3 py-1 rounded font-mono">
                        {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Fn + Ctrl' : 'Ctrl'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* File Upload Mode UI */}
            <div className="space-y-4">
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Audio File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label
                    htmlFor="audio-upload"
                    className="cursor-pointer block"
                  >
                    <div className="text-4xl mb-2">🎵</div>
                    <p className="text-gray-600 mb-2">
                      {selectedFile ? selectedFile.name : 'Click to select audio file'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports MP3, WAV, FLAC, M4A, OGG (max 3GB)
                    </p>
                  </label>
                </div>
              </div>

              {/* Upload Progress */}
              {isTranscribing && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {/* Transcribe Button */}
              <Button
                onClick={handleFileTranscription}
                disabled={!selectedFile || isTranscribing}
                className="w-full"
                size="lg"
              >
                {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
              </Button>
            </div>
          </>
        )}

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
                disabled={
                  transcriptionMode === 'realtime' 
                    ? !transcript && !interimTranscript
                    : !transcriptionResult
                }
              >
                📋 Copy
              </Button>
              <Button
                onClick={clearAllTranscripts}
                variant="outline"
                size="sm"
                disabled={
                  transcriptionMode === 'realtime' 
                    ? !transcript && !interimTranscript
                    : !transcriptionResult && !selectedFile
                }
              >
                🗑️ Clear
              </Button>
            </div>
          </div>
          <div className="w-full min-h-32 p-3 border border-gray-300 rounded-lg bg-gray-50">
            {transcriptionMode === 'realtime' ? (
              transcript || interimTranscript ? (
                <>
                  <span className="text-gray-800">{transcript}</span>
                  <span className="text-gray-500 italic">{interimTranscript}</span>
                </>
              ) : (
                <span className="text-gray-400">Your speech will appear here...</span>
              )
            ) : (
              transcriptionResult ? (
                <span className="text-gray-800">{transcriptionResult}</span>
              ) : (
                <span className="text-gray-400">Upload an audio file to see transcription...</span>
              )
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            {transcriptionMode === 'realtime' ? (
              <>
                <li>• Click the microphone button or use keyboard shortcuts to start recording</li>
                <li>• <strong>Mac:</strong> Fn + Ctrl</li>
                <li>• <strong>Windows/Linux:</strong> Ctrl</li>
                <li>• Speak clearly into your microphone</li>
                <li>• Your speech will be transcribed in real-time</li>
                <li>• Use the same shortcut or click the microphone to stop recording</li>
                <li>• Use the Copy button to copy the transcript</li>
                <li>• Works best in Chrome, Edge, or Safari browsers</li>
              </>
            ) : (
              <>
                <li>• Select your preferred language for transcription</li>
                <li>• Click to upload an audio file (MP3, WAV, FLAC, M4A, OGG)</li>
                <li>• Files up to 3GB and 10 hours duration are supported</li>
                <li>• Click &quot;Transcribe Audio&quot; to process the file</li>
                <li>• Wait for the transcription to complete</li>
                <li>• Use the Copy button to copy the transcript</li>
              </>
            )}
          </ul>
        </div>

        {/* Mode-specific Info */}
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            {transcriptionMode === 'realtime' ? (
              <>
                <strong>Real-time Mode:</strong> Uses your browser&apos;s built-in speech recognition for instant transcription. 
                Best for quick notes and live conversations. Use keyboard shortcuts for hands-free recording!
              </>
            ) : (
              <>
                <strong>File Upload Mode:</strong> Uses ElevenLabs&apos; advanced AI for high-accuracy transcription. 
                Supports 99+ languages and provides better accuracy for longer recordings.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}