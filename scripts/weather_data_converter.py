#!/usr/bin/env python3
"""
Weather Data Converter

This script converts weather data between different formats and units.
It supports various input and output formats, including CSV, JSON, and XML.
"""

import os
import sys
import json
import csv
import xml.etree.ElementTree as ET
import xml.dom.minidom
import argparse
from typing import Dict, List, Any, Optional, Union
from datetime import datetime

# Define constants
DEFAULT_INPUT_DIR = "data/weather/input"
DEFAULT_OUTPUT_DIR = "data/weather/output"

# Unit conversion factors
TEMPERATURE_CONVERSIONS = {
    "C_to_F": lambda c: c * 9/5 + 32,
    "F_to_C": lambda f: (f - 32) * 5/9,
    "C_to_K": lambda c: c + 273.15,
    "K_to_C": lambda k: k - 273.15,
    "F_to_K": lambda f: (f - 32) * 5/9 + 273.15,
    "K_to_F": lambda k: (k - 273.15) * 9/5 + 32
}

WIND_SPEED_CONVERSIONS = {
    "mps_to_mph": lambda mps: mps * 2.23694,
    "mph_to_mps": lambda mph: mph / 2.23694,
    "mps_to_kph": lambda mps: mps * 3.6,
    "kph_to_mps": lambda kph: kph / 3.6,
    "mph_to_kph": lambda mph: mph * 1.60934,
    "kph_to_mph": lambda kph: kph / 1.60934
}

PRECIPITATION_CONVERSIONS = {
    "mm_to_in": lambda mm: mm / 25.4,
    "in_to_mm": lambda inches: inches * 25.4
}

PRESSURE_CONVERSIONS = {
    "hPa_to_inHg": lambda hpa: hpa * 0.02953,
    "inHg_to_hPa": lambda inhg: inhg / 0.02953,
    "hPa_to_mb": lambda hpa: hpa,  # They are the same
    "mb_to_hPa": lambda mb: mb     # They are the same
}

