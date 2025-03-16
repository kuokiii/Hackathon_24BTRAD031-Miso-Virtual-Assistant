"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { homeAssistant } from "@/lib/services/home-assistant"
import { Lightbulb, Thermometer, Power, Speaker, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

// Update the component to accept a new prop for closing the display
interface HomeControlsProps {
  onClose?: () => void
}

export default function HomeControls({ onClose }: HomeControlsProps) {
  const [devices, setDevices] = useState<any>({
    lights: {},
    thermostats: {},
    switches: {},
    media_players: {},
  })
  const [activeTab, setActiveTab] = useState("lights")
  const [loading, setLoading] = useState(true)

  // Load devices on mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        // Connect to Home Assistant (this is a mock connection)
        await homeAssistant.connect()

        // Get all states
        const states = await homeAssistant.getStates()

        // Group devices by domain
        const groupedDevices: any = {
          lights: {},
          thermostats: {},
          switches: {},
          media_players: {},
        }

        states.forEach((state: any) => {
          const domain = state.entity_id.split(".")[0]

          if (domain === "light") {
            groupedDevices.lights[state.entity_id] = state
          } else if (domain === "climate") {
            groupedDevices.thermostats[state.entity_id] = state
          } else if (domain === "switch") {
            groupedDevices.switches[state.entity_id] = state
          } else if (domain === "media_player") {
            groupedDevices.media_players[state.entity_id] = state
          }
        })

        setDevices(groupedDevices)
      } catch (error) {
        console.error("Error loading devices:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDevices()
  }, [])

  // Toggle a light
  const toggleLight = async (entityId: string) => {
    try {
      const currentState = devices.lights[entityId].state
      const newState = currentState === "on" ? "off" : "on"

      await homeAssistant.callService("light", `turn_${newState}`, { entity_id: entityId })

      // Update local state
      setDevices((prev) => ({
        ...prev,
        lights: {
          ...prev.lights,
          [entityId]: {
            ...prev.lights[entityId],
            state: newState,
          },
        },
      }))
    } catch (error) {
      console.error(`Error toggling light ${entityId}:`, error)
    }
  }

  // Set light brightness
  const setLightBrightness = async (entityId: string, brightness: number) => {
    try {
      await homeAssistant.callService("light", "turn_on", {
        entity_id: entityId,
        brightness: Math.round(brightness * 255),
      })

      // Update local state
      setDevices((prev) => ({
        ...prev,
        lights: {
          ...prev.lights,
          [entityId]: {
            ...prev.lights[entityId],
            state: "on",
            attributes: {
              ...prev.lights[entityId].attributes,
              brightness: Math.round(brightness * 255),
            },
          },
        },
      }))
    } catch (error) {
      console.error(`Error setting brightness for ${entityId}:`, error)
    }
  }

  // Toggle a switch
  const toggleSwitch = async (entityId: string) => {
    try {
      const currentState = devices.switches[entityId].state
      const newState = currentState === "on" ? "off" : "on"

      await homeAssistant.callService("switch", `turn_${newState}`, { entity_id: entityId })

      // Update local state
      setDevices((prev) => ({
        ...prev,
        switches: {
          ...prev.switches,
          [entityId]: {
            ...prev.switches[entityId],
            state: newState,
          },
        },
      }))
    } catch (error) {
      console.error(`Error toggling switch ${entityId}:`, error)
    }
  }

  // Set thermostat temperature
  const setTemperature = async (entityId: string, temperature: number) => {
    try {
      await homeAssistant.callService("climate", "set_temperature", {
        entity_id: entityId,
        temperature,
      })

      // Update local state
      setDevices((prev) => ({
        ...prev,
        thermostats: {
          ...prev.thermostats,
          [entityId]: {
            ...prev.thermostats[entityId],
            state: "on",
            attributes: {
              ...prev.thermostats[entityId].attributes,
              target_temp: temperature,
            },
          },
        },
      }))
    } catch (error) {
      console.error(`Error setting temperature for ${entityId}:`, error)
    }
  }

  // Set media player volume
  const setVolume = async (entityId: string, volume: number) => {
    try {
      await homeAssistant.callService("media_player", "volume_set", {
        entity_id: entityId,
        volume_level: volume,
      })

      // Update local state
      setDevices((prev) => ({
        ...prev,
        media_players: {
          ...prev.media_players,
          [entityId]: {
            ...prev.media_players[entityId],
            attributes: {
              ...prev.media_players[entityId].attributes,
              volume: volume,
            },
          },
        },
      }))
    } catch (error) {
      console.error(`Error setting volume for ${entityId}:`, error)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 flex justify-center items-center h-40">
          <div className="animate-pulse text-center">
            <p>Loading smart home devices...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Smart Home Controls</CardTitle>
        <Button variant="outline" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chat
        </Button>
      </CardHeader>

      <Tabs defaultValue="lights" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="lights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Lights</span>
          </TabsTrigger>
          <TabsTrigger value="thermostats" className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            <span className="hidden sm:inline">Climate</span>
          </TabsTrigger>
          <TabsTrigger value="switches" className="flex items-center gap-2">
            <Power className="h-4 w-4" />
            <span className="hidden sm:inline">Switches</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Speaker className="h-4 w-4" />
            <span className="hidden sm:inline">Media</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lights" className="p-0">
          <CardContent className="p-6">
            {Object.keys(devices.lights).length === 0 ? (
              <p className="text-center text-muted-foreground">No lights found</p>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {Object.entries(devices.lights).map(([entityId, device]: [string, any]) => (
                    <div key={entityId} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb
                            className={`h-5 w-5 ${device.state === "on" ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <span className="font-medium">{device.attributes.friendly_name}</span>
                        </div>
                        <Switch checked={device.state === "on"} onCheckedChange={() => toggleLight(entityId)} />
                      </div>

                      {device.state === "on" && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label htmlFor={`${entityId}-brightness`}>Brightness</Label>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(((device.attributes.brightness || 0) / 255) * 100)}%
                            </span>
                          </div>
                          <Slider
                            id={`${entityId}-brightness`}
                            min={0}
                            max={1}
                            step={0.01}
                            value={[(device.attributes.brightness || 0) / 255]}
                            onValueChange={([value]) => setLightBrightness(entityId, value)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="thermostats" className="p-0">
          <CardContent className="p-6">
            {Object.keys(devices.thermostats).length === 0 ? (
              <p className="text-center text-muted-foreground">No thermostats found</p>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {Object.entries(devices.thermostats).map(([entityId, device]: [string, any]) => (
                    <div key={entityId} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Thermometer
                            className={`h-5 w-5 ${device.state === "on" ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <span className="font-medium">{device.attributes.friendly_name}</span>
                        </div>
                        <div className="text-xl font-bold">{device.attributes.temperature}°C</div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor={`${entityId}-temp`}>Target Temperature</Label>
                          <span className="text-sm text-muted-foreground">{device.attributes.target_temp}°C</span>
                        </div>
                        <Slider
                          id={`${entityId}-temp`}
                          min={16}
                          max={28}
                          step={0.5}
                          value={[device.attributes.target_temp]}
                          onValueChange={([value]) => setTemperature(entityId, value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="switches" className="p-0">
          <CardContent className="p-6">
            {Object.keys(devices.switches).length === 0 ? (
              <p className="text-center text-muted-foreground">No switches found</p>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {Object.entries(devices.switches).map(([entityId, device]: [string, any]) => (
                    <div key={entityId} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Power
                            className={`h-5 w-5 ${device.state === "on" ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <span className="font-medium">{device.attributes.friendly_name}</span>
                        </div>
                        <Switch checked={device.state === "on"} onCheckedChange={() => toggleSwitch(entityId)} />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="media" className="p-0">
          <CardContent className="p-6">
            {Object.keys(devices.media_players).length === 0 ? (
              <p className="text-center text-muted-foreground">No media players found</p>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {Object.entries(devices.media_players).map(([entityId, device]: [string, any]) => (
                    <div key={entityId} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Speaker
                            className={`h-5 w-5 ${device.state !== "off" ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <span className="font-medium">{device.attributes.friendly_name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">{device.state}</div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor={`${entityId}-volume`}>Volume</Label>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(device.attributes.volume * 100)}%
                          </span>
                        </div>
                        <Slider
                          id={`${entityId}-volume`}
                          min={0}
                          max={1}
                          step={0.01}
                          value={[device.attributes.volume]}
                          onValueChange={([value]) => setVolume(entityId, value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  )
}



