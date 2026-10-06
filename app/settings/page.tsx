'use client';

import { useState } from 'react';
import { Key, Save, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Header from '@/components/layout/header';

export default function SettingsPage() {
  // Load existing keys from localStorage on init
  const [tinyfishKey, setTinyfishKey] = useState(
    () => (typeof window === 'undefined' ? '' : localStorage.getItem('tinyfish_api_key') ?? '')
  );
  const [llmKey, setLlmKey] = useState(
    () => (typeof window === 'undefined' ? '' : localStorage.getItem('llm_api_key') ?? '')
  );
  const [showTinyfishKey, setShowTinyfishKey] = useState(false);
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Save to localStorage
      if (tinyfishKey.trim()) {
        localStorage.setItem('tinyfish_api_key', tinyfishKey.trim());
      } else {
        localStorage.removeItem('tinyfish_api_key');
      }
      
      if (llmKey.trim()) {
        localStorage.setItem('llm_api_key', llmKey.trim());
      } else {
        localStorage.removeItem('llm_api_key');
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          API Keys
        </h1>
        <p className="text-muted-foreground text-lg mb-12">
          Provide your own API keys to power the job search
        </p>

        <div className="space-y-8">
          {/* TinyFish API Key */}
          <Card className="p-6 border-2">
            <div className="flex items-start gap-3 mb-4">
              <Key className="h-5 w-5 mt-0.5 text-primary" />
              <div className="flex-1">
                <label className="block text-base font-semibold mb-1">
                  TinyFish API Key
                </label>
                <p className="text-sm text-muted-foreground mb-3">
                  Required for job discovery and scraping from company career pages
                </p>
                <div className="relative">
                  <Input
                    type={showTinyfishKey ? 'text' : 'password'}
                    placeholder="tf_live_..."
                    value={tinyfishKey}
                    onChange={(e) => setTinyfishKey(e.target.value)}
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTinyfishKey(!showTinyfishKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showTinyfishKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <a
              href="https://agent.tinyfish.ai/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Get a TinyFish API key →
            </a>
          </Card>

          {/* LLM API Key (Optional) */}
          <Card className="p-6 border-2">
            <div className="flex items-start gap-3 mb-4">
              <Key className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-base font-semibold">
                    LLM API Key
                  </label>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Optional
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  For enhanced job matching and ranking (supports OpenAI format)
                </p>
                <div className="relative">
                  <Input
                    type={showLlmKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={llmKey}
                    onChange={(e) => setLlmKey(e.target.value)}
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLlmKey(!showLlmKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showLlmKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Info Box */}
          <Card className="p-4 border-2 border-primary/20 bg-primary/5">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Your keys stay on your device</p>
                <p className="text-muted-foreground">
                  API keys are stored in your browser&apos;s local storage and only sent 
                  to their respective APIs. We don&apos;t store or transmit your keys to any server.
                </p>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} size="lg" className="w-full" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>

          {/* Success Message */}
          {saveSuccess && (
            <div className="text-center text-sm text-green-600 font-medium">
              Settings saved successfully!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
