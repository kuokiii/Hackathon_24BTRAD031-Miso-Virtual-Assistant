#!/usr/bin/env python3
"""
Weather Data Visualizer

This script creates visualizations from weather data.
It supports various chart types and can output to different file formats.
"""

import os
import sys
import json
import csv
import argparse
from typing import Dict, List, Any, Optional, Tuple
import datetime
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.figure import Figure
import numpy as np

# Define constants
DEFAULT_INPUT_DIR = "data/weather"
DEFAULT_OUTPUT_DIR = "visualizations"
TEMPERATURE_COLUMN = "temperature"
HUMIDITY_COLUMN = "humidity"
WIND_SPEED_COLUMN = "wind_speed"
PRECIPITATION_COLUMN = "precipitation"
DATE_COLUMN = "date"

class WeatherDataVisualizer:
    """Class for creating visualizations from weather data."""
    
    def __init__(self, input_dir: str = DEFAULT_INPUT_DIR, output_dir: str = DEFAULT_OUTPUT_DIR):
        """Initialize the visualizer with input and output directories."""
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.data = []
        
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Set default plot style
        plt.style.use('seaborn-v0_8-whitegrid')
    
    def load_data_from_csv(self, filename: str) -> bool:
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
    
    def load_data_from_json(self, filename: str) -> bool:
        """Load data from a JSON file."""
        filepath = os.path.join(self.input_dir, filename)
        try:
            with open(filepath, 'r') as file:
                data = json.load(file)
                
                # Handle different JSON structures
                if isinstance(data, list):
                    self.data = data
                elif isinstance(data, dict) and "list" in data:
                    self.data = data["list"]
                elif isinstance(data, dict) and "daily" in data:
                    self.data = data["daily"]
                else:
                    print(f"Unsupported JSON structure in {filepath}")
                    return False
            return True
        except Exception as e:
            print(f"Error loading data from {filepath}: {e}")
            return False
    
    def _prepare_time_series_data(self, date_column: str, value_column: str) -> Tuple[List[datetime.datetime], List[float]]:
        """Prepare data for time series visualization."""
        dates = []
        values = []
        
        for row in self.data:
            # Skip rows with missing data
            if date_column not in row or value_column not in row or not row[date_column] or not row[value_column]:
                continue
            
            # Parse date
            try:
                if isinstance(row[date_column], str):
                    # Try different date formats
                    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%m/%d/%Y"):
                        try:
                            date = datetime.datetime.strptime(row[date_column], fmt)
                            break
                        except ValueError:
                            continue
                    else:
                        # If no format worked, skip this row
                        continue
                elif isinstance(row[date_column], int):
                    # Assume Unix timestamp
                    date = datetime.datetime.fromtimestamp(row[date_column])
                else:
                    continue
                
                # Parse value
                value = float(row[value_column])
                
                dates.append(date)
                values.append(value)
            except (ValueError, TypeError) as e:
                print(f"Error parsing data: {e}")
                continue
        
        return dates, values
    
    def create_temperature_chart(self, date_column: str = DATE_COLUMN, temp_column: str = TEMPERATURE_COLUMN) -> Figure:
        """Create a temperature chart."""
        dates, temperatures = self._prepare_time_series_data(date_column, temp_column)
        
        if not dates or not temperatures:
            raise ValueError("No valid temperature data found")
        
        fig, ax = plt.subplots(figsize=(12, 6))
        ax.plot(dates, temperatures, 'r-', linewidth=2, label='Temperature')
        
        # Format the chart
        ax.set_title('Temperature Over Time', fontsize=16)
        ax.set_xlabel('Date', fontsize=12)
        ax.set_ylabel('Temperature (°C)', fontsize=12)
        ax.grid(True, linestyle='--', alpha=0.7)
        ax.legend()
        
        # Format x-axis dates
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        ax.xaxis.set_major_locator(mdates.AutoDateLocator())
        fig.autofmt_xdate()
        
        return fig
    
    def create_humidity_chart(self, date_column: str = DATE_COLUMN, humidity_column: str = HUMIDITY_COLUMN) -> Figure:
        """Create a humidity chart."""
        dates, humidity_values = self._prepare_time_series_data(date_column, humidity_column)
        
        if not dates or not humidity_values:
            raise ValueError("No valid humidity data found")
        
        fig, ax = plt.subplots(figsize=(12, 6))
        ax.plot(dates, humidity_values, 'b-', linewidth=2, label='Humidity')
        
        # Format the chart
        ax.set_title('Humidity Over Time', fontsize=16)
        ax.set_xlabel('Date', fontsize=12)
        ax.set_ylabel('Humidity (%)', fontsize=12)
        ax.grid(True, linestyle='--', alpha=0.7)
        ax.legend()
        
        # Format x-axis dates
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        ax.xaxis.set_major_locator(mdates.AutoDateLocator())
        fig.autofmt_xdate()
        
        return fig
    
    def create_weather_overview(self, date_column: str = DATE_COLUMN) -> Figure:
        """Create a comprehensive weather overview chart."""
        # Prepare data for all weather parameters
        dates_temp, temperatures = self._prepare_time_series_data(date_column, TEMPERATURE_COLUMN)
        dates_humidity, humidity_values = self._prepare_time_series_data(date_column, HUMIDITY_COLUMN)
        dates_wind, wind_values = self._prepare_time_series_data(date_column, WIND_SPEED_COLUMN)
        dates_precip, precip_values = self._prepare_time_series_data(date_column, PRECIPITATION_COLUMN)
        
        # Check if we have at least some data
        if not (dates_temp or dates_humidity or dates_wind or dates_precip):
            raise ValueError("No valid weather data found")
        
        # Create subplots
        fig, axs = plt.subplots(4, 1, figsize=(12, 16), sharex=True)
        
        # Plot temperature
        if dates_temp and temperatures:
            axs[0].plot(dates_temp, temperatures, 'r-', linewidth=2)
            axs[0].set_title('Temperature (°C)', fontsize=14)
            axs[0].grid(True, linestyle='--', alpha=0.7)
        else:
            axs[0].text(0.5, 0.5, 'No temperature data available', 
                        horizontalalignment='center', verticalalignment='center',
                        transform=axs[0].transAxes)
        
        # Plot humidity
        if dates_humidity and humidity_values:
            axs[1].plot(dates_humidity, humidity_values, 'b-', linewidth=2)
            axs[1].set_title('Humidity (%)', fontsize=14)
            axs[1].grid(True, linestyle='--', alpha=0.7)
        else:
            axs[1].text(0.5, 0.5, 'No humidity data available', 
                        horizontalalignment='center', verticalalignment='center',
                        transform=axs[1].transAxes)
        
        # Plot wind speed
        if dates_wind and wind_values:
            axs[2].plot(dates_wind, wind_values, 'g-', linewidth=2)
            axs[2].set_title('Wind Speed (m/s)', fontsize=14)
            axs[2].grid(True, linestyle='--', alpha=0.7)
        else:
            axs[2].text(0.5, 0.5, 'No wind speed data available', 
                        horizontalalignment='center', verticalalignment='center',
                        transform=axs[2].transAxes)
        
        # Plot precipitation
        if dates_precip and precip_values:
            axs[3].bar(dates_precip, precip_values, color='skyblue', width=0.5)
            axs[3].set_title('Precipitation (mm)', fontsize=14)
            axs[3].grid(True, linestyle='--', alpha=0.7)
        else:
            axs[3].text(0.5, 0.5, 'No precipitation data available', 
                        horizontalalignment='center', verticalalignment='center',
                        transform=axs[3].transAxes)
        
        # Format x-axis dates on the bottom subplot
        if any([dates_temp, dates_humidity, dates_wind, dates_precip]):
            axs[3].xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
            axs[3].xaxis.set_major_locator(mdates.AutoDateLocator())
            fig.autofmt_xdate()
        
        # Add overall title
        fig.suptitle('Weather Overview', fontsize=18)
        plt.tight_layout(rect=[0, 0, 1, 0.97])
        
        return fig
    
    def save_chart(self, fig: Figure, filename: str) -> bool:
        """Save a chart to a file."""
        filepath = os.path.join(self.output_dir, filename)
        try:
            fig.savefig(filepath, dpi=300, bbox_inches='tight')
            plt.close(fig)
            print(f"Chart saved to {filepath}")
            return True
        except Exception as e:
            print(f"Error saving chart to {filepath}: {e}")
            return False


