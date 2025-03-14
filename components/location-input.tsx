"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface LocationInputProps {
  onLocationChange: (location: string) => void
  defaultLocation?: string
}

export default function LocationInput({ onLocationChange, defaultLocation = "" }: LocationInputProps) {
  const [location, setLocation] = useState(defaultLocation)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (location.trim()) {
      onLocationChange(location.trim())
    }
  }

  const getGeolocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      })
      return
    }

    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Convert coordinates to location name using reverse geocoding
          const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&limit=1&appid=6633ca963c8199791033db2c939e5fbe`,
          )

          if (!response.ok) {
            throw new Error("Failed to get location name")
          }

          const data = await response.json()
          if (data && data.length > 0) {
            const locationName = data[0].name
            setLocation(locationName)
            onLocationChange(locationName)
            toast({
              title: "Location detected",
              description: `Your location: ${locationName}`,
            })
          }
        } catch (error) {
          console.error("Error getting location name:", error)
          toast({
            title: "Error",
            description: "Failed to get your location name. Please enter it manually.",
            variant: "destructive",
          })
        } finally {
          setIsGettingLocation(false)
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        toast({
          title: "Geolocation error",
          description: error.message || "Failed to get your location. Please enter it manually.",
          variant: "destructive",
        })
        setIsGettingLocation(false)
      },
      { timeout: 10000 },
    )
  }

  // Try to get location on initial load if no default location
  useEffect(() => {
    if (!defaultLocation) {
      getGeolocation()
    }
  }, [defaultLocation])

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
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
      <Button type="button" variant="outline" onClick={getGeolocation} disabled={isGettingLocation}>
        <MapPin className="h-4 w-4 mr-2" />
        {isGettingLocation ? "Detecting..." : "My Location"}
      </Button>
    </form>
  )
}

