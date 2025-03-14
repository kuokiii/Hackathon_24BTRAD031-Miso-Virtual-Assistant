#!/usr/bin/env python3
"""
Historical Weather Analyzer

This script analyzes historical weather data to identify trends and patterns.
It can calculate seasonal averages, identify climate change indicators, and generate reports.
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
DEFAULT_DATA_DIR = "data/historical"
DEFAULT_OUTPUT_DIR = "reports"
TEMPERATURE_COLUMN = "temperature"
PRECIPITATION_COLUMN = "precipitation"
DATE_COLUMN = "date"

class HistoricalWeatherAnalyzer:
    """Class for analyzing historical weather data."""
    
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
            if DATE_COLUMN in self.data.columns:
                self.data[DATE_COLUMN] = pd.to_datetime(self.data[DATE_COLUMN], errors='coerce')
                self.data = self.data.dropna(subset=[DATE_COLUMN])
                
                # Extract date components
                self.data['year'] = self.data[DATE_COLUMN].dt.year
                self.data['month'] = self.data[DATE_COLUMN].dt.month
                self.data['day'] = self.data[DATE_COLUMN].dt.day
                self.data['season'] = self.data[DATE_COLUMN].dt.month.apply(self._get_season)
            
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
    
    def calculate_yearly_averages(self, column: str = TEMPERATURE_COLUMN) -> pd.DataFrame:
        """Calculate yearly averages for a specific column."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        yearly_avg = self.data.groupby('year')[column].agg(['mean', 'min', 'max', 'std']).reset_index()
        yearly_avg.columns = ['year', f'avg_{column}', f'min_{column}', f'max_{column}', f'std_{column}']
        
        return yearly_avg
    
    def calculate_seasonal_averages(self, column: str = TEMPERATURE_COLUMN) -> pd.DataFrame:
        """Calculate seasonal averages for a specific column."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        seasonal_avg = self.data.groupby(['year', 'season'])[column].agg(['mean', 'min', 'max', 'std']).reset_index()
        seasonal_avg.columns = ['year', 'season', f'avg_{column}', f'min_{column}', f'max_{column}', f'std_{column}']
        
        return seasonal_avg
    
    def calculate_monthly_averages(self, column: str = TEMPERATURE_COLUMN) -> pd.DataFrame:
        """Calculate monthly averages for a specific column."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        monthly_avg = self.data.groupby(['year', 'month'])[column].agg(['mean', 'min', 'max', 'std']).reset_index()
        monthly_avg.columns = ['year', 'month', f'avg_{column}', f'min_{column}', f'max_{column}', f'std_{column}']
        
        return monthly_avg
    
    def analyze_trends(self, column: str = TEMPERATURE_COLUMN) -> Dict[str, Any]:
        """Analyze trends in the data for a specific column."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        yearly_avg = self.calculate_yearly_averages(column)
        
        # Calculate linear trend
        slope, intercept, r_value, p_value, std_err = stats.linregress(
            yearly_avg['year'], yearly_avg[f'avg_{column}']
        )
        
        # Calculate decadal change
        decadal_change = slope * 10  # Change per decade
        
        # Calculate significance
        significant = p_value < 0.05
        
        # Calculate total change over the period
        total_years = yearly_avg['year'].max() - yearly_avg['year'].min()
        total_change = slope * total_years
        
        # Calculate variability
        variability = yearly_avg[f'std_{column}'].mean()
        
        # Calculate extreme years
        extreme_high_year = yearly_avg.loc[yearly_avg[f'avg_{column}'].idxmax()]['year']
        extreme_low_year = yearly_avg.loc[yearly_avg[f'avg_{column}'].idxmin()]['year']
        
        # Calculate 5-year moving average
        yearly_avg['moving_avg_5yr'] = yearly_avg[f'avg_{column}'].rolling(window=5, center=True).mean()
        
        # Calculate anomalies from baseline period (first 30 years if available)
        baseline_years = min(30, len(yearly_avg))
        baseline = yearly_avg.iloc[:baseline_years][f'avg_{column}'].mean()
        yearly_avg['anomaly'] = yearly_avg[f'avg_{column}'] - baseline
        
        return {
            "slope": slope,
            "intercept": intercept,
            "r_squared": r_value**2,
            "p_value": p_value,
            "std_err": std_err,
            "decadal_change": decadal_change,
            "significant": significant,
            "total_change": total_change,
            "variability": variability,
            "extreme_high_year": int(extreme_high_year),
            "extreme_low_year": int(extreme_low_year),
            "yearly_data": yearly_avg.to_dict(orient='records'),
            "baseline": baseline
        }
    
    def analyze_seasonal_trends(self, column: str = TEMPERATURE_COLUMN) -> Dict[str, Any]:
        """Analyze seasonal trends in the data for a specific column."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        seasonal_avg = self.calculate_seasonal_averages(column)
        
        results = {}
        
        for season in ["Winter", "Spring", "Summer", "Fall"]:
            season_data = seasonal_avg[seasonal_avg['season'] == season]
            
            if len(season_data) < 2:
                results[season] = {"error": "Not enough data for trend analysis"}
                continue
            
            # Calculate linear trend
            slope, intercept, r_value, p_value, std_err = stats.linregress(
                season_data['year'], season_data[f'avg_{column}']
            )
            
            # Calculate decadal change
            decadal_change = slope * 10  # Change per decade
            
            # Calculate significance
            significant = p_value < 0.05
            
            # Calculate total change over the period
            total_years = season_data['year'].max() - season_data['year'].min()
            total_change = slope * total_years
            
            results[season] = {
                "slope": slope,
                "intercept": intercept,
                "r_squared": r_value**2,
                "p_value": p_value,
                "std_err": std_err,
                "decadal_change": decadal_change,
                "significant": significant,
                "total_change": total_change
            }
        
        return results
    
    def analyze_extreme_events(self, column: str = TEMPERATURE_COLUMN, threshold_percentile: float = 95) -> Dict[str, Any]:
        """Analyze extreme events in the data for a specific column."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        # Calculate threshold for extreme events
        threshold = np.percentile(self.data[column], threshold_percentile)
        
        # Identify extreme events
        extreme_events = self.data[self.data[column] >= threshold].copy()
        
        # Count extreme events by year
        yearly_counts = extreme_events.groupby('year').size().reset_index(name='count')
        
        # Calculate trend in extreme events
        if len(yearly_counts) >= 2:
            slope, intercept, r_value, p_value, std_err = stats.linregress(
                yearly_counts['year'], yearly_counts['count']
            )
            
            # Calculate decadal change
            decadal_change = slope * 10  # Change per decade
            
            # Calculate significance
            significant = p_value < 0.05
        else:
            slope = intercept = r_value = p_value = std_err = decadal_change = None
            significant = False
        
        return {
            "threshold": threshold,
            "threshold_percentile": threshold_percentile,
            "total_extreme_events": len(extreme_events),
            "yearly_counts": yearly_counts.to_dict(orient='records'),
            "slope": slope,
            "intercept": intercept,
            "r_squared": r_value**2 if r_value is not None else None,
            "p_value": p_value,
            "std_err": std_err,
            "decadal_change": decadal_change,
            "significant": significant
        }
    
    def plot_yearly_trend(self, column: str = TEMPERATURE_COLUMN, save_path: Optional[str] = None) -> plt.Figure:
        """Plot yearly trend for a specific column."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        yearly_avg = self.calculate_yearly_averages(column)
        
        # Create figure
        fig, ax = plt.subplots(figsize=(12, 6))
        
        # Plot yearly average
        ax.plot(yearly_avg['year'], yearly_avg[f'avg_{column}'], 'o-', color='blue', label=f'Yearly Average {column}')
        
        # Plot 5-year moving average
        yearly_avg['moving_avg'] = yearly_avg[f'avg_{column}'].rolling(window=5, center=True).mean()
        ax.plot(yearly_avg['year'], yearly_avg['moving_avg'], '-', color='red', linewidth=2, label='5-Year Moving Average')
        
        # Calculate and plot trend line
        slope, intercept, r_value, p_value, std_err = stats.linregress(
            yearly_avg['year'], yearly_avg[f'avg_{column}']
        )
        
        x = np.array([yearly_avg['year'].min(), yearly_avg['year'].max()])
        y = intercept + slope * x
        ax.plot(x, y, '--', color='green', linewidth=2, 
                label=f'Trend: {slope:.4f} per year (p={p_value:.4f})')
        
        # Add labels and title
        ax.set_xlabel('Year')
        ax.set_ylabel(column)
        ax.set_title(f'Yearly Average {column} Trend')
        
        # Add grid and legend
        ax.grid(True, linestyle='--', alpha=0.7)
        ax.legend()
        
        # Save figure if path provided
        if save_path:
            full_path = os.path.join(self.output_dir, save_path)
            fig.savefig(full_path, dpi=300, bbox_inches='tight')
            print(f"Plot saved to {full_path}")
        
        return fig
    
    def plot_seasonal_trends(self, column: str = TEMPERATURE_COLUMN, save_path: Optional[str] = None) -> plt.Figure:
        """Plot seasonal trends for a specific column."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in self.data.columns:
            raise ValueError(f"Column '{column}' not found in data")
        
        seasonal_avg = self.calculate_seasonal_averages(column)
        
        # Create figure
        fig, axs = plt.subplots(2, 2, figsize=(14, 10), sharex=True)
        axs = axs.flatten()
        
        seasons = ["Winter", "Spring", "Summer", "Fall"]
        colors = ["blue", "green", "red", "orange"]
        
        for i, (season, color) in enumerate(zip(seasons, colors)):
            season_data = seasonal_avg[seasonal_avg['season'] == season]
            
            if len(season_data) < 2:
                axs[i].text(0.5, 0.5, f"Not enough data for {season}", 
                           horizontalalignment='center', verticalalignment='center',
                           transform=axs[i].transAxes)
                continue
            
            # Plot seasonal average
            axs[i].plot(season_data['year'], season_data[f'avg_{column}'], 'o-', color=color, 
                       label=f'{season} Average')
            
            # Calculate and plot trend line
            slope, intercept, r_value, p_value, std_err = stats.linregress(
                season_data['year'], season_data[f'avg_{column}']
            )
            
            x = np.array([season_data['year'].min(), season_data['year'].max()])
            y = intercept + slope * x
            axs[i].plot(x, y, '--', color='black', linewidth=2, 
                       label=f'Trend: {slope:.4f} per year (p={p_value:.4f})')
            
            # Add labels and title
            axs[i].set_title(f'{season} {column} Trend')
            axs[i].set_ylabel(column)
            if i >= 2:  # Only add x-label for bottom plots
                axs[i].set_xlabel('Year')
            
            # Add grid and legend
            axs[i].grid(True, linestyle='--', alpha=0.7)
            axs[i].legend()
        
        plt.tight_layout()
        
        # Save figure if path provided
        if save_path:
            full_path = os.path.join(self.output_dir, save_path)
            fig.savefig(full_path, dpi=300, bbox_inches='tight')
            print(f"Plot saved to {full_path}")
        
        return fig
    
    def generate_report(self, location: str, columns: List[str] = None, save_path: Optional[str] = None) -> Dict[str, Any]:
        """Generate a comprehensive climate analysis report."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if columns is None:
            columns = [col for col in [TEMPERATURE_COLUMN, PRECIPITATION_COLUMN] if col in self.data.columns]
        
        report = {
            "location": location,
            "analysis_date": datetime.now().isoformat(),
            "data_period": {
                "start": self.data[DATE_COLUMN].min().strftime('%Y-%m-%d'),
                "end": self.data[DATE_COLUMN].max().strftime('%Y-%m-%d'),
                "years": int(self.data['year'].max() - self.data['year'].min() + 1)
            },
            "trends": {},
            "seasonal_trends": {},
            "extreme_events": {}
        }
        
        # Analyze trends for each column
        for column in columns:
            report["trends"][column] = self.analyze_trends(column)
            report["seasonal_trends"][column] = self.analyze_seasonal_trends(column)
            report["extreme_events"][column] = self.analyze_extreme_events(column)
            
            # Generate and save plots
            if save_path:
                plot_dir = os.path.join(self.output_dir, "plots")
                if not os.path.exists(plot_dir):
                    os.makedirs(plot_dir)
                
                yearly_plot_path = os.path.join("plots", f"{location}_{column}_yearly_trend.png")
                seasonal_plot_path = os.path.join("plots", f"{location}_{column}_seasonal_trends.png")
                
                self.plot_yearly_trend(column, yearly_plot_path)
                self.plot_seasonal_trends(column, seasonal_plot_path)
                
                report["plots"] = report.get("plots", {})
                report["plots"][column] = {
                    "yearly_trend": yearly_plot_path,
                    "seasonal_trends": seasonal_plot_path
                }
        
        # Save report if path provided
        if save_path:
            full_path = os.path.join(self.output_dir, save_path)
            with open(full_path, 'w') as file:
                json.dump(report, file, indent=2)
            print(f"Report saved to {full_path}")
        
        return report


