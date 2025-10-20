'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Send, Edit2, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/context/ThemeContext';

interface Action {
  functionName: string;
  parameters?: Record<string, unknown>;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: Action;
}

export function NaviMascot() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const recognitionRef = useRef<unknown>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<string>('');  // ✅ Add this ref to track latest transcript
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Check if component is mounted (for theme detection)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI && typeof SpeechRecognitionAPI === 'function') {
        const recognition = new (SpeechRecognitionAPI as new() => unknown)() as Record<string, unknown>;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript('');
          setInterimTranscript('');
          transcriptRef.current = '';  // ✅ Reset the ref too
        };

        recognition.onresult = (event: Record<string, unknown>) => {
          let interim = '';
          let final = '';

          const resultIndex = event.resultIndex as number;
          const results = event.results as Record<string, unknown>[];
          for (let i = resultIndex; i < results.length; ++i) {
            const result = results[i] as Record<string, unknown>;
            if (result.isFinal) {
              const alt = (result[0] as Record<string, unknown>);
              final += alt.transcript as string;
            } else {
              const alt = (result[0] as Record<string, unknown>);
              interim += alt.transcript as string;
            }
          }

          if (final) {
            setTranscript(final);
            transcriptRef.current = final;  // ✅ Update ref immediately
          }
          setInterimTranscript(interim);
        };

        recognition.onend = () => {
          setIsListening(false);
          // ✅ Use the ref which has the latest value, not the state
          const finalTranscript = transcriptRef.current;
          if (finalTranscript) {
            setEditableTranscript(finalTranscript);
            setShowConfirmation(true);
          }
        };

        recognition.onerror = (event: Record<string, unknown>) => {
          setIsListening(false);
          console.error('Speech Recognition Error:', event.error);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);  // ✅ Remove transcript from dependency array - only run once on mount

  // Keyboard shortcut: Ctrl + Alt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && !isListening && !showConfirmation) {
        e.preventDefault();
        startListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, showConfirmation]);

  const startListening = () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition is not supported in your browser.');
      return;
    }

    const recognition = recognitionRef.current as Record<string, unknown>;
    if (!isListening) {
      (recognition.start as () => void)();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      const recognition = recognitionRef.current as Record<string, unknown>;
      (recognition.stop as () => void)();
    }
  };

  const confirmAndSend = () => {
    if (editableTranscript.trim()) {
      handleCommand(editableTranscript);
      setShowConfirmation(false);
      setEditableTranscript('');
      setTranscript('');
    }
  };

  const cancelTranscript = () => {
    setShowConfirmation(false);
    setEditableTranscript('');
    setTranscript('');
    setInterimTranscript('');
  };

  const handleCommand = async (command: string) => {
    setIsProcessing(true);
    setErrorMessage('');
    setProcessingStage('Sending to AI...');
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: command,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Send to Gemini
      const response = await fetch('/api/gemini/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: command }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process command');
      }

      setProcessingStage('AI is thinking...');
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.text,
        timestamp: new Date(),
        action: data.action,
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Start speaking immediately
      const speakPromise = speakResponse(data.text);

      // Execute action in parallel
      if (data.action) {
        setProcessingStage('Executing action...');
        try {
          await executeAction(data.action);
          setProcessingStage('Success!');
          // Clear success message after 2 seconds
          setTimeout(() => setProcessingStage(''), 2000);
        } catch (actionError) {
          const errorMsg = actionError instanceof Error ? actionError.message : 'Action failed';
          setErrorMessage(errorMsg);
          setProcessingStage('');
          // Speak the error
          await speakResponse(`Sorry, there was an error: ${errorMsg}`);
        }
      } else {
        setProcessingStage('');
      }

      // Wait for speaking to finish
      await speakPromise;
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to process your command';
      setErrorMessage(errorMsg);
      setProcessingStage('');
      await speakResponse(`Sorry, I encountered an error. ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAction = async (action: Action) => {
    console.log('Executing MCP action:', action);
    
    // Call the MCP registry to execute the function
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        functionName: action.functionName,
        parameters: action.parameters || {}
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to execute ${action.functionName}`);
    }
    
    const result = await response.json();
    
    // Check if the MCP function execution was successful
    if (!result.success) {
      throw new Error(result.error || `Failed to execute ${action.functionName}`);
    }
    
    console.log('MCP action result:', result);
    return result;
  };

  const speakResponse = async (text: string) => {
    if (!text || text.trim() === '') return;
    
    setIsSpeaking(true);
    try {
      const response = await fetch('/api/elevenlabs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voiceId: 'EXAVITQu4vr4xnSDxMaL',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        // Play immediately and wait for it to finish
        await audioRef.current.play();
        
        // Wait for audio to end
        await new Promise((resolve) => {
          if (audioRef.current) {
            audioRef.current.onended = resolve;
          }
        });
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      // Fallback: at least show the error but don't throw
      setErrorMessage('Could not play voice response');
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <>
      {/* Navi Mascot Button */}
      <button
        onClick={startListening}
        disabled={isListening || showConfirmation}
        className="fixed bottom-6 right-6 z-50 group disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Start Voice Assistant"
      >
        <div className="relative">
          {/* Glow effect - pulse when listening */}
          <div className={`absolute -inset-2 rounded-full blur-xl transition-all duration-300 ${
            isListening 
              ? 'bg-red-400/60 animate-pulse' 
              : 'bg-green-400/20 group-hover:bg-green-400/40'
          }`} />
          
          {/* Mascot */}
          <div className={`relative w-20 h-20 rounded-full p-2 shadow-lg transition-all duration-300 transform ${
            mounted && theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } ${
            isListening 
              ? 'scale-110 shadow-2xl ring-4 ring-red-400' 
              : 'group-hover:shadow-2xl group-hover:scale-110 group-active:scale-95'
          }`}>
            {mounted && (
              <Image
                src={theme === 'dark' ? "/Navi.png" : "/NaviLightMode.png"}
                alt="Navi Assistant"
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            )}
          </div>
          
          {/* Pulse animation when listening */}
          {isListening && (
            <div className="absolute -inset-1 rounded-full border-2 border-red-400 opacity-75 animate-ping" />
          )}
          
          {/* Speech bubble on hover */}
          {!isListening && !showConfirmation && (
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
                Click to speak or press Ctrl+Alt
                <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
              </div>
            </div>
          )}
        </div>
      </button>

      {/* Listening indicator */}
      {isListening && (
        <div className="fixed bottom-28 right-6 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 max-w-md animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Listening...</p>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {transcript || interimTranscript || 'Speak now...'}
            {interimTranscript && <span className="opacity-50 animate-pulse">...</span>}
          </p>
          <Button
            onClick={stopListening}
            size="sm"
            variant="outline"
            className="mt-3 w-full"
          >
            Stop Recording
          </Button>
        </div>
      )}

      {/* Confirmation/Edit Dialog */}
      {showConfirmation && (
        <div className="fixed bottom-28 right-6 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 max-w-md animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Review your message:</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 px-2"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          
          {isEditing ? (
            <Textarea
              value={editableTranscript}
              onChange={(e) => setEditableTranscript(e.target.value)}
              className="min-h-[80px] resize-none mb-3"
              placeholder="Type your message..."
              autoFocus
            />
          ) : (
            <p className="text-sm p-3 bg-gray-50 dark:bg-gray-700 rounded mb-3 text-gray-700 dark:text-gray-300">
              {editableTranscript}
            </p>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={confirmAndSend}
              disabled={!editableTranscript.trim() || isProcessing}
              className="flex-1"
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
            <Button
              onClick={cancelTranscript}
              variant="outline"
              disabled={isProcessing}
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Processing/Speaking indicators */}
      {(isProcessing || isSpeaking || processingStage || errorMessage) && (
        <div className="fixed bottom-28 right-6 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 max-w-md animate-in fade-in">
          <div className="space-y-2">
            {/* Processing stages */}
            {processingStage && (
              <div className="flex items-center gap-3">
                {processingStage === 'Success!' ? (
                  <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {processingStage}
                </span>
              </div>
            )}
            
            {/* Speaking indicator */}
            {isSpeaking && (
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 animate-pulse text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Speaking...</span>
              </div>
            )}
            
            {/* Error message */}
            {errorMessage && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">✕</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error</p>
                  <p className="text-xs text-red-600 dark:text-red-300">{errorMessage}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setErrorMessage('')}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <audio ref={audioRef} className="hidden" onEnded={() => setIsSpeaking(false)} />
    </>
  );
}