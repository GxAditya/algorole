'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import type { UserPreferences } from '@/types/job';

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const defaults: UserPreferences = {
      roles: [],
      locations: [],
      keywords: [],
      seniority: [],
      visa_sponsorship: false,
      job_types: [],
      exclude_keywords: [],
    };
    // Load existing preferences from localStorage
    if (typeof window === 'undefined') return defaults;
    try {
      const saved = localStorage.getItem('user_preferences');
      return saved ? (JSON.parse(saved) as UserPreferences) : defaults;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return defaults;
    }
  });

  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const addRole = () => {
    if (roleInput.trim() && !preferences.roles.includes(roleInput.trim())) {
      setPreferences({
        ...preferences,
        roles: [...preferences.roles, roleInput.trim()],
      });
      setRoleInput('');
    }
  };

  const removeRole = (role: string) => {
    setPreferences({
      ...preferences,
      roles: preferences.roles.filter((r) => r !== role),
    });
  };

  const addLocation = () => {
    if (locationInput.trim() && !preferences.locations.includes(locationInput.trim())) {
      setPreferences({
        ...preferences,
        locations: [...preferences.locations, locationInput.trim()],
      });
      setLocationInput('');
    }
  };

  const removeLocation = (location: string) => {
    setPreferences({
      ...preferences,
      locations: preferences.locations.filter((l) => l !== location),
    });
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !preferences.keywords.includes(keywordInput.trim())) {
      setPreferences({
        ...preferences,
        keywords: [...preferences.keywords, keywordInput.trim()],
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setPreferences({
      ...preferences,
      keywords: preferences.keywords.filter((k) => k !== keyword),
    });
  };

  const handleSave = async () => {
    try {
      // Save to localStorage
      localStorage.setItem('user_preferences', JSON.stringify(preferences));
      alert('Preferences saved!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Your Preferences
        </h1>
        <p className="text-muted-foreground text-lg mb-12">
          Help us find the best matches for you
        </p>

        <div className="space-y-8">
          {/* Roles */}
          <Card className="p-6 border-2">
            <label className="block text-base font-semibold mb-3">
              Target Roles
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                type="text"
                placeholder="Software Engineer"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRole()}
                className="flex-1"
              />
              <Button onClick={addRole} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.roles.map((role) => (
                <Badge key={role} variant="secondary" className="pl-3 pr-2 py-1.5">
                  {role}
                  <button
                    onClick={() => removeRole(role)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </Card>

          {/* Locations */}
          <Card className="p-6 border-2">
            <label className="block text-base font-semibold mb-3">
              Preferred Locations
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                type="text"
                placeholder="San Francisco or Remote"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                className="flex-1"
              />
              <Button onClick={addLocation} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.locations.map((location) => (
                <Badge key={location} variant="secondary" className="pl-3 pr-2 py-1.5">
                  {location}
                  <button
                    onClick={() => removeLocation(location)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </Card>

          {/* Keywords */}
          <Card className="p-6 border-2">
            <label className="block text-base font-semibold mb-3">
              Skills & Keywords
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                type="text"
                placeholder="React, TypeScript, Node.js"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                className="flex-1"
              />
              <Button onClick={addKeyword} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.keywords.map((keyword) => (
                <Badge key={keyword} variant="outline" className="font-mono pl-3 pr-2 py-1.5">
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </Card>

          {/* Visa Sponsorship */}
          <Card className="p-6 border-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-base font-semibold mb-1">
                  Visa Sponsorship
                </label>
                <p className="text-sm text-muted-foreground">
                  Only show jobs that offer visa sponsorship
                </p>
              </div>
              <Button
                variant={preferences.visa_sponsorship ? 'default' : 'outline'}
                onClick={() =>
                  setPreferences({
                    ...preferences,
                    visa_sponsorship: !preferences.visa_sponsorship,
                  })
                }
              >
                {preferences.visa_sponsorship ? 'Required' : 'Not Required'}
              </Button>
            </div>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} size="lg" className="w-full">
            Save Preferences
          </Button>
        </div>
      </main>
    </div>
  );
}
