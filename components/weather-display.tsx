"use client"

import { useState, useEffect } from "react"
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

export default function WeatherDisplay({
  location: initialLocation,
  weatherData,
  forecastData,
  setSpecialCommandResult,
}: WeatherDisplayProps) {
  const [activeTab, setActiveTab] = useState("current")
  const [location, setLocation] = useState(initialLocation || "New York")
  const [currentWeather, setCurrentWeather] = useState(
    weatherData || {
      temperature: 22,
      description: "Partly Cloudy",
      windSpeed: 5,
      feels_like: 20,
      humidity: 45,
    },
  )
  const [currentForecast, setCurrentForecast] = useState(forecastData || [])
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
      setCurrentWeather(weather)

      // Fetch forecast
      try {
        const forecast = await weatherService.getForecast(loc, 5)
        setCurrentForecast(forecast)
      } catch (error) {
        console.error("Error fetching forecast:", error)
        // Use empty forecast if there's an error
        setCurrentForecast([])
      }

      setLocation(weather.location || loc)
    } catch (error) {
      console.error("Error fetching weather:", error)
      toast({
        title: "Error",
        description: `Failed to get weather for ${loc}. Please try another location.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event: any) => {
    event.preventDefault()
    fetchWeatherData(location)
  }

  // Fetch weather data when component mounts if we don't have data
  useEffect(() => {
    if (!weatherData || Object.keys(weatherData).length === 0) {
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
              value={location}
              onChange={(e) => setLocation(e.target.value)}
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
          <TabsTrigger value="forecast" disabled={currentForecast.length === 0}>
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
                  {currentWeather.icon ? (
                    <img
                      src={weatherService.getIconUrl(currentWeather.icon) || "/placeholder.svg"}
                      alt={currentWeather.description || "Weather"}
                      className="w-24 h-24"
                    />
                  ) : (
                    getWeatherIcon(currentWeather.description, 24)
                  )}
                </div>

                <div className="text-4xl font-bold mb-2">{weatherData.temperature || 22}°C</div>
                <div className="text-lg capitalize mb-4">{weatherData.description || "Partly Cloudy"}</div>
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
            ) : currentForecast.length > 0 ? (
              <div className="space-y-3">
                {currentForecast.map((day, index) => (
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
                    <div className="text-xl font-bold">{day.temp || 22}°C</div>
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

