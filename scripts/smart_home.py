#!/usr/bin/env python3

import time
from typing import Dict, List

class SmartDevice:
    def __init__(self, device_id: str, name: str, type: str):
        self.device_id = device_id
        self.name = name
        self.type = type
        self.state = "off"
        self.brightness = 0 if type == "light" else None
        self.temperature = 20 if type == "thermostat" else None

    def turn_on(self):
        self.state = "on"
        if self.type == "light":
            self.brightness = 100
        print(f"{self.name} turned on")

    def turn_off(self):
        self.state = "off"
        if self.type == "light":
            self.brightness = 0
        print(f"{self.name} turned off")

    def set_brightness(self, level: int):
        if self.type != "light":
            raise ValueError("Device is not a light")
        self.brightness = max(0, min(100, level))
        print(f"{self.name} brightness set to {self.brightness}%")

    def set_temperature(self, temp: float):
        if self.type != "thermostat":
            raise ValueError("Device is not a thermostat")
        self.temperature = temp
        print(f"{self.name} temperature set to {temp}°C")

def main():
    # Create some demo devices
    devices = [
        SmartDevice("light1", "Living Room Light", "light"),
        SmartDevice("light2", "Kitchen Light", "light"),
        SmartDevice("therm1", "Living Room Thermostat", "thermostat")
    ]

    # Demo sequence
    print("Smart Home Demo Starting...")
    time.sleep(1)

    print("\nTurning on lights...")
    for device in devices:
        if device.type == "light":
            device.turn_on()
            time.sleep(1)

    print("\nAdjusting brightness...")
    devices[0].set_brightness(50)  # Dim living room light
    time.sleep(1)

    print("\nSetting temperature...")
    devices[2].set_temperature(22.5)  # Adjust thermostat
    time.sleep(1)

    print("\nTurning off lights...")
    for device in devices:
        if device.type == "light":
            device.turn_off()
            time.sleep(1)

    print("\nDemo completed!")

if __name__ == "__main__":
    main()