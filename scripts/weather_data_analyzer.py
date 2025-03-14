#!/usr/bin/env python3
"""
Weather Data Analyzer

This script analyzes weather data from CSV files and generates statistics.
It can be used to process historical weather data and extract meaningful insights.
"""

import os
import sys
import csv
import json
import argparse
import datetime
from typing import Dict, List, Tuple, Optional, Union, Any
import statistics
import math

# Define constants
DEFAULT_INPUT_DIR = "data/weather"
DEFAULT_OUTPUT_DIR = "data/analysis"
TEMPERATURE_COLUMN = "temperature"
HUMIDITY_COLUMN = "humidity"
WIND_SPEED_COLUMN = "wind_speed"
PRECIPITATION_COLUMN = "precipitation"
DATE_COLUMN = "date"

class WeatherDataAnalyzer:
    """Class for analyzing weather data from CSV files."""
    
    def __init__(self, input_dir: str = DEFAULT_INPUT_DIR, output_dir: str = DEFAULT_OUTPUT_DIR):
        """Initialize the analyzer with input and output directories."""
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.data = []
        
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
    
    def load_data(self, filename: str) -> bool:
        """Load data from a CSV file."""
        filepath = os.path.join(self.input_dir, filename)
        try:
            with open(filepath, 'r') as file:
                reader = csv.DictReader(file)
                self.data = list(reader)
            return True
        except Exception as e:
            print(f"Error loading data from {filepath}: {e}")
            return False
    
    def calculate_statistics(self) -> Dict[str, Dict[str, float]]:
        """Calculate basic statistics for numerical columns."""
        if not self.data:
            return {}
        
        # Identify numerical columns
        numerical_columns = [
            TEMPERATURE_COLUMN,
            HUMIDITY_COLUMN,
            WIND_SPEED_COLUMN,
            PRECIPITATION_COLUMN
        ]
        
        stats = {}
        for column in numerical_columns:
            if column in self.data[0]:
                values = [float(row[column]) for row in self.data if row[column]]
                if values:
                    stats[column] = {
                        "min": min(values),
                        "max": max(values),
                        "mean": statistics.mean(values),
                        "median": statistics.median(values),
                        "std_dev": statistics.stdev(values) if len(values) > 1 else 0
                    }
        
        return stats
    
    def find_extreme_weather_days(self) -> Dict[str, List[Dict[str, Any]]]:
        """Find days with extreme weather conditions."""
        if not self.data or DATE_COLUMN not in self.data[0]:
            return {}
        
        # Calculate statistics to determine thresholds
        stats = self.calculate_statistics()
        
        extreme_days = {
            "hottest_days": [],
            "coldest_days": [],
            "windiest_days": [],
            "most_humid_days": [],
            "rainiest_days": []
        }
        
        # Find extreme days
        if TEMPERATURE_COLUMN in stats:
            temp_threshold_high = stats[TEMPERATURE_COLUMN]["mean"] + stats[TEMPERATURE_COLUMN]["std_dev"]
            temp_threshold_low = stats[TEMPERATURE_COLUMN]["mean"] - stats[TEMPERATURE_COLUMN]["std_dev"]
            
            extreme_days["hottest_days"] = [
                {DATE_COLUMN: row[DATE_COLUMN], TEMPERATURE_COLUMN: float(row[TEMPERATURE_COLUMN])}
                for row in self.data
                if float(row[TEMPERATURE_COLUMN]) > temp_threshold_high
            ]
            
            extreme_days["coldest_days"] = [
                {DATE_COLUMN: row[DATE_COLUMN], TEMPERATURE_COLUMN: float(row[TEMPERATURE_COLUMN])}
                for row in self.data
                if float(row[TEMPERATURE_COLUMN]) < temp_threshold_low
            ]
        
        if WIND_SPEED_COLUMN in stats:
            wind_threshold = stats[WIND_SPEED_COLUMN]["mean"] + stats[WIND_SPEED_COLUMN]["std_dev"]
            extreme_days["windiest_days"] = [
                {DATE_COLUMN: row[DATE_COLUMN], WIND_SPEED_COLUMN: float(row[WIND_SPEED_COLUMN])}
                for row in self.data
                if float(row[WIND_SPEED_COLUMN]) > wind_threshold
            ]
        
        if HUMIDITY_COLUMN in stats:
            humidity_threshold = stats[HUMIDITY_COLUMN]["mean"] + stats[HUMIDITY_COLUMN]["std_dev"]
            extreme_days["most_humid_days"] = [
                {DATE_COLUMN: row[DATE_COLUMN], HUMIDITY_COLUMN: float(row[HUMIDITY_COLUMN])}
                for row in self.data
                if float(row[HUMIDITY_COLUMN]) > humidity_threshold
            ]
        
        if PRECIPITATION_COLUMN in stats:
            rain_threshold = stats[PRECIPITATION_COLUMN]["mean"] + stats[PRECIPITATION_COLUMN]["std_dev"]
            extreme_days["rainiest_days"] = [
                {DATE_COLUMN: row[DATE_COLUMN], PRECIPITATION_COLUMN: float(row[PRECIPITATION_COLUMN])}
                for row in self.data
                if float(row[PRECIPITATION_COLUMN]) > rain_threshold
            ]
        
        return extreme_days
    
    def save_results(self, data: Dict[str, Any], filename: str) -> bool:
        """Save analysis results to a JSON file."""
        filepath = os.path.join(self.output_dir, filename)
        try:
            with open(filepath, 'w') as file:
                json.dump(data, file, indent=2)
            return True
        except Exception as e:
            print(f"Error saving results to {filepath}: {e}")
            return False
    
    def analyze_and_save(self, input_filename: str, output_filename: str) -> bool:
        """Load data, analyze it, and save the results."""
        if not self.load_data(input_filename):
            return False
        
        # Perform analysis
        stats = self.calculate_statistics()
        extreme_days = self.find_extreme_weather_days()
        
        # Combine results
        results = {
            "statistics": stats,
            "extreme_weather": extreme_days,
            "analysis_date": datetime.datetime.now().isoformat(),
            "source_file": input_filename,
            "record_count": len(self.data)
        }
        
        # Save results
        return self.save_results(results, output_filename)


def main():
    """Main function to run the script from command line."""
    parser = argparse.ArgumentParser(description="Analyze weather data from CSV files")
    parser.add_argument("input_file", help="Input CSV file with weather data")
    parser.add_argument("--output", help="Output JSON file for analysis results", default="weather_analysis.json")
    parser.add_argument("--input-dir", help="Directory containing input files", default=DEFAULT_INPUT_DIR)
    parser.add_argument("--output-dir", help="Directory for output files", default=DEFAULT_OUTPUT_DIR)
    
    args = parser.parse_args()
    
    analyzer = WeatherDataAnalyzer(args.input_dir, args.output_dir)
    success = analyzer.analyze_and_save(args.input_file, args.output)
    
    if success:
        print(f"Analysis completed successfully. Results saved to {os.path.join(args.output_dir, args.output)}")
    else:
        print("Analysis failed. Check error messages above.")
        sys.exit(1)


if __name__ == "__main__":
    main()

