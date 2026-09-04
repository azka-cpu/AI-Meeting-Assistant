'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import Toggle from '@/components/ui/toggle';

export default function VoiceAssistantPage() {
  const [isListening, setIsListening] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    enabled: true,
    autoTranscribe: true,
    realTimeAnalysis: true,
    nativeLanguage: 'English',
  });

  return (
    <>
      <Header
        title="Voice Assistant"
        subtitle="AI-powered voice features for your meetings"
      />

      <main className="p-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Voice Control */}
          <div className="lg:col-span-2">
            <Card>
              <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8 text-center">
                Meeting Voice Assistant
              </h3>

              <div className="flex flex-col items-center justify-center mb-8">
                <button
                  onClick={() => setIsListening(!isListening)}
                  className={`
                    w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300
                    ${isListening
                      ? 'bg-[var(--color-error)] shadow-lg shadow-[var(--color-error)]/50 animate-pulse'
                      : 'bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/50'
                    }
                  `}
                >
                  <span className="text-4xl">
                    {isListening ? '🎙️' : '🎤'}
                  </span>
                </button>

                <p className="text-center mt-6 text-lg font-semibold">
                  {isListening ? (
                    <>
                      <span className="text-[var(--color-error)]">Recording...</span>
                      <p className="text-sm text-[var(--color-text-muted)] mt-2">
                        Click to stop listening
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-[var(--color-text-primary)]">Ready to listen</span>
                      <p className="text-sm text-[var(--color-text-muted)] mt-2">
                        Click to start recording
                      </p>
                    </>
                  )}
                </p>
              </div>

              <div className="bg-[var(--color-background-dark)] rounded-lg p-6 mb-6">
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                  Transcription Output:
                </p>
                <p className="text-[var(--color-text-primary)] leading-relaxed">
                  {isListening
                    ? 'Listening to your voice... Please speak clearly'
                    : 'No active transcription. Click the microphone button to start.'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" fullWidth>
                  📋 Copy Transcript
                </Button>
                <Button variant="secondary" fullWidth>
                  🔄 Clear
                </Button>
              </div>
            </Card>

            {/* Voice Commands */}
            <Card className="mt-6">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
                Voice Commands
              </h3>

              <div className="space-y-3">
                <div className="p-3 bg-[var(--color-background-dark)] rounded-lg">
                  <p className="font-medium text-[var(--color-text-primary)] text-sm">
                    "Summarize the meeting"
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Get an AI-generated summary of everything discussed
                  </p>
                </div>

                <div className="p-3 bg-[var(--color-background-dark)] rounded-lg">
                  <p className="font-medium text-[var(--color-text-primary)] text-sm">
                    "What are the action items?"
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Extract all action items and owners from the meeting
                  </p>
                </div>

                <div className="p-3 bg-[var(--color-background-dark)] rounded-lg">
                  <p className="font-medium text-[var(--color-text-primary)] text-sm">
                    "Who made which decisions?"
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Get a breakdown of all decisions made and by whom
                  </p>
                </div>

                <div className="p-3 bg-[var(--color-background-dark)] rounded-lg">
                  <p className="font-medium text-[var(--color-text-primary)] text-sm">
                    "Generate a follow-up email"
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Create a follow-up email with all key points
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Settings */}
          <div>
            <Card>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">
                Voice Settings
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-[var(--color-text-primary)]">
                      Voice Assistant
                    </p>
                    <Toggle
                      checked={voiceSettings.enabled}
                      onChange={(e) =>
                        setVoiceSettings({ ...voiceSettings, enabled: e.target.checked })
                      }
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Enable voice features
                  </p>
                </div>

                <div className="border-t border-[var(--color-border)] pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-[var(--color-text-primary)]">
                      Auto Transcribe
                    </p>
                    <Toggle
                      checked={voiceSettings.autoTranscribe}
                      onChange={(e) =>
                        setVoiceSettings({ ...voiceSettings, autoTranscribe: e.target.checked })
                      }
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Automatically transcribe all meetings
                  </p>
                </div>

                <div className="border-t border-[var(--color-border)] pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-[var(--color-text-primary)]">
                      Real-time Analysis
                    </p>
                    <Toggle
                      checked={voiceSettings.realTimeAnalysis}
                      onChange={(e) =>
                        setVoiceSettings({ ...voiceSettings, realTimeAnalysis: e.target.checked })
                      }
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Analyze content as it's spoken
                  </p>
                </div>

                <div className="border-t border-[var(--color-border)] pt-6">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                    Native Language
                  </p>
                  <select className="input-field text-sm">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Mandarin</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Status */}
            <Card className="mt-6">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
                Status
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Microphone
                  </p>
                  <Badge variant="success" size="sm">
                    Ready
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    API Connection
                  </p>
                  <Badge variant="success" size="sm">
                    Connected
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Processing
                  </p>
                  <Badge variant="info" size="sm">
                    Idle
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}