def main():
    """Main function to run the script from command line."""
    parser = argparse.ArgumentParser(description="Create visualizations from weather data")
    parser.add_argument("input_file", help="Input file with weather data (CSV or JSON)")
    parser.add_argument("--type", choices=["temperature", "humidity", "overview"], default="overview",
                        help="Type of chart to create")
    parser.add_argument("--output", help="Output file for the chart", default="weather_chart.png")
    parser.add_argument("--input-dir", help="Directory containing input files", default=DEFAULT_INPUT_DIR)
    parser.add_argument("--output-dir", help="Directory for output files", default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--date-column", help="Column name for date values", default=DATE_COLUMN)
    parser.add_argument("--temp-column", help="Column name for temperature values", default=TEMPERATURE_COLUMN)
    parser.add_argument("--humidity-column", help="Column name for humidity values", default=HUMIDITY_COLUMN)
    
    args = parser.parse_args()
    
    visualizer = WeatherDataVisualizer(args.input_dir, args.output_dir)
    
    # Load data based on file extension
    if args.input_file.endswith('.csv'):
        success = visualizer.load_data_from_csv(args.input_file)
    elif args.input_file.endswith('.json'):
        success = visualizer.load_data_from_json(args.input_file)
    else:
        print(f"Unsupported file format: {args.input_file}")
        sys.exit(1)
    
    if not success:
        sys.exit(1)
    
    try:
        # Create chart based on type
        if args.type == "temperature":
            fig = visualizer.create_temperature_chart(args.date_column, args.temp_column)
        elif args.type == "humidity":
            fig = visualizer.create_humidity_chart(args.date_column, args.humidity_column)
        else:  # overview
            fig = visualizer.create_weather_overview(args.date_column)
        
        # Save chart
        success = visualizer.save_chart(fig, args.output)
        if not success:
            sys.exit(1)
    
    except Exception as e:
        print(f"Error creating chart: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

