interface HomeAssistantConfig {
  baseUrl?: string
  token?: string
}

export class HomeAssistantService {
  private baseUrl: string
  private token: string | null
  private connected = false
  private devices: Record<string, any> = {}

  constructor(config?: HomeAssistantConfig) {
    this.baseUrl = config?.baseUrl || "http://localhost:8123"
    this.token = config?.token || null

    // Initialize with mock devices
    this.initializeMockDevices()
  }

  private initializeMockDevices() {
    this.devices = {
      lights: {
        "light.living_room": { state: "off", brightness: 0, friendly_name: "Living Room Light" },
        "light.kitchen": { state: "off", brightness: 0, friendly_name: "Kitchen Light" },
        "light.bedroom": { state: "off", brightness: 0, friendly_name: "Bedroom Light" },
        "light.bathroom": { state: "off", brightness: 0, friendly_name: "Bathroom Light" },
      },
      thermostats: {
        "climate.living_room": {
          state: "off",
          temperature: 21,
          target_temp: 21,
          mode: "off",
          friendly_name: "Living Room Thermostat",
        },
      },
      switches: {
        "switch.tv": { state: "off", friendly_name: "TV" },
        "switch.coffee_maker": { state: "off", friendly_name: "Coffee Maker" },
      },
      sensors: {
        "sensor.temperature": { state: 21, unit: "°C", friendly_name: "Indoor Temperature" },
        "sensor.humidity": { state: 45, unit: "%", friendly_name: "Indoor Humidity" },
      },
      media_players: {
        "media_player.living_room": {
          state: "idle",
          volume: 0.5,
          source: "None",
          friendly_name: "Living Room Speaker",
        },
      },
    }
  }

  public async connect(baseUrl?: string, token?: string): Promise<boolean> {
    if (baseUrl) this.baseUrl = baseUrl
    if (token) this.token = token

    // Simulate connection
    this.connected = true
    return true
  }

  public isConnected(): boolean {
    return this.connected
  }

  public async getStates(): Promise<any> {
    // Return all device states
    const allDevices = Object.values(this.devices).flatMap((category) =>
      Object.entries(category).map(([entity_id, attributes]) => ({
        entity_id,
        state: attributes.state,
        attributes,
      })),
    )

    return allDevices
  }

  public async getState(entityId: string): Promise<any> {
    // Find the device in our mock data
    for (const category of Object.values(this.devices)) {
      if (entityId in category) {
        return {
          entity_id: entityId,
          state: category[entityId].state,
          attributes: category[entityId],
        }
      }
    }

    throw new Error(`Entity ${entityId} not found`)
  }

  public async setState(entityId: string, state: string): Promise<any> {
    // Update state in our mock data
    for (const category of Object.values(this.devices)) {
      if (entityId in category) {
        category[entityId].state = state
        return {
          entity_id: entityId,
          state: state,
          attributes: category[entityId],
        }
      }
    }

    throw new Error(`Entity ${entityId} not found`)
  }

  public async callService(domain: string, service: string, data: any): Promise<any> {
    // Handle different service calls
    if (domain === "light") {
      if (service === "turn_on") {
        const entityId = data.entity_id
        if (entityId in this.devices.lights) {
          this.devices.lights[entityId].state = "on"
          if (data.brightness) {
            this.devices.lights[entityId].brightness = data.brightness
          } else {
            this.devices.lights[entityId].brightness = 255
          }
        }
      } else if (service === "turn_off") {
        const entityId = data.entity_id
        if (entityId in this.devices.lights) {
          this.devices.lights[entityId].state = "off"
          this.devices.lights[entityId].brightness = 0
        }
      }
    } else if (domain === "switch") {
      if (service === "turn_on") {
        const entityId = data.entity_id
        if (entityId in this.devices.switches) {
          this.devices.switches[entityId].state = "on"
        }
      } else if (service === "turn_off") {
        const entityId = data.entity_id
        if (entityId in this.devices.switches) {
          this.devices.switches[entityId].state = "off"
        }
      }
    } else if (domain === "climate") {
      if (service === "set_temperature") {
        const entityId = data.entity_id
        if (entityId in this.devices.thermostats) {
          this.devices.thermostats[entityId].target_temp = data.temperature
          this.devices.thermostats[entityId].state = "on"
          this.devices.thermostats[entityId].mode = "heat"
        }
      } else if (service === "turn_off") {
        const entityId = data.entity_id
        if (entityId in this.devices.thermostats) {
          this.devices.thermostats[entityId].state = "off"
          this.devices.thermostats[entityId].mode = "off"
        }
      }
    } else if (domain === "media_player") {
      if (service === "volume_set") {
        const entityId = data.entity_id
        if (entityId in this.devices.media_players) {
          this.devices.media_players[entityId].volume = data.volume_level
        }
      } else if (service === "turn_on") {
        const entityId = data.entity_id
        if (entityId in this.devices.media_players) {
          this.devices.media_players[entityId].state = "on"
        }
      } else if (service === "turn_off") {
        const entityId = data.entity_id
        if (entityId in this.devices.media_players) {
          this.devices.media_players[entityId].state = "off"
        }
      }
    }

    return { success: true }
  }

  // Helper method to get all available devices
  public getAvailableDevices(): Record<string, string[]> {
    const result: Record<string, string[]> = {}

    for (const [category, devices] of Object.entries(this.devices)) {
      result[category] = Object.keys(devices)
    }

    return result
  }

  // Helper method to get friendly names of devices
  public getDeviceFriendlyNames(): Record<string, string> {
    const result: Record<string, string> = {}

    for (const category of Object.values(this.devices)) {
      for (const [entityId, attributes] of Object.entries(category)) {
        if ("friendly_name" in attributes) {
          result[entityId] = attributes.friendly_name
        }
      }
    }

    return result
  }
}

// Create a singleton instance
export const homeAssistant = new HomeAssistantService()

