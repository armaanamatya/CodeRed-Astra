'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Bot, Loader2, Volume2, Send, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface ActionData {
  type: string;
  command?: string;
  parameters?: Record<string, unknown>;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: ActionData;
}

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const recognitionRef = useRef<unknown>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

          setTranscript(final);
          setInterimTranscript(interim);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (transcript) {
            setEditableTranscript(transcript);
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
  }, [transcript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition is not supported in your browser.');
      return;
    }

    const recognition = recognitionRef.current as Record<string, unknown>;
    if (isListening) {
      (recognition.stop as () => void)();
    } else {
      (recognition.start as () => void)();
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
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: command,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/gemini/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: command }),
      });

      if (!response.ok) throw new Error('Failed to process command');

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.text,
        timestamp: new Date(),
        action: data.action,
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Handle action if present
      if (data.action) {
        await executeAction(data.action);
      }

      // Speak the response
      await speakResponse(data.text);
    } catch (error) {
      console.error('Error:', error);
      console.error('Failed to process your command. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAction = async (action: ActionData) => {
    try {
      switch (action.type) {
        case 'gmail':
          if (action.command === 'send') {
            // Execute Gmail send via MCP
            const toParam = action.parameters?.to as string | undefined;
            const subjectParam = action.parameters?.subject as string | undefined;
            const bodyParam = action.parameters?.body as string | undefined;
            await fetch('/api/gmail/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: toParam,
                subject: subjectParam,
                body: bodyParam,
              }),
            });
          }
          break;
        
        case 'calendar':
          if (action.command === 'create') {
            // Execute Calendar create via MCP
            const titleParam = action.parameters?.title as string | undefined;
            const startParam = action.parameters?.start as string | undefined;
            const endParam = action.parameters?.end as string | undefined;
            const calResponse = await fetch('/api/calendar/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: titleParam,
                start: startParam,
                end: endParam,
              }),
            });
            const calData = await calResponse.json();
            console.log('Calendar response:', calData);
          }
          break;
          
        default:
          console.log('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      console.error('Failed to execute the requested action.');
    }
  };

  const speakResponse = async (text: string) => {
    setIsSpeaking(true);
    try {
      const response = await fetch('/api/elevenlabs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: 'EXAVITQu4vr4xnSDxMaL', // Default voice
        }),
      });

      if (!response.ok) throw new Error('Failed to generate speech');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-6 w-6" />
        <h2 className="text-2xl font-bold">AI Voice Assistant</h2>
      </div>

      <ScrollArea className="h-[400px] mb-4 p-4 border rounded-lg">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Say something like:</p>
            <p className="text-sm mt-2">&quot;Send an email to John&quot;</p>
            <p className="text-sm">&quot;What&apos;s on my calendar today?&quot;</p>
            <p className="text-sm">&quot;Create a meeting for tomorrow at 2 PM&quot;</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="space-y-4">
        {(transcript || interimTranscript) && !showConfirmation && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Listening...</p>
            <p className="text-sm">
              {transcript || interimTranscript}
              {interimTranscript && <span className="opacity-50 animate-pulse">...</span>}
            </p>
          </div>
        )}

        {showConfirmation && (
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Review your message:</p>
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
                className="min-h-[80px] resize-none"
                placeholder="Type your message..."
                autoFocus
              />
            ) : (
              <p className="text-sm p-2 bg-background rounded">{editableTranscript}</p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={confirmAndSend}
                disabled={!editableTranscript.trim() || isProcessing}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to AI
              </Button>
              <Button
                onClick={cancelTranscript}
                variant="outline"
                disabled={isProcessing}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleListening}
            variant={isListening ? 'destructive' : 'default'}
            size="lg"
            disabled={isProcessing || showConfirmation}
            className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            {isListening ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>

          {isProcessing && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          )}

          {isSpeaking && (
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 animate-pulse" />
              <span className="text-sm">Speaking...</span>
            </div>
          )}
        </div>

        {!showConfirmation && !isListening && (
          <p className="text-center text-sm text-muted-foreground">
            Click the microphone to start speaking
          </p>
        )}
      </div>

      <audio ref={audioRef} className="hidden" onEnded={() => setIsSpeaking(false)} />
    </Card>
  );
}

