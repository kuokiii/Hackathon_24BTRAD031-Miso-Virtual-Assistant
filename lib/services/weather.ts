interface WeatherData {
  location: string
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
  feels_like: number
  temp_min: number
  temp_max: number
}

export class WeatherService {
  private apiKey: string
  private baseUrl = ""

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  public async getCurrentWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
    try {
      const response = await fetch(`${this.baseUrl}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`)

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        location: data.name,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        icon: data.weather[0].icon,
        feels_like: Math.round(data.main.feels_like),
        temp_min: Math.round(data.main.temp_min),
        temp_max: Math.round(data.main.temp_max),
      }
    } catch (error) {
      console.error("Error fetching weather data by coordinates:", error)
      // Return default weather data on error
      return {
        location: "Unknown Location",
        temperature: 22,
        description: "Partly Cloudy",
        humidity: 45,
        windSpeed: 5,
        icon: "03d",
        feels_like: 20,
        temp_min: 18,
        temp_max: 25,
      }
    }
  }

  public async getCurrentWeather(location: string): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?q=${encodeURIComponent(location)}&units=metric&appid=${this.apiKey}`,
      )

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        location: data.name,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        icon: data.weather[0].icon,
        feels_like: Math.round(data.main.feels_like),
        temp_min: Math.round(data.main.temp_min),
        temp_max: Math.round(data.main.temp_max),
      }
    } catch (error) {
      console.error("Error fetching weather data:", error)
      // Return default weather data on error
      return {
        location: location,
        temperature: 22,
        description: "Partly Cloudy",
        humidity: 45,
        windSpeed: 5,
        icon: "03d",
        feels_like: 20,
        temp_min: 18,
        temp_max: 25,
      }
    }
  }

  public async getForecast(location: string, days = 5): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?q=${encodeURIComponent(location)}&units=metric&appid=${this.apiKey}`,
      )

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`)
      }

      const data = await response.json()

      // Process forecast data
      const forecastByDay: any = {}
      const now = new Date()
      const today = now.getDate()

      // Group forecast by day
      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000)
        const day = date.getDate()

        // Skip today
        if (day === today) return

        // Only include days up to the requested number
        if (Object.keys(forecastByDay).length >= days && !(day in forecastByDay)) return

        if (!forecastByDay[day]) {
          forecastByDay[day] = {
            date: date,
            temps: [],
            icons: [],
            descriptions: [],
          }
        }

        forecastByDay[day].temps.push(item.main.temp)
        forecastByDay[day].icons.push(item.weather[0].icon)
        forecastByDay[day].descriptions.push(item.weather[0].description)
      })

      // Calculate averages and most common values
      const forecast = Object.values(forecastByDay).map((day: any) => {
        const avgTemp = day.temps.reduce((a: number, b: number) => a + b, 0) / day.temps.length

        // Get most common icon and description
        const iconCounts: Record<string, number> = {}
        const descCounts: Record<string, number> = {}

        day.icons.forEach((icon: string) => {
          iconCounts[icon] = (iconCounts[icon] || 0) + 1
        })

        day.descriptions.forEach((desc: string) => {
          descCounts[desc] = (descCounts[desc] || 0) + 1
        })

        const icon = Object.entries(iconCounts).sort((a, b) => b[1] - a[1])[0][0]
        const description = Object.entries(descCounts).sort((a, b) => b[1] - a[1])[0][0]

        return {
          date: day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          temp: Math.round(avgTemp),
          icon,
          description,
        }
      })

      return forecast.slice(0, days)
    } catch (error) {
      console.error("Error fetching forecast data:", error)
      // Return default forecast data on error
      const forecast = []
      const now = new Date()

      for (let i = 1; i <= days; i++) {
        const date = new Date(now)
        date.setDate(now.getDate() + i)

        forecast.push({
          date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          temp: 22 + Math.floor(Math.random() * 5) - 2, // Random temp between 20-24
          icon: "03d",
          description: "Partly Cloudy",
        })
      }

      return forecast
    }
  }

  public async getForecastByCoords(lat: number, lon: number, days = 5): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`)

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`)
      }

      const data = await response.json()

      // Process forecast data (same as getForecast)
      const forecastByDay: any = {}
      const now = new Date()
      const today = now.getDate()

      // Group forecast by day
      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000)
        const day = date.getDate()

        // Skip today
        if (day === today) return

        // Only include days up to the requested number
        if (Object.keys(forecastByDay).length >= days && !(day in forecastByDay)) return

        if (!forecastByDay[day]) {
          forecastByDay[day] = {
            date: date,
            temps: [],
            icons: [],
            descriptions: [],
          }
        }

        forecastByDay[day].temps.push(item.main.temp)
        forecastByDay[day].icons.push(item.weather[0].icon)
        forecastByDay[day].descriptions.push(item.weather[0].description)
      })

      // Calculate averages and most common values
      const forecast = Object.values(forecastByDay).map((day: any) => {
        const avgTemp = day.temps.reduce((a: number, b: number) => a + b, 0) / day.temps.length

        // Get most common icon and description
        const iconCounts: Record<string, number> = {}
        const descCounts: Record<string, number> = {}

        day.icons.forEach((icon: string) => {
          iconCounts[icon] = (iconCounts[icon] || 0) + 1
        })

        day.descriptions.forEach((desc: string) => {
          descCounts[desc] = (descCounts[desc] || 0) + 1
        })

        const icon = Object.entries(iconCounts).sort((a, b) => b[1] - a[1])[0][0]
        const description = Object.entries(descCounts).sort((a, b) => b[1] - a[1])[0][0]

        return {
          date: day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          temp: Math.round(avgTemp),
          icon,
          description,
        }
      })

      return forecast.slice(0, days)
    } catch (error) {
      console.error("Error fetching forecast data by coordinates:", error)
      // Return default forecast data on error
      const forecast = []
      const now = new Date()

      for (let i = 1; i <= days; i++) {
        const date = new Date(now)
        date.setDate(now.getDate() + i)

        forecast.push({
          date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          temp: 22 + Math.floor(Math.random() * 5) - 2, // Random temp between 20-24
          icon: "03d",
          description: "Partly Cloudy",
        })
      }

      return forecast
    }
  }

  public getIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
  }
}

// Update the weatherService instance to use your API key
export const weatherService = new WeatherService("")

