"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { weatherService } from "@/lib/services/weather"
import { Cloud, CloudRain, Sun, Thermometer, ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"

interface WeatherDisplayProps {
  location: string
  weatherData: any
  forecastData?: any[]
  setSpecialCommandResult?: (result: any) => void
}

// City-specific weather data for fallback
const cityWeatherData = {
  "New York": { temperature: 22, description: "Partly Cloudy", icon: "03d" },
  London: { temperature: 18, description: "Rainy", icon: "10d" },
  Tokyo: { temperature: 26, description: "Clear Sky", icon: "01d" },
  Sydney: { temperature: 28, description: "Sunny", icon: "01d" },
  Paris: { temperature: 20, description: "Cloudy", icon: "04d" },
  Berlin: { temperature: 17, description: "Light Rain", icon: "09d" },
  Moscow: { temperature: 5, description: "Snow", icon: "13d" },
  Dubai: { temperature: 35, description: "Clear Sky", icon: "01d" },
  Mumbai: { temperature: 32, description: "Humid", icon: "50d" },
  Bengaluru: { temperature: 27, description: "Partly Cloudy", icon: "02d" },
  Delhi: { temperature: 30, description: "Haze", icon: "50d" },
  Singapore: { temperature: 31, description: "Thunderstorm", icon: "11d" },
  "Hong Kong": { temperature: 29, description: "Cloudy", icon: "04d" },
  Cairo: { temperature: 33, description: "Clear Sky", icon: "01d" },
  Rome: { temperature: 24, description: "Sunny", icon: "01d" },
  Bangkok: { temperature: 32, description: "Scattered Clouds", icon: "03d" },
  Istanbul: { temperature: 21, description: "Partly Cloudy", icon: "02d" },
  Seoul: { temperature: 19, description: "Cloudy", icon: "04d" },
  "Mexico City": { temperature: 23, description: "Partly Cloudy", icon: "02d" },
  Amsterdam: { temperature: 16, description: "Light Rain", icon: "09d" },
}

export default function WeatherDisplay({
  location: initialLocation,
  weatherData: initialWeatherData,
  forecastData: initialForecastData,
  setSpecialCommandResult,
}: WeatherDisplayProps) {
  const [activeTab, setActiveTab] = useState("current")
  const [searchInput, setSearchInput] = useState(initialLocation || "New York")
  const [location, setLocation] = useState(initialLocation || "New York")
  const [weatherData, setWeatherData] = useState(
    initialWeatherData || {
      temperature: 22,
      description: "Partly Cloudy",
      icon: "03d",
      humidity: 45,
    },
  )
  const [forecastData, setForecastData] = useState(initialForecastData || [])
  const [isLoading, setIsLoading] = useState(false)

  // Get weather icon based on condition
  const getWeatherIcon = (description: string | undefined, size = 6) => {
    // If description is undefined, return a default icon
    if (!description) {
      return <Thermometer className={`h-${size} w-${size}`} />
    }

    const desc = description.toLowerCase()

    if (desc.includes("rain") || desc.includes("drizzle") || desc.includes("shower")) {
      return <CloudRain className={`h-${size} w-${size}`} />
    } else if (desc.includes("cloud")) {
      return <Cloud className={`h-${size} w-${size}`} />
    } else if (desc.includes("clear") || desc.includes("sun")) {
      return <Sun className={`h-${size} w-${size}`} />
    } else {
      return <Thermometer className={`h-${size} w-${size}`} />
    }
  }

  const fetchWeatherData = async (loc: string) => {
    setIsLoading(true)
    try {
      // Fetch current weather
      const weather = await weatherService.getCurrentWeather(loc)
      setWeatherData(weather)
      setLocation(weather.location || loc)

      // Fetch forecast
      try {
        const forecast = await weatherService.getForecast(loc, 5)
        setForecastData(forecast)
      } catch (error) {
        console.error("Error fetching forecast:", error)
        // Generate fallback forecast data
        const fallbackForecast = generateFallbackForecast(loc)
        setForecastData(fallbackForecast)
      }
    } catch (error) {
      console.error("Error fetching weather:", error)

      // Use fallback data for the location or generate random data
      const fallbackData = getFallbackWeatherData(loc)
      setWeatherData(fallbackData)
      setLocation(loc)

      // Generate fallback forecast
      const fallbackForecast = generateFallbackForecast(loc)
      setForecastData(fallbackForecast)

      toast({
        title: "Using estimated weather data",
        description: "Could not connect to weather service. Showing estimated data.",
        variant: "default",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate fallback weather data based on location or random if not found
  const getFallbackWeatherData = (loc: string) => {
    // Check if we have predefined data for this city
    const normalizedLoc = loc.trim()

    // Try to find a match in our predefined city data
    for (const [city, data] of Object.entries(cityWeatherData)) {
      if (normalizedLoc.toLowerCase().includes(city.toLowerCase())) {
        return {
          location: loc,
          ...data,
          humidity: Math.floor(Math.random() * 30) + 40, // Random humidity between 40-70%
        }
      }
    }

    // If no match, generate random data based on location string
    // Use the string to seed a simple hash for deterministic but varied results
    const hash = normalizedLoc.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

    // Generate temperature based on hash (15-35°C range)
    const temp = 15 + (hash % 20)

    // Select description based on hash
    const descriptions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear Sky"]
    const descIndex = hash % descriptions.length

    return {
      location: loc,
      temperature: temp,
      description: descriptions[descIndex],
      icon:
        descIndex === 0 ? "01d" : descIndex === 1 ? "02d" : descIndex === 2 ? "04d" : descIndex === 3 ? "10d" : "01d",
      humidity: 40 + (hash % 30),
    }
  }

  // Generate fallback forecast data
  const generateFallbackForecast = (loc: string) => {
    const forecast = []
    const baseTemp = weatherData.temperature || 22
    const now = new Date()

    for (let i = 1; i <= 5; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() + i)

      // Vary temperature slightly each day (+/- 3 degrees)
      const tempVariation = Math.floor(Math.random() * 6) - 3
      const temp = baseTemp + tempVariation

      // Vary weather condition
      const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear Sky"]
      const conditionIndex = Math.floor(Math.random() * conditions.length)

      forecast.push({
        date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        temp: temp,
        description: conditions[conditionIndex],
        icon:
          conditionIndex === 0
            ? "01d"
            : conditionIndex === 1
              ? "02d"
              : conditionIndex === 2
                ? "04d"
                : conditionIndex === 3
                  ? "10d"
                  : "01d",
      })
    }

    return forecast
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (searchInput.trim()) {
      fetchWeatherData(searchInput.trim())
    }
  }

  // Fetch weather data when component mounts if we don't have data
  useEffect(() => {
    if (!initialWeatherData || Object.keys(initialWeatherData).length === 0) {
      fetchWeatherData(location)
    }
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <div className="p-4 border-b border-primary/10">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Enter location (e.g., New York)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pr-10"
            />
            <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0 h-full">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="current">Current Weather</TabsTrigger>
          <TabsTrigger value="forecast" disabled={forecastData.length === 0}>
            Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="p-0">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading weather data...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <h3 className="text-2xl font-semibold mb-2">{location}</h3>

                <div className="flex items-center justify-center my-4 text-primary">
                  {weatherData.icon ? (
                    <img
                      src={weatherService.getIconUrl(weatherData.icon) || "/placeholder.svg"}
                      alt={weatherData.description || "Weather"}
                      className="w-24 h-24"
                    />
                  ) : (
                    getWeatherIcon(weatherData.description, 24)
                  )}
                </div>

                <div className="text-4xl font-bold mb-2">{weatherData.temperature}°C</div>
                <div className="text-lg capitalize mb-4">{weatherData.description}</div>
              </div>
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="forecast" className="p-0">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">5-Day Forecast for {location}</h3>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading forecast data...</p>
              </div>
            ) : forecastData.length > 0 ? (
              <div className="space-y-3">
                {forecastData.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-primary mr-3">
                        {day.icon ? (
                          <img
                            src={weatherService.getIconUrl(day.icon) || "/placeholder.svg"}
                            alt={day.description || "Weather"}
                            className="w-10 h-10"
                          />
                        ) : (
                          getWeatherIcon(day.description, 10)
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{day.date}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {day.description || "Partly Cloudy"}
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-bold">{day.temp}°C</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No forecast data available</div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>

      <div className="p-4 border-t border-primary/10">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setSpecialCommandResult && setSpecialCommandResult(null)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chat
        </Button>
      </div>
    </Card>
  )
}



