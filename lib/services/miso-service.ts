import { homeAssistant } from "./home-assistant"
import { weatherService } from "./weather"
import { newsService } from "./news"
import { commandProcessor } from "./command-processor"

export class MisoService {
  // Process a user message and determine if it's a special command
  public async processMessage(message: string): Promise<{
    isSpecialCommand: boolean
    response?: string
    commandType?: string
    data?: any
  }> {
    try {
      // Try to process as a command
      const commandResult = await commandProcessor.processCommand(message)

      if (commandResult.success) {
        return {
          isSpecialCommand: true,
          response: commandResult.response,
          commandType: this.getCommandType(message),
          data: commandResult.data,
        }
      }

      // Not a special command
      return {
        isSpecialCommand: false,
      }
    } catch (error) {
      console.error("Error processing message:", error)
      return {
        isSpecialCommand: false,
      }
    }
  }

  private getCommandType(message: string): string {
    message = message.toLowerCase()

    if (
      message.includes("light") ||
      message.includes("turn on") ||
      message.includes("turn off") ||
      message.includes("thermostat") ||
      message.includes("temperature") ||
      message.includes("switch")
    ) {
      return "home"
    }

    if (
      message.includes("weather") ||
      message.includes("temperature") ||
      message.includes("forecast") ||
      message.includes("rain") ||
      message.includes("sunny")
    ) {
      return "weather"
    }

    if (message.includes("news") || message.includes("headlines") || message.includes("articles")) {
      return "news"
    }

    return "unknown"
  }

  // Get home assistant service
  public getHomeAssistant() {
    return homeAssistant
  }

  // Get weather service
  public getWeatherService() {
    return weatherService
  }

  // Get news service
  public getNewsService() {
    return newsService
  }
}

// Create a singleton instance
export const misoService = new MisoService()

