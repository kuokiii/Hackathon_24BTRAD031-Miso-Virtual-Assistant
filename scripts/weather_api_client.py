#!/usr/bin/env python3
"""
Weather API Client

This script provides a client for fetching weather data from various weather APIs.
It supports multiple providers and handles authentication, rate limiting, and data formatting.
"""

import os
import sys
import json
import time
import argparse
import requests
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("WeatherAPIClient")

# API Configuration
API_CONFIGS = {
    "openweathermap": {
        "base_url": "https://api.openweathermap.org/data/2.5",
        "endpoints": {
            "current": "/weather",
            "forecast": "/forecast",
            "onecall": "/onecall"
        },
        "params": {
            "appid": None,  # API key to be set
            "units": "metric"
        }
    },
    "weatherapi": {
        "base_url": "https://api.weatherapi.com/v1",
        "endpoints": {
            "current": "/current.json",
            "forecast": "/forecast.json",
            "history": "/history.json"
        },
        "params": {
            "key": None,  # API key to be set
            "aqi": "yes"
        }
    }
}

class WeatherAPIClient:
    """Client for fetching weather data from various weather APIs."""
    
    def __init__(self, provider: str = "openweathermap", api_key: Optional[str] = None):
        """Initialize the client with a provider and API key."""
        if provider not in API_CONFIGS:
            raise ValueError(f"Unsupported provider: {provider}. Supported providers: {list(API_CONFIGS.keys())}")
        
        self.provider = provider
        self.config = API_CONFIGS[provider]
        
        # Set API key
        if api_key:
            if provider == "openweathermap":
                self.config["params"]["appid"] = api_key
            elif provider == "weatherapi":
                self.config["params"]["key"] = api_key
        else:
            # Try to get API key from environment variables
            env_var_name = f"{provider.upper()}_API_KEY"
            api_key = os.environ.get(env_var_name)
            if not api_key:
                raise ValueError(f"API key not provided and {env_var_name} environment variable not set")
            
            if provider == "openweathermap":
                self.config["params"]["appid"] = api_key
            elif provider == "weatherapi":
                self.config["params"]["key"] = api_key
        
        # Initialize rate limiting
        self.last_request_time = 0
        self.min_request_interval = 1.0  # seconds
    
    def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Make a request to the API with rate limiting."""
        # Apply rate limiting
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        if time_since_last_request < self.min_request_interval:
            time.sleep(self.min_request_interval - time_since_last_request)
        
        # Prepare request
        url = f"{self.config['base_url']}{self.config['endpoints'][endpoint]}"
        all_params = {**self.config['params'], **params}
        
        # Make request
        logger.info(f"Making request to {url} with params {all_params}")
        try:
            response = requests.get(url, params=all_params)
            response.raise_for_status()
            self.last_request_time = time.time()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            if hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text}")
            raise
    
    def get_current_weather(self, location: str) -> Dict[str, Any]:
        """Get current weather for a location."""
        params = {"q": location}
        return self._make_request("current", params)
    
    def get_forecast(self, location: str, days: int = 5) -> Dict[str, Any]:
        """Get weather forecast for a location."""
        params = {"q": location}
        
        if self.provider == "weatherapi":
            params["days"] = days
        
        return self._make_request("forecast", params)
    
    def get_weather_by_coordinates(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get current weather for coordinates."""
        params = {"lat": lat, "lon": lon}
        return self._make_request("current", params)
    
    def get_forecast_by_coordinates(self, lat: float, lon: float, days: int = 5) -> Dict[str, Any]:
        """Get weather forecast for coordinates."""
        params = {"lat": lat, "lon": lon}
        
        if self.provider == "weatherapi":
            params["days"] = days
        
        return self._make_request("forecast", params)
    
    def save_to_file(self, data: Dict[str, Any], filename: str) -> bool:
        """Save weather data to a JSON file."""
        try:
            with open(filename, 'w') as file:
                json.dump(data, file, indent=2)
            logger.info(f"Data saved to {filename}")
            return True
        except Exception as e:
            logger.error(f"Error saving data to {filename}: {e}")
            return False


def main():
    """Main function to run the script from command line."""
    parser = argparse.ArgumentParser(description="Fetch weather data from weather APIs")
    parser.add_argument("location", help="Location to get weather for (city name or coordinates)")
    parser.add_argument("--provider", choices=list(API_CONFIGS.keys()), default="openweathermap",
                        help="Weather API provider")
    parser.add_argument("--api-key", help="API key for the provider")
    parser.add_argument("--forecast", action="store_true", help="Get forecast instead of current weather")
    parser.add_argument("--days", type=int, default=5, help="Number of days for forecast")
    parser.add_argument("--output", help="Output file for weather data")
    parser.add_argument("--coordinates", action="store_true", help="Treat location as 'lat,lon'")
    
    args = parser.parse_args()
    
    try:
        client = WeatherAPIClient(args.provider, args.api_key)
        
        if args.coordinates:
            try:
                lat, lon = map(float, args.location.split(','))
                if args.forecast:
                    data = client.get_forecast_by_coordinates(lat, lon, args.days)
                else:
                    data = client.get_weather_by_coordinates(lat, lon)
            except ValueError:
                logger.error("Invalid coordinates format. Use 'latitude,longitude'")
                sys.exit(1)
        else:
            if args.forecast:
                data = client.get_forecast(args.location, args.days)
            else:
                data = client.get_current_weather(args.location)
        
        if args.output:
            client.save_to_file(data, args.output)
        else:
            print(json.dumps(data, indent=2))
    
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

