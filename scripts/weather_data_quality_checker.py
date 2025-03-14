#!/usr/bin/env python3
"""
Weather Data Quality Checker

This script checks the quality of weather data and identifies potential issues.
It can detect missing values, outliers, inconsistencies, and other data quality problems.
"""

import os
import sys
import json
import csv
import argparse
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import matplotlib.pyplot as plt

# Define constants
DEFAULT_INPUT_DIR = "data/weather"
DEFAULT_OUTPUT_DIR = "reports/quality"

# Define expected ranges for weather parameters
PARAMETER_RANGES = {
    "temperature": {
        "min": -70,    # °C (record low on Earth: -89.2°C in Antarctica)
        "max": 60      # °C (record high on Earth: 56.7°C in Death Valley)
    },
    "humidity": {
        "min": 0,      # %
        "max": 100     # %
    },
    "wind_speed": {
        "min": 0,      # m/s
        "max": 113     # m/s (record: 113 m/s during tornado)
    },
    "pressure": {
        "min": 870,    # hPa (record low: 870 hPa during typhoon)
        "max": 1085    # hPa (record high: 1085 hPa in Siberia)
    },
    "precipitation": {
        "min": 0,      # mm
        "max": 1825    # mm (record daily rainfall: 1825 mm in Réunion)
    }
}

