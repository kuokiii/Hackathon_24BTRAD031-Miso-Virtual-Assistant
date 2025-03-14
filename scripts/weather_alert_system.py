#!/usr/bin/env python3
"""
Weather Alert System

This script monitors weather conditions and sends alerts when certain thresholds are exceeded.
It can be configured to check various weather parameters and send notifications through different channels.
"""

import os
import sys
import json
import time
import argparse
import logging
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Any, Optional, Union, Callable
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(), logging.FileHandler("weather_alerts.log")]
)
logger = logging.getLogger("WeatherAlertSystem")

# Default thresholds
DEFAULT_THRESHOLDS = {
    "temperature": {
        "high": 35.0,  # °C
        "low": 0.0     # °C
    },
    "wind_speed": {
        "high": 20.0   # m/s
    },
    "humidity": {
        "high": 90.0,  # %
        "low": 20.0    # %
    },
    "precipitation": {
        "high": 25.0   # mm
    }
}

# Notification channels
class EmailNotifier:
    """Class for sending email notifications."""
    
    def __init__(self, smtp_server: str, smtp_port: int, username: str, password: str,
                 sender: str, recipients: List[str]):
        """Initialize the email notifier."""
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.sender = sender
        self.recipients = recipients
    
    def send(self, subject: str, message: str) -> bool:
        """Send an email notification."""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.sender
            msg['To'] = ', '.join(self.recipients)
            msg['Subject'] = subject
            
            msg.attach(MIMEText(message, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.username, self.password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email notification sent to {', '.join(self.recipients)}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            return False


class WebhookNotifier:
    """Class for sending webhook notifications."""
    
    def __init__(self, webhook_url: str, headers: Optional[Dict[str, str]] = None):
        """Initialize the webhook notifier."""
        self.webhook_url = webhook_url
        self.headers = headers or {"Content-Type": "application/json"}
    
    def send(self, subject: str, message: str) -> bool:
        """Send a webhook notification."""
        try:
            payload = {
                "title": subject,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            
            response = requests.post(
                self.webhook_url,
                headers=self.headers,
                json=payload
            )
            
            if response.status_code >= 200 and response.status_code < 300:
                logger.info(f"Webhook notification sent to {self.webhook_url}")
                return True
            else:
                logger.error(f"Failed to send webhook notification. Status code: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Failed to send webhook notification: {e}")
            return False


class ConsoleNotifier:
    """Class for sending console notifications."""
    
    def send(self, subject: str, message: str) -> bool:
        """Send a console notification."""
        try:
            print("\n" + "=" * 50)
            print(f"WEATHER ALERT: {subject}")
            print("-" * 50)
            print(message)
            print("=" * 50 + "\n")
            
            logger.info("Console notification displayed")
            return True
        except Exception as e:
            logger.error(f"Failed to display console notification: {e}")
            return False


class WeatherAlertSystem:
    """Class for monitoring weather conditions and sending alerts."""
    
    def __init__(self, thresholds: Dict[str, Dict[str, float]] = None,
                 notifiers: List[Any] = None):
        """Initialize the alert system with thresholds and notifiers."""
        self.thresholds = thresholds or DEFAULT_THRESHOLDS
        self.notifiers = notifiers or [ConsoleNotifier()]
        self.last_alert_time = {}  # To track when alerts were last sent
    
    def check_conditions(self, weather_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check weather conditions against thresholds."""
        alerts = []
        
        # Check temperature
        if "temperature" in weather_data and "temperature" in self.thresholds:
            temp = weather_data["temperature"]
            if "high" in self.thresholds["temperature"] and temp > self.thresholds["temperature"]["high"]:
                alerts.append({
                    "parameter": "temperature",
                    "value": temp,
                    "threshold": self.thresholds["temperature"]["high"],
                    "condition": "high",
                    "message": f"High temperature alert: {temp}°C exceeds threshold of {self.thresholds['temperature']['high']}°C"
                })
            elif "low" in self.thresholds["temperature"] and temp < self.thresholds["temperature"]["low"]:
                alerts.append({
                    "parameter": "temperature",
                    "value": temp,
                    "threshold": self.thresholds["temperature"]["low"],
                    "condition": "low",
                    "message": f"Low temperature alert: {temp}°C is below threshold of {self.thresholds['temperature']['low']}°C"
                })
        
        # Check wind speed
        if "wind_speed" in weather_data and "wind_speed" in self.thresholds:
            wind = weather_data["wind_speed"]
            if "high" in self.thresholds["wind_speed"] and wind > self.thresholds["wind_speed"]["high"]:
                alerts.append({
                    "parameter": "wind_speed",
                    "value": wind,
                    "threshold": self.thresholds["wind_speed"]["high"],
                    "condition": "high",
                    "message": f"High wind alert: {wind} m/s exceeds threshold of {self.thresholds['wind_speed']['high']} m/s"
                })
        
        # Check humidity
        if "humidity" in weather_data and "humidity" in self.thresholds:
            humidity = weather_data["humidity"]
            if "high" in self.thresholds["humidity"] and humidity > self.thresholds["humidity"]["high"]:
                alerts.append({
                    "parameter": "humidity",
                    "value": humidity,
                    "threshold": self.thresholds["humidity"]["high"],
                    "condition": "high",
                    "message": f"High humidity alert: {humidity}% exceeds threshold of {self.thresholds['humidity']['high']}%"
                })
            elif "low" in self.thresholds["humidity"] and humidity < self.thresholds["humidity"]["low"]:
                alerts.append({
                    "parameter": "humidity",
                    "value": humidity,
                    "threshold": self.thresholds["humidity"]["low"],
                    "condition": "low",
                    "message": f"Low humidity alert: {humidity}% is below threshold of {self.thresholds['humidity']['low']}%"
                })
        
        # Check precipitation
        if "precipitation" in weather_data and "precipitation" in self.thresholds:
            precip = weather_data["precipitation"]
            if "high" in self.thresholds["precipitation"] and precip > self.thresholds["precipitation"]["high"]:
                alerts.append({
                    "parameter": "precipitation",
                    "value": precip,
                    "threshold": self.thresholds["precipitation"]["high"],
                    "condition": "high",
                    "message": f"Heavy precipitation alert: {precip} mm exceeds threshold of {self.thresholds['precipitation']['high']} mm"
                })
        
        return alerts
    
    def send_alerts(self, alerts: List[Dict[str, Any]], location: str, cooldown_minutes: int = 60) -> None:
        """Send alerts through configured notification channels."""
        if not alerts:
            logger.info("No alerts to send")
            return
        
        current_time = datetime.now()
        
        for alert in alerts:
            # Check if we've sent this alert recently
            alert_key = f"{alert['parameter']}_{alert['condition']}"
            if alert_key in self.last_alert_time:
                time_since_last = (current_time - self.last_alert_time[alert_key]).total_seconds() / 60
                if time_since_last < cooldown_minutes:
                    logger.info(f"Skipping alert for {alert_key} (sent {time_since_last:.1f} minutes ago)")
                    continue
            
            # Prepare alert message
            subject = f"Weather Alert for {location}: {alert['parameter'].title()} {alert['condition'].title()}"
            message = (
                f"Weather Alert\n"
                f"-------------\n"
                f"Location: {location}\n"
                f"Time: {current_time.strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"Alert: {alert['message']}\n"
                f"Current value: {alert['value']}\n"
                f"Threshold: {alert['threshold']}\n"
            )
            
            # Send through all notifiers
            for notifier in self.notifiers:
                notifier.send(subject, message)
            
            # Update last alert time
            self.last_alert_time[alert_key] = current_time
    
    def monitor_weather_api(self, api_url: str, location: str, api_key: str = None,
                           interval_minutes: int = 15, max_runs: Optional[int] = None) -> None:
        """Monitor weather conditions from an API and send alerts."""
        runs = 0
        
        while max_runs is None or runs < max_runs:
            try:
                # Prepare API request
                params = {"q": location}
                if api_key:
                    params["appid"] = api_key
                
                # Make API request
                response = requests.get(api_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                # Extract weather data
                weather_data = {}
                
                # Handle different API formats
                if "main" in data:
                    # OpenWeatherMap format
                    weather_data["temperature"] = data["main"].get("temp")
                    weather_data["humidity"] = data["main"].get("humidity")
                    if "wind" in data:
                        weather_data["wind_speed"] = data["wind"].get("speed")
                    if "rain" in data and "1h" in data["rain"]:
                        weather_data["precipitation"] = data["rain"]["1h"]
                elif "current" in data:
                    # WeatherAPI format
                    weather_data["temperature"] = data["current"].get("temp_c")
                    weather_data["humidity"] = data["current"].get("humidity")
                    weather_data["wind_speed"] = data["current"].get("wind_kph") / 3.6  # Convert to m/s
                    weather_data["precipitation"] = data["current"].get("precip_mm")
                
                # Check conditions and send alerts
                alerts = self.check_conditions(weather_data)
                self.send_alerts(alerts, location)
                
                # Log current conditions
                logger.info(f"Current weather for {location}: {weather_data}")
                
                runs += 1
                
                # Wait for next check
                if max_runs is None or runs < max_runs:
                    logger.info(f"Next check in {interval_minutes} minutes")
                    time.sleep(interval_minutes * 60)
            
            except Exception as e:
                logger.error(f"Error monitoring weather: {e}")
                time.sleep(60)  # Wait a minute before retrying
    
    def monitor_weather_file(self, filepath: str, location: str = "Unknown") -> None:
        """Monitor weather conditions from a JSON or CSV file and send alerts."""
        try:
            # Determine file type
            if filepath.endswith('.json'):
                with open(filepath, 'r') as file:
                    data = json.load(file)
                
                # Extract weather data
                weather_data = {}
                
                # Handle different JSON structures
                if isinstance(data, dict):
                    if "main" in data:
                        # OpenWeatherMap format
                        weather_data["temperature"] = data["main"].get("temp")
                        weather_data["humidity"] = data["main"].get("humidity")
                        if "wind" in data:
                            weather_data["wind_speed"] = data["wind"].get("speed")
                        if "rain" in data and "1h" in data["rain"]:
                            weather_data["precipitation"] = data["rain"]["1h"]
                    elif "current" in data:
                        # WeatherAPI format
                        weather_data["temperature"] = data["current"].get("temp_c")
                        weather_data["humidity"] = data["current"].get("humidity")
                        weather_data["wind_speed"] = data["current"].get("wind_kph") / 3.6  # Convert to m/s
                        weather_data["precipitation"] = data["current"].get("precip_mm")
                    else:
                        # Assume direct format
                        weather_data = {k: v for k, v in data.items() if k in self.thresholds}
            
            elif filepath.endswith('.csv'):
                import csv
                with open(filepath, 'r') as file:
                    reader = csv.DictReader(file)
                    # Use the last row of data
                    for row in reader:
                        pass
                    
                    # Extract weather data
                    weather_data = {}
                    for param in self.thresholds:
                        if param in row:
                            try:
                                weather_data[param] = float(row[param])
                            except (ValueError, TypeError):
                                pass
            
            else:
                logger.error(f"Unsupported file format: {filepath}")
                return
            
            # Check conditions and send alerts
            alerts = self.check_conditions(weather_data)
            self.send_alerts(alerts, location)
            
            # Log current conditions
            logger.info(f"Weather data from {filepath}: {weather_data}")
        
        except Exception as e:
            logger.error(f"Error processing weather file {filepath}: {e}")


def main():
    """Main function to run the script from command line."""
    parser = argparse.ArgumentParser(description="Monitor weather conditions and send alerts")
    parser.add_argument("--config", help="JSON configuration file")
    parser.add_argument("--api-url", help="Weather API URL")
    parser.add_argument("--api-key", help="API key for weather service")
    parser.add_argument("--location", default="Unknown", help="Location name")
    parser.add_argument("--file", help="JSON or CSV file with weather data")
    parser.add_argument("--interval", type=int, default=15, help="Check interval in minutes (for API monitoring)")
    parser.add_argument("--email", action="store_true", help="Enable email notifications")
    parser.add_argument("--webhook", help="Webhook URL for notifications")
    parser.add_argument("--smtp-server", default="smtp.gmail.com", help="SMTP server for email notifications")
    parser.add_argument("--smtp-port", type=int, default=587, help="SMTP port for email notifications")
    parser.add_argument("--email-user", help="Email username for authentication")
    parser.add_argument("--email-pass", help="Email password for authentication")
    parser.add_argument("--email-from", help="Sender email address")
    parser.add_argument("--email-to", help="Recipient email addresses (comma-separated)")
    
    args = parser.parse_args()
    
    # Load configuration from file if provided
    config = {}
    if args.config:
        try:
            with open(args.config, 'r') as file:
                config = json.load(file)
        except Exception as e:
            logger.error(f"Error loading configuration from {args.config}: {e}")
            sys.exit(1)
    
    # Set up thresholds
    thresholds = config.get("thresholds", DEFAULT_THRESHOLDS)
    
    # Set up notifiers
    notifiers = [ConsoleNotifier()]
    
    if args.email or config.get("email", {}).get("enabled", False):
        email_config = config.get("email", {})
        smtp_server = args.smtp_server or email_config.get("smtp_server", "smtp.gmail.com")
        smtp_port = args.smtp_port or email_config.get("smtp_port", 587)
        username = args.email_user or email_config.get("username")
        password = args.email_pass or email_config.get("password")
        sender = args.email_from or email_config.get("sender")
        recipients = args.email_to.split(",") if args.email_to else email_config.get("recipients", [])
        
        if username and password and sender and recipients:
            notifiers.append(EmailNotifier(
                smtp_server, smtp_port, username, password, sender, recipients
            ))
        else:
            logger.warning("Incomplete email configuration, email notifications disabled")
    
    if args.webhook or config.get("webhook", {}).get("url"):
        webhook_url = args.webhook or config.get("webhook", {}).get("url")
        webhook_headers = config.get("webhook", {}).get("headers")
        
        notifiers.append(WebhookNotifier(webhook_url, webhook_headers))
    
    # Create alert system
    alert_system = WeatherAlertSystem(thresholds, notifiers)
    
    # Monitor weather
    if args.file:
        alert_system.monitor_weather_file(args.file, args.location)
    elif args.api_url:
        alert_system.monitor_weather_api(
            args.api_url,
            args.location,
            args.api_key,
            args.interval
        )
    elif config.get("api", {}).get("url"):
        alert_system.monitor_weather_api(
            config["api"]["url"],
            args.location or config["api"].get("location", "Unknown"),
            config["api"].get("key"),
            config["api"].get("interval", 15)
        )
    else:
        logger.error("No weather data source specified (--file or --api-url)")
        sys.exit(1)


if __name__ == "__main__":
    main()

