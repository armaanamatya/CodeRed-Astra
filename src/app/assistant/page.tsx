import { VoiceAssistant } from '@/components/ai-assistant/VoiceAssistant';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AssistantPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">AI Voice Assistant</h1>
        <VoiceAssistant />
      </div>
    </ProtectedRoute>
  );
}