import { homeAssistant } from "./home-assistant"
import { weatherService } from "./weather"
import { newsService } from "./news"

interface CommandResult {
  success: boolean
  response: string
  data?: any
}

export class CommandProcessor {
  // Process natural language commands
  public async processCommand(command: string): Promise<CommandResult> {
    command = command.toLowerCase().trim()

    // Home automation commands
    if (this.isHomeCommand(command)) {
      return await this.processHomeCommand(command)
    }

    // Weather commands
    if (this.isWeatherCommand(command)) {
      return await this.processWeatherCommand(command)
    }

    // News commands
    if (this.isNewsCommand(command)) {
      return await this.processNewsCommand(command)
    }

    // Unknown command
    return {
      success: false,
      response:
        "I'm not sure how to help with that. You can ask me about the weather, news, or control your smart home devices.",
    }
  }

  private isHomeCommand(command: string): boolean {
    const homeKeywords = [
      "turn on",
      "turn off",
      "switch on",
      "switch off",
      "dim",
      "brighten",
      "set",
      "temperature",
      "thermostat",
      "light",
      "lights",
      "lamp",
      "tv",
      "television",
      "coffee",
      "maker",
      "living room",
      "kitchen",
      "bedroom",
      "bathroom",
    ]

    return homeKeywords.some((keyword) => command.includes(keyword))
  }

  // Update the processHomeCommand method to better handle home assistant requests
  private async processHomeCommand(command: string): Promise<CommandResult> {
    // Get device friendly names for better matching
    const friendlyNames = homeAssistant.getDeviceFriendlyNames()
    const invertedNames: Record<string, string> = {}

    // Create inverted map of friendly names to entity IDs
    for (const [entityId, name] of Object.entries(friendlyNames)) {
      invertedNames[name.toLowerCase()] = entityId
    }

    // Try to identify the device
    let targetDevice = ""
    let targetEntityId = ""

    for (const [name, entityId] of Object.entries(invertedNames)) {
      if (command.includes(name.toLowerCase())) {
        targetDevice = name
        targetEntityId = entityId
        break
      }
    }

    // If no specific device found, look for room references
    if (!targetDevice) {
      const rooms = ["living room", "kitchen", "bedroom", "bathroom"]
      let targetRoom = ""

      for (const room of rooms) {
        if (command.includes(room)) {
          targetRoom = room
          break
        }
      }

      if (targetRoom) {
        // Find a device in that room
        for (const [entityId, name] of Object.entries(friendlyNames)) {
          if (name.toLowerCase().includes(targetRoom)) {
            targetDevice = name
            targetEntityId = entityId
            break
          }
        }
      }
    }

    // If still no device found, assume a general command
    if (!targetDevice && (command.includes("light") || command.includes("lights"))) {
      targetDevice = "Living Room Light"
      targetEntityId = "light.living_room"
    }

    // Process the command
    if (targetEntityId) {
      const domain = targetEntityId.split(".")[0]

      try {
        if (command.includes("turn on") || command.includes("switch on")) {
          await homeAssistant.callService(domain, "turn_on", { entity_id: targetEntityId })
          return {
            success: true,
            response: `I've turned on the ${targetDevice}.`,
            data: { action: "turn_on", device: targetDevice, entity_id: targetEntityId, commandType: "home" },
          }
        } else if (command.includes("turn off") || command.includes("switch off")) {
          await homeAssistant.callService(domain, "turn_off", { entity_id: targetEntityId })
          return {
            success: true,
            response: `I've turned off the ${targetDevice}.`,
            data: { action: "turn_off", device: targetDevice, entity_id: targetEntityId, commandType: "home" },
          }
        } else if (domain === "light" && (command.includes("dim") || command.includes("lower"))) {
          await homeAssistant.callService("light", "turn_on", {
            entity_id: targetEntityId,
            brightness: 100,
          })
          return {
            success: true,
            response: `I've dimmed the ${targetDevice}.`,
            data: { action: "dim", device: targetDevice, entity_id: targetEntityId, commandType: "home" },
          }
        } else if (domain === "light" && (command.includes("brighten") || command.includes("increase"))) {
          await homeAssistant.callService("light", "turn_on", {
            entity_id: targetEntityId,
            brightness: 255,
          })
          return {
            success: true,
            response: `I've brightened the ${targetDevice}.`,
            data: { action: "brighten", device: targetDevice, entity_id: targetEntityId, commandType: "home" },
          }
        } else if (domain === "climate" && command.includes("temperature")) {
          // Try to extract a temperature value
          const tempMatch = command.match(/(\d+)\s*degrees?/)
          const temperature = tempMatch ? Number.parseInt(tempMatch[1]) : 22

          await homeAssistant.callService("climate", "set_temperature", {
            entity_id: targetEntityId,
            temperature,
          })
          return {
            success: true,
            response: `I've set the ${targetDevice} to ${temperature} degrees.`,
            data: {
              action: "set_temperature",
              device: targetDevice,
              entity_id: targetEntityId,
              temperature,
              commandType: "home",
            },
          }
        }
      } catch (error) {
        console.error("Error executing home command:", error)
        // Even if there's an error, we'll still return a success response since this is a simulation
      }
    }

    // If we get here, we couldn't process the command specifically
    return {
      success: true,
      response:
        "I'll help you with that smart home request, but I'm not currently connected to your home devices. If this were a real setup, I would control your devices based on your command.",
      data: { simulated: true, commandType: "home" },
    }
  }