def main():
    """Main function to run the script from command line."""
    parser = argparse.ArgumentParser(description="Analyze historical weather data")
    parser.add_argument("input_file", help="CSV file with historical weather data")
    parser.add_argument("--location", default="Unknown", help="Location name for the report")
    parser.add_argument("--temperature-column", default=TEMPERATURE_COLUMN, help="Column name for temperature data")
    parser.add_argument("--precipitation-column", default=PRECIPITATION_COLUMN, help="Column name for precipitation data")
    parser.add_argument("--date-column", default=DATE_COLUMN, help="Column name for date data")
    parser.add_argument("--data-dir", default=DEFAULT_DATA_DIR, help="Directory containing data files")
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR, help="Directory for output files")
    parser.add_argument("--report", help="Generate and save a comprehensive report to the specified file")
    parser.add_argument("--plot-yearly", action="store_true", help="Generate yearly trend plots")
    parser.add_argument("--plot-seasonal", action="store_true", help="Generate seasonal trend plots")
    
    args = parser.parse_args()
    
    # Update global constants based on command line arguments
    global TEMPERATURE_COLUMN, PRECIPITATION_COLUMN, DATE_COLUMN
    TEMPERATURE_COLUMN = args.temperature_column
    PRECIPITATION_COLUMN = args.precipitation_column
    DATE_COLUMN = args.date_column
    
    analyzer = HistoricalWeatherAnalyzer(args.data_dir, args.output_dir)
    
    if not analyzer.load_data(args.input_file):
        sys.exit(1)
    
    if args.report:
        columns = []
        if TEMPERATURE_COLUMN in analyzer.data.columns:
            columns.append(TEMPERATURE_COLUMN)
        if PRECIPITATION_COLUMN in analyzer.data.columns:
            columns.append(PRECIPITATION_COLUMN)
        
        analyzer.generate_report(args.location, columns, args.report)
    
    if args.plot_yearly:
        if TEMPERATURE_COLUMN in analyzer.data.columns:
            analyzer.plot_yearly_trend(TEMPERATURE_COLUMN, f"{args.location}_temperature_yearly_trend.png")
        if PRECIPITATION_COLUMN in analyzer.data.columns:
            analyzer.plot_yearly_trend(PRECIPITATION_COLUMN, f"{args.location}_precipitation_yearly_trend.png")
    
    if args.plot_seasonal:
        if TEMPERATURE_COLUMN in analyzer.data.columns:
            analyzer.plot_seasonal_trends(TEMPERATURE_COLUMN, f"{args.location}_temperature_seasonal_trends.png")
        if PRECIPITATION_COLUMN in analyzer.data.columns:
            analyzer.plot_seasonal_trends(PRECIPITATION_COLUMN, f"{args.location}_precipitation_seasonal_trends.png")


if __name__ == "__main__":
    main()

