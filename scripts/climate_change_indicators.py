#!/usr/bin/env python3
"""
Climate Change Indicators

This script calculates various climate change indicators from weather data.
It can identify long-term trends, changes in extreme events, and other climate change signals.
"""

import os
import sys
import json
import csv
import argparse
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import matplotlib.pyplot as plt
from scipy import stats

# Define constants
DEFAULT_DATA_DIR = "data/climate"
DEFAULT_OUTPUT_DIR = "reports/climate"

class ClimateChangeIndicators:
    """Class for calculating climate change indicators from weather data."""
    
    def __init__(self, data_dir: str = DEFAULT_DATA_DIR, output_dir: str = DEFAULT_OUTPUT_DIR):
        """Initialize the analyzer with data and output directories."""
        self.data_dir = data_dir
        self.output_dir = output_dir
        self.data = None
        
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
    
    def load_data(self, filename: str) -> bool:
        """Load data from a CSV file into a pandas DataFrame."""
        filepath = os.path.join(self.data_dir, filename)
        try:
            self.data = pd.read_csv(filepath)
            
            # Convert date column to datetime
            date_columns = [col for col in self.data.columns if 'date' in col.lower() or 'time' in col.lower()]
            if date_columns:
                for col in date_columns:
                    self.data[col] = pd.to_datetime(self.data[col], errors='coerce')
                    self.data = self.data.dropna(subset=[col])
                
                # Use the first date column as the primary date column
                self.date_column = date_columns[0]
                
                # Extract date components
                self.data['year'] = self.data[self.date_column].dt.year
                self.data['month'] = self.data[self.date_column].dt.month
                self.data['day'] = self.data[self.date_column].dt.day
                self.data['season'] = self.data[self.date_column].dt.month.apply(self._get_season)
            else:
                print("Warning: No date column found in the data")
                return False
            
            return True
        except Exception as e:
            print(f"Error loading data from {filepath}: {e}")
            return False
    
    def _get_season(self, month: int) -> str:
        """Convert month to season."""
        if month in [12, 1, 2]:
            return "Winter"
        elif month in [3, 4, 5]:
            return "Spring"
        elif month in [6, 7, 8]:
            return "Summer"
        else:  # month in [9, 10, 11]
            return "Fall"
    
    def calculate_temperature_trend(self, column: str = "temperature") -> Dict[str, Any]:
        """Calculate long-term temperature trend."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        # Calculate yearly averages
        yearly_avg = self.data.groupby('year')[column].mean().reset_index()
        
        # Calculate linear trend
        slope, intercept, r_value, p_value, std_err = stats.linregress(
            yearly_avg['year'], yearly_avg[column]
        )
        
        # Calculate warming rate per decade
        warming_rate = slope * 10  # °C per decade
        
        # Calculate total warming over the period
        total_years = yearly_avg['year'].max() - yearly_avg['year'].min()
        total_warming = slope * total_years
        
        # Calculate statistical significance
        significant = p_value < 0.05
        
        return {
            "indicator": "temperature_trend",
            "column": column,
            "period": {
                "start_year": int(yearly_avg['year'].min()),
                "end_year": int(yearly_avg['year'].max()),
                "total_years": int(total_years)
            },
            "trend": {
                "slope": float(slope),  # °C per year
                "warming_rate": float(warming_rate),  # °C per decade
                "total_warming": float(total_warming),  # °C over the period
                "r_squared": float(r_value**2),
                "p_value": float(p_value),
                "significant": significant
            },
            "yearly_data": yearly_avg.to_dict(orient='records')
        }
    
    def calculate_extreme_temperature_days(self, column: str = "temperature", 
                                          hot_threshold: Optional[float] = None,
                                          cold_threshold: Optional[float] = None) -> Dict[str, Any]:
        """Calculate trends in extreme temperature days."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        # Set thresholds if not provided
        if hot_threshold is None:
            hot_threshold = np.percentile(self.data[column], 90)  # 90th percentile
        
        if cold_threshold is None:
            cold_threshold = np.percentile(self.data[column], 10)  # 10th percentile
        
        # Count extreme days by year
        hot_days = self.data[self.data[column] >= hot_threshold].groupby('year').size().reset_index(name='hot_days')
        cold_days = self.data[self.data[column] <= cold_threshold].groupby('year').size().reset_index(name='cold_days')
        
        # Merge hot and cold days
        extreme_days = pd.merge(hot_days, cold_days, on='year', how='outer').fillna(0)
        
        # Calculate trends
        hot_trend = stats.linregress(extreme_days['year'], extreme_days['hot_days'])
        cold_trend = stats.linregress(extreme_days['year'], extreme_days['cold_days'])
        
        return {
            "indicator": "extreme_temperature_days",
            "column": column,
            "thresholds": {
                "hot_threshold": float(hot_threshold),
                "cold_threshold": float(cold_threshold)
            },
            "period": {
                "start_year": int(extreme_days['year'].min()),
                "end_year": int(extreme_days['year'].max()),
                "total_years": int(extreme_days['year'].max() - extreme_days['year'].min())
            },
            "hot_days_trend": {
                "slope": float(hot_trend.slope),  # Days per year
                "total_change": float(hot_trend.slope * (extreme_days['year'].max() - extreme_days['year'].min())),
                "r_squared": float(hot_trend.rvalue**2),
                "p_value": float(hot_trend.pvalue),
                "significant": hot_trend.pvalue < 0.05
            },
            "cold_days_trend": {
                "slope": float(cold_trend.slope),  # Days per year
                "total_change": float(cold_trend.slope * (extreme_days['year'].max() - extreme_days['year'].min())),
                "r_squared": float(cold_trend.rvalue**2),
                "p_value": float(cold_trend.pvalue),
                "significant": cold_trend.pvalue < 0.05
            },
            "yearly_data": extreme_days.to_dict(orient='records')
        }
    
    def calculate_precipitation_intensity(self, column: str = "precipitation") -> Dict[str, Any]:
        """Calculate trends in precipitation intensity."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        # Filter out days with no precipitation
        rainy_days = self.data[self.data[column] > 0]
        
        # Calculate yearly statistics
        yearly_stats = rainy_days.groupby('year').agg({
            column: ['mean', 'max', 'count'],
            self.date_column: 'count'
        }).reset_index()
        
        # Rename columns
        yearly_stats.columns = ['year', 'avg_intensity', 'max_intensity', 'rainy_days', 'total_days']
        
        # Calculate percentage of rainy days
        yearly_stats['rainy_days_percent'] = (yearly_stats['rainy_days'] / yearly_stats['total_days']) * 100
        
        # Calculate trends
        avg_intensity_trend = stats.linregress(yearly_stats['year'], yearly_stats['avg_intensity'])
        max_intensity_trend = stats.linregress(yearly_stats['year'], yearly_stats['max_intensity'])
        rainy_days_trend = stats.linregress(yearly_stats['year'], yearly_stats['rainy_days_percent'])
        
        return {
            "indicator": "precipitation_intensity",
            "column": column,
            "period": {
                "start_year": int(yearly_stats['year'].min()),
                "end_year": int(yearly_stats['year'].max()),
                "total_years": int(yearly_stats['year'].max() - yearly_stats['year'].min())
            },
            "avg_intensity_trend": {
                "slope": float(avg_intensity_trend.slope),  # mm per year
                "total_change": float(avg_intensity_trend.slope * (yearly_stats['year'].max() - yearly_stats['year'].min())),
                "r_squared": float(avg_intensity_trend.rvalue**2),
                "p_value": float(avg_intensity_trend.pvalue),
                "significant": avg_intensity_trend.pvalue < 0.05
            },
            "max_intensity_trend": {
                "slope": float(max_intensity_trend.slope),  # mm per year
                "total_change": float(max_intensity_trend.slope * (yearly_stats['year'].max() - yearly_stats['year'].min())),
                "r_squared": float(max_intensity_trend.rvalue**2),
                "p_value": float(max_intensity_trend.pvalue),
                "significant": max_intensity_trend.pvalue < 0.05
            },
            "rainy_days_trend": {
                "slope": float(rainy_days_trend.slope),  # Percentage points per year
                "total_change": float(rainy_days_trend.slope * (yearly_stats['year'].max() - yearly_stats['year'].min())),
                "r_squared": float(rainy_days_trend.rvalue**2),
                "p_value": float(rainy_days_trend.pvalue),
                "significant": rainy_days_trend.pvalue < 0.05
            },
            "yearly_data": yearly_stats.to_dict(orient='records')
        }
    
    def calculate_growing_season_length(self, column: str = "temperature", threshold: float = 5.0) -> Dict[str, Any]:
        """Calculate trends in growing season length."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        # Ensure data is sorted by date
        self.data = self.data.sort_values(by=self.date_column)
        
        # Calculate growing season length for each year
        growing_seasons = []
        
        for year in self.data['year'].unique():
            year_data = self.data[self.data['year'] == year]
            
            # Skip years with incomplete data
            if len(year_data) < 360:  # Require at least 360 days of data
                continue
            
            # Calculate daily average temperature
            daily_avg = year_data.groupby(year_data[self.date_column].dt.dayofyear)[column].mean()
            
            # Find first day above threshold for 5 consecutive days
            start_day = None
            for i in range(len(daily_avg) - 5):
                if all(daily_avg.iloc[i:i+5] > threshold):
                    start_day = daily_avg.index[i]
                    break
            
            # Find last day above threshold for 5 consecutive days (searching backwards)
            end_day = None
            for i in range(len(daily_avg) - 5, 0, -1):
                if all(daily_avg.iloc[i:i+5] > threshold):
                    end_day = daily_avg.index[i+4]
                    break
            
            if start_day is not None and end_day is not None and end_day > start_day:
                growing_seasons.append({
                    "year": year,
                    "start_day": int(start_day),
                    "end_day": int(end_day),
                    "length": int(end_day - start_day + 1)
                })
        
        # Convert to DataFrame for analysis
        if not growing_seasons:
            return {
                "indicator": "growing_season_length",
                "error": "Could not calculate growing season length. Insufficient data."
            }
        
        gs_df = pd.DataFrame(growing_seasons)
        
        # Calculate trend
        length_trend = stats.linregress(gs_df['year'], gs_df['length'])
        
        return {
            "indicator": "growing_season_length",
            "column": column,
            "threshold": threshold,
            "period": {
                "start_year": int(gs_df['year'].min()),
                "end_year": int(gs_df['year'].max()),
                "total_years": int(gs_df['year'].max() - gs_df['year'].min())
            },
            "trend": {
                "slope": float(length_trend.slope),  # Days per year
                "total_change": float(length_trend.slope * (gs_df['year'].max() - gs_df['year'].min())),
                "r_squared": float(length_trend.rvalue**2),
                "p_value": float(length_trend.pvalue),
                "significant": length_trend.pvalue < 0.05
            },
            "yearly_data": gs_df.to_dict(orient='records')
        }
    
    def calculate_frost_free_days(self, column: str = "temperature", threshold: float = 0.0) -> Dict[str, Any]:
        """Calculate trends in frost-free days."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        # Count frost-free days by year
        frost_free = self.data[self.data[column]