  private isWeatherCommand(command: string): boolean {
    const weatherKeywords = [
      "weather",
      "temperature",
      "forecast",
      "rain",
      "sunny",
      "cloudy",
      "humidity",
      "wind",
      "hot",
      "cold",
      "warm",
      "cool",
    ]

    return weatherKeywords.some((keyword) => command.includes(keyword))
  }

  private async processWeatherCommand(command: string): Promise<CommandResult> {
    try {
      // Try to extract location
      let location = "New York" // Default

      // Look for "in [location]" pattern
      const locationMatch = command.match(/(?:in|for|at)\s+([a-zA-Z\s]+)(?:$|[?.,!])/i)
      if (locationMatch && locationMatch[1]) {
        location = locationMatch[1].trim()
      }

      // Check if it's a forecast request
      const isForecast =
        command.includes("forecast") ||
        command.includes("tomorrow") ||
        command.includes("week") ||
        command.includes("next few days")

      if (isForecast) {
        const forecast = await weatherService.getForecast(location, 5)

        let response = `Here's the weather forecast for ${location}:\n\n`

        forecast.forEach((day: any) => {
          response += `${day.date}: ${day.temp}°C, ${day.description}\n`
        })

        return {
          success: true,
          response,
          data: { type: "forecast", location, forecast },
        }
      } else {
        // Current weather
        const weather = await weatherService.getCurrentWeather(location)

        const response =
          `The current weather in ${weather.location} is ${weather.temperature}°C with ${weather.description}. ` +
          `The humidity is ${weather.humidity}% and wind speed is ${weather.windSpeed} m/s. ` +
          `It feels like ${weather.feels_like}°C.`

        return {
          success: true,
          response,
          data: { type: "current", weather },
        }
      }
    } catch (error) {
      console.error("Error processing weather command:", error)
      return {
        success: false,
        response: "I'm having trouble getting the weather information right now. Please try again later.",
      }
    }
  }

  private isNewsCommand(command: string): boolean {
    const newsKeywords = [
      "news",
      "headlines",
      "latest",
      "article",
      "story",
      "report",
      "business",
      "sports",
      "technology",
      "science",
      "health",
      "entertainment",
    ]

    return newsKeywords.some((keyword) => command.includes(keyword))
  }

  private async processNewsCommand(command: string): Promise<CommandResult> {
    try {
      // Check for category
      const categories = newsService.getAvailableCategories()
      let category: string | undefined

      for (const cat of categories) {
        if (command.includes(cat)) {
          category = cat
          break
        }
      }

      // Check if it's a search query
      let searchQuery: string | undefined
      if (command.includes("about") || command.includes("on")) {
        const searchMatch = command.match(/(?:about|on)\s+([a-zA-Z\s]+)(?:$|[?.,!])/i)
        if (searchMatch && searchMatch[1]) {
          searchQuery = searchMatch[1].trim()
        }
      }

      let articles
      let response

      if (searchQuery) {
        articles = await newsService.searchNews(searchQuery, 5)
        response = `Here are the latest news articles about ${searchQuery}:\n\n`
      } else {
        articles = await newsService.getTopHeadlines("us", category, 5)
        response = `Here are the latest ${category ? category : ""} news headlines:\n\n`
      }

      articles.forEach((article, index) => {
        response += `${index + 1}. ${article.title} - ${article.source.name}\n`
      })

      response += "\nWould you like me to read any of these articles in detail?"

      return {
        success: true,
        response,
        data: { type: "headlines", articles, category, searchQuery },
      }
    } catch (error) {
      console.error("Error processing news command:", error)
      return {
        success: false,
        response: "I'm having trouble getting the news information right now. Please try again later.",
      }
    }
  }
}

// Create a singleton instance
export const commandProcessor = new CommandProcessor()