class WeatherDataConverter:
    """Class for converting weather data between different formats and units."""
    
    def __init__(self, input_dir: str = DEFAULT_INPUT_DIR, output_dir: str = DEFAULT_OUTPUT_DIR):
        """Initialize the converter with input and output directories."""
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.data = []
        
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
    
    def load_csv(self, filename: str) -> bool:
        """Load data from a CSV file."""
        filepath = os.path.join(self.input_dir, filename)
        try:
            with open(filepath, 'r') as file:
                reader = csv.DictReader(file)
                self.data = list(reader)
            return True
        except Exception as e:
            print(f"Error loading CSV from {filepath}: {e}")
            return False
    
    def load_json(self, filename: str) -> bool:
        """Load data from a JSON file."""
        filepath = os.path.join(self.input_dir, filename)
        try:
            with open(filepath, 'r') as file:
                data = json.load(file)
                
                # Handle different JSON structures
                if isinstance(data, list):
                    self.data = data
                elif isinstance(data, dict):
                    if "list" in data:
                        # OpenWeatherMap forecast format
                        self.data = []
                        for item in data["list"]:
                            entry = {
                                "date": datetime.fromtimestamp(item["dt"]).strftime("%Y-%m-%d %H:%M:%S"),
                                "temperature": item["main"]["temp"],
                                "humidity": item["main"]["humidity"],
                                "pressure": item["main"]["pressure"]
                            }
                            if "wind" in item:
                                entry["wind_speed"] = item["wind"]["speed"]
                            if "rain" in item and "3h" in item["rain"]:
                                entry["precipitation"] = item["rain"]["3h"]
                            self.data.append(entry)
                    elif "daily" in data:
                        # OpenWeatherMap One Call API format
                        self.data = []
                        for item in data["daily"]:
                            entry = {
                                "date": datetime.fromtimestamp(item["dt"]).strftime("%Y-%m-%d"),
                                "temperature": item["temp"]["day"],
                                "humidity": item["humidity"],
                                "pressure": item["pressure"],
                                "wind_speed": item["wind_speed"]
                            }
                            if "rain" in item:
                                entry["precipitation"] = item["rain"]
                            self.data.append(entry)
                    else:
                        # Single weather entry
                        self.data = [data]
            return True
        except Exception as e:
            print(f"Error loading JSON from {filepath}: {e}")
            return False
    
    def load_xml(self, filename: str) -> bool:
        """Load data from an XML file."""
        filepath = os.path.join(self.input_dir, filename)
        try:
            tree = ET.parse(filepath)
            root = tree.getroot()
            
            self.data = []
            
            # Handle different XML structures
            if root.tag == "weatherdata":
                # Generic weather data format
                for item in root.findall("item"):
                    entry = {}
                    for child in item:
                        entry[child.tag] = child.text
                    self.data.append(entry)
            elif root.tag == "current":
                # OpenWeatherMap current weather XML format
                entry = {}
                
                if root.find("city") is not None:
                    entry["location"] = root.find("city").get("name")
                
                if root.find("temperature") is not None:
                    entry["temperature"] = float(root.find("temperature").get("value"))
                
                if root.find("humidity") is not None:
                    entry["humidity"] = float(root.find("humidity").get("value"))
                
                if root.find("pressure") is not None:
                    entry["pressure"] = float(root.find("pressure").get("value"))
                
                if root.find("wind/speed") is not None:
                    entry["wind_speed"] = float(root.find("wind/speed").get("value"))
                
                if root.find("precipitation") is not None:
                    entry["precipitation"] = float(root.find("precipitation").get("value", 0))
                
                self.data.append(entry)
            else:
                # Try to extract data from any XML structure
                for item in root.findall(".//*"):
                    if item.attrib:
                        entry = {}
                        for key, value in item.attrib.items():
                            entry[key] = value
                        self.data.append(entry)
            
            return True
        except Exception as e:
            print(f"Error loading XML from {filepath}: {e}")
            return False
    
    def convert_units(self, conversions: Dict[str, str]) -> None:
        """Convert units in the data based on specified conversions."""
        if not self.data:
            print("No data to convert")
            return
        
        for entry in self.data:
            # Convert temperature
            if "temperature" in entry and "temperature" in conversions:
                conversion = conversions["temperature"]
                if conversion in TEMPERATURE_CONVERSIONS:
                    try:
                        entry["temperature"] = TEMPERATURE_CONVERSIONS[conversion](float(entry["temperature"]))
                    except (ValueError, TypeError) as e:
                        print(f"Error converting temperature: {e}")
            
            # Convert wind speed
            if "wind_speed" in entry and "wind_speed" in conversions:
                conversion = conversions["wind_speed"]
                if conversion in WIND_SPEED_CONVERSIONS:
                    try:
                        entry["wind_speed"] = WIND_SPEED_CONVERSIONS[conversion](float(entry["wind_speed"]))
                    except (ValueError, TypeError) as e:
                        print(f"Error converting wind speed: {e}")
            
            # Convert precipitation
            if "precipitation" in entry and "precipitation" in conversions:
                conversion = conversions["precipitation"]
                if conversion in PRECIPITATION_CONVERSIONS:
                    try:
                        entry["precipitation"] = PRECIPITATION_CONVERSIONS[conversion](float(entry["precipitation"]))
                    except (ValueError, TypeError) as e:
                        print(f"Error converting precipitation: {e}")
            
            # Convert pressure
            if "pressure" in entry and "pressure" in conversions:
                conversion = conversions["pressure"]
                if conversion in PRESSURE_CONVERSIONS:
                    try:
                        entry["pressure"] = PRESSURE_CONVERSIONS[conversion](float(entry["pressure"]))
                    except (ValueError, TypeError) as e:
                        print(f"Error converting pressure: {e}")
    
    def save_csv(self, filename: str) -> bool:
        """Save data to a CSV file."""
        if not self.data:
            print("No data to save")
            return False
        
        filepath = os.path.join(self.output_dir, filename)
        try:
            # Get all possible field names from all entries
            fieldnames = set()
            for entry in self.data:
                fieldnames.update(entry.keys())
            
            with open(filepath, 'w', newline='') as file:
                writer = csv.DictWriter(file, fieldnames=sorted(fieldnames))
                writer.writeheader()
                writer.writerows(self.data)
            
            print(f"Data saved to CSV: {filepath}")
            return True
        except Exception as e:
            print(f"Error saving CSV to {filepath}: {e}")
            return False
    
    def save_json(self, filename: str) -> bool:
        """Save data to a JSON file."""
        if not self.data:
            print("No data to save")
            return False
        
        filepath = os.path.join(self.output_dir, filename)
        try:
            with open(filepath, 'w') as file:
                json.dump(self.data, file, indent=2)
            
            print(f"Data saved to JSON: {filepath}")
            return True
        except Exception as e:
            print(f"Error saving JSON to {filepath}: {e}")
            return False
    
    def save_xml(self, filename: str) -> bool:
        """Save data to an XML file."""
        if not self.data:
            print("No data to save")
            return False
        
        filepath = os.path.join(self.output_dir, filename)
        try:
            root = ET.Element("weatherdata")
            
            for entry in self.data:
                item = ET.SubElement(root, "item")
                for key, value in entry.items():
                    child = ET.SubElement(item, key)
                    child.text = str(value)
            
            # Pretty print XML
            rough_string = ET.tostring(root, 'utf-8')
            reparsed = xml.dom.minidom.parseString(rough_string)
            pretty_xml = reparsed.toprettyxml(indent="  ")
            
            with open(filepath, 'w') as file:
                file.write(pretty_xml)
            
            print(f"Data saved to XML: {filepath}")
            return True
        except Exception as e:
            print(f"Error saving XML to {filepath}: {e}")
            return False


