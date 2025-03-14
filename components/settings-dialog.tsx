"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Volume2, Palette, BrainCircuit } from "lucide-react"

interface SettingsDialogProps {
  voiceSettings: {
    enabled: boolean
    volume: number
    rate: number
    pitch: number
    voice: string
  }
  setVoiceSettings: (settings: any) => void
  themeSettings: {
    darkMode: boolean
    accentColor: string
  }
  setThemeSettings: (settings: any) => void
  modelSettings: {
    model: string
    temperature: number
    systemPrompt: string
  }
  setModelSettings: (settings: any) => void
}

export default function SettingsDialog({
  voiceSettings,
  setVoiceSettings,
  themeSettings,
  setThemeSettings,
  modelSettings,
  setModelSettings,
}: SettingsDialogProps) {
  const [localVoiceSettings, setLocalVoiceSettings] = useState(voiceSettings)
  const [localThemeSettings, setLocalThemeSettings] = useState(themeSettings)
  const [localModelSettings, setLocalModelSettings] = useState(modelSettings)

  const handleSaveVoiceSettings = () => {
    setVoiceSettings(localVoiceSettings)
  }

  const handleSaveThemeSettings = () => {
    setThemeSettings(localThemeSettings)
  }

  const handleSaveModelSettings = () => {
    setModelSettings(localModelSettings)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="voice" className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Voice</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="model" className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" />
              <span className="hidden sm:inline">AI Model</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="voice-enabled">Enable voice responses</Label>
              <Switch
                id="voice-enabled"
                checked={localVoiceSettings.enabled}
                onCheckedChange={(checked) => setLocalVoiceSettings({ ...localVoiceSettings, enabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice-select">Voice</Label>
              <Select
                value={localVoiceSettings.voice}
                onValueChange={(value) => setLocalVoiceSettings({ ...localVoiceSettings, voice: value })}
              >
                <SelectTrigger id="voice-select">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="volume-slider">Volume</Label>
                <span className="text-sm text-muted-foreground">{localVoiceSettings.volume}%</span>
              </div>
              <Slider
                id="volume-slider"
                min={0}
                max={100}
                step={1}
                value={[localVoiceSettings.volume]}
                onValueChange={(value) => setLocalVoiceSettings({ ...localVoiceSettings, volume: value[0] })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rate-slider">Speech Rate</Label>
                <span className="text-sm text-muted-foreground">{localVoiceSettings.rate}x</span>
              </div>
              <Slider
                id="rate-slider"
                min={0.5}
                max={2}
                step={0.1}
                value={[localVoiceSettings.rate]}
                onValueChange={(value) => setLocalVoiceSettings({ ...localVoiceSettings, rate: value[0] })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pitch-slider">Pitch</Label>
                <span className="text-sm text-muted-foreground">{localVoiceSettings.pitch}</span>
              </div>
              <Slider
                id="pitch-slider"
                min={0.5}
                max={2}
                step={0.1}
                value={[localVoiceSettings.pitch]}
                onValueChange={(value) => setLocalVoiceSettings({ ...localVoiceSettings, pitch: value[0] })}
              />
            </div>

            <Button onClick={handleSaveVoiceSettings} className="w-full">
              Save Voice Settings
            </Button>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch
                id="dark-mode"
                checked={localThemeSettings.darkMode}
                onCheckedChange={(checked) => setLocalThemeSettings({ ...localThemeSettings, darkMode: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent-color">Accent Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {["pink", "purple", "blue", "green", "orange"].map((color) => (
                  <button
                    key={color}
                    className={`w-full aspect-square rounded-full border-2 ${
                      localThemeSettings.accentColor === color ? "border-foreground" : "border-transparent"
                    }`}
                    style={{
                      backgroundColor:
                        color === "pink"
                          ? "hsl(335, 80%, 65%)"
                          : color === "purple"
                            ? "hsl(262, 83%, 58%)"
                            : color === "blue"
                              ? "hsl(210, 100%, 50%)"
                              : color === "green"
                                ? "hsl(142, 71%, 45%)"
                                : "hsl(24, 100%, 50%)",
                    }}
                    onClick={() => setLocalThemeSettings({ ...localThemeSettings, accentColor: color })}
                    aria-label={`${color} accent color`}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleSaveThemeSettings} className="w-full">
              Save Appearance Settings
            </Button>
          </TabsContent>

          <TabsContent value="model" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model-select">AI Model</Label>
              <Select
                value={localModelSettings.model}
                onValueChange={(value) => setLocalModelSettings({ ...localModelSettings, model: value })}
              >
                <SelectTrigger id="model-select">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-2.0-pro-exp-02-05:free">Gemini 2.0 Pro</SelectItem>
                  <SelectItem value="anthropic/claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="anthropic/claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="meta-llama/llama-3-70b-instruct">Llama 3 70B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature-slider">Temperature</Label>
                <span className="text-sm text-muted-foreground">{localModelSettings.temperature}</span>
              </div>
              <Slider
                id="temperature-slider"
                min={0}
                max={1}
                step={0.1}
                value={[localModelSettings.temperature]}
                onValueChange={(value) => setLocalModelSettings({ ...localModelSettings, temperature: value[0] })}
              />
              <p className="text-xs text-muted-foreground">
                Lower values make responses more deterministic, higher values make them more creative.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <textarea
                id="system-prompt"
                className="w-full min-h-[100px] p-2 rounded-md border border-input bg-background"
                value={localModelSettings.systemPrompt}
                onChange={(e) => setLocalModelSettings({ ...localModelSettings, systemPrompt: e.target.value })}
                placeholder="Instructions for how the AI assistant should behave..."
              />
              <p className="text-xs text-muted-foreground">This sets the personality and behavior of your assistant.</p>
            </div>

            <Button onClick={handleSaveModelSettings} className="w-full">
              Save Model Settings
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