class WeatherDataQualityChecker:
    """Class for checking the quality of weather data."""
    
    def __init__(self, input_dir: str = DEFAULT_INPUT_DIR, output_dir: str = DEFAULT_OUTPUT_DIR):
        """Initialize the checker with input and output directories."""
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.data = None
        
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
    
    def load_data(self, filename: str) -> bool:
        """Load data from a CSV file into a pandas DataFrame."""
        filepath = os.path.join(self.input_dir, filename)
        try:
            self.data = pd.read_csv(filepath)
            
            # Convert date column to datetime if present
            date_columns = [col for col in self.data.columns if 'date' in col.lower() or 'time' in col.lower()]
            if date_columns:
                for col in date_columns:
                    self.data[col] = pd.to_datetime(self.data[col], errors='coerce')
            
            return True
        except Exception as e:
            print(f"Error loading data from {filepath}: {e}")
            return False
    
    def check_missing_values(self) -> Dict[str, Any]:
        """Check for missing values in the data."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        # Calculate missing values
        missing = self.data.isnull().sum()
        missing_percent = (missing / len(self.data)) * 100
        
        # Create summary
        missing_summary = {
            "total_rows": len(self.data),
            "columns_with_missing": sum(missing > 0),
            "total_missing_values": missing.sum(),
            "percent_missing_overall": (missing.sum() / (len(self.data) * len(self.data.columns))) * 100,
            "columns": {}
        }
        
        # Add details for each column
        for col in self.data.columns:
            if missing[col] > 0:
                missing_summary["columns"][col] = {
                    "missing_count": int(missing[col]),
                    "missing_percent": float(missing_percent[col])
                }
        
        return missing_summary
    
    def check_outliers(self, method: str = "iqr") -> Dict[str, Any]:
        """Check for outliers in numerical columns."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        # Get numerical columns
        numerical_cols = self.data.select_dtypes(include=[np.number]).columns.tolist()
        
        outliers_summary = {
            "total_rows": len(self.data),
            "method": method,
            "columns": {}
        }
        
        for col in numerical_cols:
            # Skip columns with all missing values
            if self.data[col].isnull().all():
                continue
            
            # Detect outliers based on method
            if method == "iqr":
                Q1 = self.data[col].quantile(0.25)
                Q3 = self.data[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                outliers = self.data[(self.data[col] < lower_bound) | (self.data[col] > upper_bound)]
            elif method == "zscore":
                from scipy import stats
                z_scores = np.abs(stats.zscore(self.data[col].dropna()))
                outliers_mask = z_scores > 3
                outliers = self.data[col].dropna()[outliers_mask]
            elif method == "range":
                # Use predefined ranges if available
                if col in PARAMETER_RANGES:
                    lower_bound = PARAMETER_RANGES[col]["min"]
                    upper_bound = PARAMETER_RANGES[col]["max"]
                    outliers = self.data[(self.data[col] < lower_bound) | (self.data[col] > upper_bound)]
                else:
                    # Skip columns without predefined ranges
                    continue
            else:
                raise ValueError(f"Unsupported outlier detection method: {method}")
            
            # Add to summary if outliers found
            if len(outliers) > 0:
                outliers_summary["columns"][col] = {
                    "outlier_count": len(outliers),
                    "outlier_percent": (len(outliers) / len(self.data)) * 100,
                    "min_value": float(self.data[col].min()),
                    "max_value": float(self.data[col].max()),
                    "mean_value": float(self.data[col].mean()),
                    "lower_bound": float(lower_bound),
                    "upper_bound": float(upper_bound)
                }
        
        return outliers_summary
    
    def check_consistency(self) -> Dict[str, Any]:
        """Check for data consistency issues."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        consistency_issues = {
            "total_rows": len(self.data),
            "issues": []
        }
        
        # Check for duplicate rows
        duplicates = self.data.duplicated()
        if duplicates.any():
            consistency_issues["issues"].append({
                "type": "duplicate_rows",
                "count": int(duplicates.sum()),
                "percent": float((duplicates.sum() / len(self.data)) * 100)
            })
        
        # Check for date consistency if date column exists
        date_columns = [col for col in self.data.columns if 'date' in col.lower() or 'time' in col.lower()]
        for date_col in date_columns:
            if pd.api.types.is_datetime64_any_dtype(self.data[date_col]):
                # Check for non-chronological dates
                if not self.data[date_col].equals(self.data[date_col].sort_values()):
                    consistency_issues["issues"].append({
                        "type": "non_chronological_dates",
                        "column": date_col
                    })
                
                # Check for future dates
                future_dates = self.data[self.data[date_col] > datetime.now()]
                if not future_dates.empty:
                    consistency_issues["issues"].append({
                        "type": "future_dates",
                        "column": date_col,
                        "count": len(future_dates),
                        "percent": (len(future_dates) / len(self.data)) * 100
                    })
                
                # Check for gaps in daily data
                if len(self.data) > 1:
                    date_diff = self.data[date_col].diff().dropna()
                    if date_diff.dt.days.max() > 1:
                        consistency_issues["issues"].append({
                            "type": "date_gaps",
                            "column": date_col,
                            "max_gap_days": int(date_diff.dt.days.max())
                        })
        
        # Check for logical consistency between related variables
        # Example: humidity should be between 0-100%
        if "humidity" in self.data.columns:
            invalid_humidity = self.data[(self.data["humidity"] < 0) | (self.data["humidity"] > 100)]
            if not invalid_humidity.empty:
                consistency_issues["issues"].append({
                    "type": "invalid_humidity",
                    "count": len(invalid_humidity),
                    "percent": (len(invalid_humidity) / len(self.data)) * 100
                })
        
        # Example: wind speed should be non-negative
        if "wind_speed" in self.data.columns:
            negative_wind = self.data[self.data["wind_speed"] < 0]
            if not negative_wind.empty:
                consistency_issues["issues"].append({
                    "type": "negative_wind_speed",
                    "count": len(negative_wind),
                    "percent": (len(negative_wind) / len(self.data)) * 100
                })
        
        # Example: precipitation should be non-negative
        if "precipitation" in self.data.columns:
            negative_precip = self.data[self.data["precipitation"] < 0]
            if not negative_precip.empty:
                consistency_issues["issues"].append({
                    "type": "negative_precipitation",
                    "count": len(negative_precip),
                    "percent": (len(negative_precip) / len(self.data)) * 100
                })
        
        return consistency_issues
    
    def check_completeness(self) -> Dict[str, Any]:
        """Check for data completeness issues."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        completeness_issues = {
            "total_rows": len(self.data),
            "total_columns": len(self.data.columns),
            "complete_rows": int(self.data.dropna().shape[0]),
            "complete_rows_percent": float((self.data.dropna().shape[0] / len(self.data)) * 100),
            "columns": {}
        }
        
        # Check completeness for each column
        for col in self.data.columns:
            non_null_count = self.data[col].count()
            completeness_issues["columns"][col] = {
                "complete_count": int(non_null_count),
                "complete_percent": float((non_null_count / len(self.data)) * 100)
            }
        
        return completeness_issues
    
    def generate_quality_report(self, filename: str) -> Dict[str, Any]:
        """Generate a comprehensive data quality report."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        report = {
            "filename": filename,
            "report_date": datetime.now().isoformat(),
            "data_shape": {
                "rows": len(self.data),
                "columns": len(self.data.columns)
            },
            "column_types": {col: str(dtype) for col, dtype in self.data.dtypes.items()},
            "missing_values": self.check_missing_values(),
            "outliers": self.check_outliers(method="range"),
            "consistency": self.check_consistency(),
            "completeness": self.check_completeness()
        }
        
        return report
    
    def save_report(self, report: Dict[str, Any], filename: str) -> bool:
        """Save a report to a JSON file."""
        filepath = os.path.join(self.output_dir, filename)
        try:
            with open(filepath, 'w') as file:
                json.dump(report, file, indent=2)
            print(f"Report saved to {filepath}")
            return True
        except Exception as e:
            print(f"Error saving report to {filepath}: {e}")
            return False
    
    def plot_missing_values(self, save_path: Optional[str] = None) -> plt.Figure:
        """Plot missing values in the data."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        # Create figure
        fig, ax = plt.subplots(figsize=(12, 6))
        
        # Calculate missing values
        missing = self.data.isnull().sum()
        missing_percent = (missing / len(self.data)) * 100
        
        # Sort columns by missing percentage
        missing_percent = missing_percent.sort_values(ascending=False)
        
        # Plot missing percentages
        bars = ax.bar(missing_percent.index, missing_percent.values, color='crimson')
        
        # Add labels and title
        ax.set_xlabel('Columns')
        ax.set_ylabel('Missing Values (%)')
        ax.set_title('Percentage of Missing Values by Column')
        
        # Rotate x-axis labels for better readability
        plt.xticks(rotation=90)
        
        # Add grid
        ax.grid(True, linestyle='--', alpha=0.7)
        
        # Add value labels on top of bars
        for bar in bars:
            height = bar.get_height()
            if height > 0:
                ax.text(bar.get_x() + bar.get_width()/2., height + 1,
                        f'{height:.1f}%', ha='center', va='bottom')
        
        plt.tight_layout()
        
        # Save figure if path provided
        if save_path:
            full_path = os.path.join(self.output_dir, save_path)
            fig.savefig(full_path, dpi=300, bbox_inches='tight')
            print(f"Plot saved to {full_path}")
        
        return fig
    
    def plot_outliers(self, save_path: Optional[str] = None) -> plt.Figure:
        """Plot outliers in numerical columns."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        # Get numerical columns
        numerical_cols = self.data.select_dtypes(include=[np.number]).columns.tolist()
        
        # Create figure
        fig, axs = plt.subplots(len(numerical_cols), 1, figsize=(12, 4 * len(numerical_cols)))
        
        # Handle case with only one numerical column
        if len(numerical_cols) == 1:
            axs = [axs]
        
        for i, col in enumerate(numerical_cols):
            # Skip columns with all missing values
            if self.data[col].isnull().all():
                axs[i].text(0.5, 0.5, f"All values missing in {col}", 
                           horizontalalignment='center', verticalalignment='center',
                           transform=axs[i].transAxes)
                continue
            
            # Create box plot
            axs[i].boxplot(self.data[col].dropna(), vert=False)
            
            # Add labels and title
            axs[i].set_title(f'Box Plot of {col}')
            axs[i].set_xlabel(col)
            axs[i].set_yticks([])
            
            # Add grid
            axs[i].grid(True, linestyle='--', alpha=0.7)
        
        plt.tight_layout()
        
        # Save figure if path provided
        if save_path:
            full_path = os.path.join(self.output_dir, save_path)
            fig.savefig(full_path, dpi=300, bbox_inches='tight')
            print(f"Plot saved to {full_path}")
        
        return fig


def main():
    """Main function to run the script from command line."""
    parser = argparse.ArgumentParser(description="Check the quality of weather data")
    parser.add_argument("input_file", help="CSV file with weather data")
    parser.add_argument("--input-dir", default=DEFAULT_INPUT_DIR, help="Directory containing input files")
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR, help="Directory for output files")
    parser.add_argument("--report", help="Generate and save a quality report to the specified file")
    parser.add_argument("--plot-missing", action="store_true", help="Generate a plot of missing values")
    parser.add_argument("--plot-outliers", action="store_true", help="Generate a plot of outliers")
    
    args = parser.parse_args()
    
    checker = WeatherDataQualityChecker(args.input_dir, args.output_dir)
    
    if not checker.load_data(args.input_file):
        sys.exit(1)
    
    if args.report:
        report = checker.generate_quality_report(args.input_file)
        checker.save_report(report, args.report)
    
    if args.plot_missing:
        checker.plot_missing_values(f"{os.path.splitext(args.input_file)[0]}_missing_values.png")
    
    if args.plot_outliers:
        checker.plot_outliers(f"{os.path.splitext(args.input_file)[0]}_outliers.png")


if __name__ == "__main__":
    main()