def main():
    """Main function to run the script from command line."""
    parser = argparse.ArgumentParser(description="Convert weather data between different formats and units")
    parser.add_argument("input_file", help="Input file with weather data")
    parser.add_argument("output_file", help="Output file for converted data")
    parser.add_argument("--input-format", choices=["csv", "json", "xml"], help="Input file format (default: auto-detect from extension)")
    parser.add_argument("--output-format", choices=["csv", "json", "xml"], help="Output file format (default: auto-detect from extension)")
    parser.add_argument("--input-dir", default=DEFAULT_INPUT_DIR, help="Directory containing input files")
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR, help="Directory for output files")
    parser.add_argument("--temp-convert", choices=list(TEMPERATURE_CONVERSIONS.keys()), help="Temperature unit conversion")
    parser.add_argument("--wind-convert", choices=list(WIND_SPEED_CONVERSIONS.keys()), help="Wind speed unit conversion")
    parser.add_argument("--precip-convert", choices=list(PRECIPITATION_CONVERSIONS.keys()), help="Precipitation unit conversion")
    parser.add_argument("--pressure-convert", choices=list(PRESSURE_CONVERSIONS.keys()), help="Pressure unit conversion")
    
    args = parser.parse_args()
    
    converter = WeatherDataConverter(args.input_dir, args.output_dir)
    
    # Determine input format
    input_format = args.input_format
    if not input_format:
        if args.input_file.endswith('.csv'):
            input_format = 'csv'
        elif args.input_file.endswith('.json'):
            input_format = 'json'
        elif args.input_file.endswith('.xml'):
            input_format = 'xml'
        else:
            print(f"Cannot determine input format for {args.input_file}")
            sys.exit(1)
    
    # Load data
    if input_format == 'csv':
        if not converter.load_csv(args.input_file):
            sys.exit(1)
    elif input_format == 'json':
        if not converter.load_json(args.input_file):
            sys.exit(1)
    elif input_format == 'xml':
        if not converter.load_xml(args.input_file):
            sys.exit(1)
    
    # Convert units if specified
    conversions = {}
    if args.temp_convert:
        conversions["temperature"] = args.temp_convert
    if args.wind_convert:
        conversions["wind_speed"] = args.wind_convert
    if args.precip_convert:
        conversions["precipitation"] = args.precip_convert
    if args.pressure_convert:
        conversions["pressure"] = args.pressure_convert
    
    if conversions:
        converter.convert_units(conversions)
    
    # Determine output format
    output_format = args.output_format
    if not output_format:
        if args.output_file.endswith('.csv'):
            output_format = 'csv'
        elif args.output_file.endswith('.json'):
            output_format = 'json'
        elif args.output_file.endswith('.xml'):
            output_format = 'xml'
        else:
            print(f"Cannot determine output format for {args.output_file}")
            sys.exit(1)
    
    # Save data
    if output_format == 'csv':
        if not converter.save_csv(args.output_file):
            sys.exit(1)
    elif output_format == 'json':
        if not converter.save_json(args.output_file):
            sys.exit(1)
    elif output_format == 'xml':
        if not converter.save_xml(args.output_file):
            sys.exit(1)


if __name__ == "__main__":
    main()

