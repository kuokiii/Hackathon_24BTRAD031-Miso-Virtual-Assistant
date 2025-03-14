#!/usr/bin/env python3
"""
Weather Forecast Model

This script implements a simple machine learning model for weather forecasting.
It uses historical weather data to predict future weather conditions.
"""

import os
import sys
import json
import csv
import pickle
import argparse
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Define constants
DEFAULT_DATA_DIR = "data/weather"
DEFAULT_MODEL_DIR = "models"
TEMPERATURE_COLUMN = "temperature"
HUMIDITY_COLUMN = "humidity"
WIND_SPEED_COLUMN = "wind_speed"
PRECIPITATION_COLUMN = "precipitation"
DATE_COLUMN = "date"

class WeatherForecastModel:
    """Class for training and using a weather forecast model."""
    
    def __init__(self, data_dir: str = DEFAULT_DATA_DIR, model_dir: str = DEFAULT_MODEL_DIR):
        """Initialize the model with data and model directories."""
        self.data_dir = data_dir
        self.model_dir = model_dir
        self.data = None
        self.model = None
        self.scaler = None
        
        # Create model directory if it doesn't exist
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)
    
    def load_data(self, filename: str) -> bool:
        """Load data from a CSV file into a pandas DataFrame."""
        filepath = os.path.join(self.data_dir, filename)
        try:
            self.data = pd.read_csv(filepath)
            
            # Convert date column to datetime
            if DATE_COLUMN in self.data.columns:
                self.data[DATE_COLUMN] = pd.to_datetime(self.data[DATE_COLUMN], errors='coerce')
                self.data = self.data.dropna(subset=[DATE_COLUMN])
                
                # Extract date features
                self.data['day_of_year'] = self.data[DATE_COLUMN].dt.dayofyear
                self.data['month'] = self.data[DATE_COLUMN].dt.month
                self.data['day'] = self.data[DATE_COLUMN].dt.day
                self.data['year'] = self.data[DATE_COLUMN].dt.year
            
            return True
        except Exception as e:
            print(f"Error loading data from {filepath}: {e}")
            return False
    
    def prepare_features(self, target_column: str = TEMPERATURE_COLUMN, lag_days: int = 5) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and target for the model."""
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if target_column not in self.data.columns:
            raise ValueError(f"Target column '{target_column}' not found in data")
        
        # Create lag features
        df = self.data.copy()
        for i in range(1, lag_days + 1):
            df[f'{target_column}_lag_{i}'] = df[target_column].shift(i)
        
        # Drop rows with NaN values (due to lag features)
        df = df.dropna()
        
        # Select features
        feature_columns = [
            'day_of_year', 'month', 'day', 'year',
            *[f'{target_column}_lag_{i}' for i in range(1, lag_days + 1)]
        ]
        
        # Add other weather variables if available
        for col in [HUMIDITY_COLUMN, WIND_SPEED_COLUMN, PRECIPITATION_COLUMN]:
            if col in df.columns and col != target_column:
                for i in range(1, lag_days + 1):
                    df[f'{col}_lag_{i}'] = df[col].shift(i)
                feature_columns.extend([f'{col}_lag_{i}' for i in range(1, lag_days + 1)])
        
        # Drop rows with NaN values again (due to additional lag features)
        df = df.dropna()
        
        # Prepare features and target
        X = df[feature_columns].values
        y = df[target_column].values
        
        return X, y
    
    def train_model(self, target_column: str = TEMPERATURE_COLUMN, lag_days: int = 5, test_size: float = 0.2) -> Dict[str, float]:
        """Train the forecast model and return evaluation metrics."""
        X, y = self.prepare_features(target_column, lag_days)
        
        # Split data into training and testing sets
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
        
        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test_scaled)
        
        metrics = {
            "mean_squared_error": mean_squared_error(y_test, y_pred),
            "root_mean_squared_error": np.sqrt(mean_squared_error(y_test, y_pred)),
            "mean_absolute_error": mean_absolute_error(y_test, y_pred),
            "r2_score": r2_score(y_test, y_pred)
        }
        
        return metrics
    
    def save_model(self, filename: str) -> bool:
        """Save the trained model to a file."""
        if self.model is None or self.scaler is None:
            raise ValueError("No trained model to save. Call train_model() first.")
        
        filepath = os.path.join(self.model_dir, filename)
        try:
            with open(filepath, 'wb') as file:
                pickle.dump({'model': self.model, 'scaler': self.scaler}, file)
            print(f"Model saved to {filepath}")
            return True
        except Exception as e:
            print(f"Error saving model to {filepath}: {e}")
            return False
    
    def load_model(self, filename: str) -> bool:
        """Load a trained model from a file."""
        filepath = os.path.join(self.model_dir, filename)
        try:
            with open(filepath, 'rb') as file:
                saved_data = pickle.load(file)
                self.model = saved_data['model']
                self.scaler = saved_data['scaler']
            print(f"Model loaded from {filepath}")
            return True
        except Exception as e:
            print(f"Error loading model from {filepath}: {e}")
            return False
    
    def predict(self, recent_data: pd.DataFrame, target_column: str = TEMPERATURE_COLUMN, days_ahead: int = 5) -> List[float]:
        """Make predictions for future days based on recent data."""
        if self.model is None or self.scaler is None:
            raise ValueError("No trained model available. Call train_model() or load_model() first.")
        
        # Prepare recent data
        if DATE_COLUMN in recent_data.columns:
            recent_data[DATE_COLUMN] = pd.to_datetime(recent_data[DATE_COLUMN], errors='coerce')
            recent_data = recent_data.dropna(subset=[DATE_COLUMN])
            
            # Extract date features
            recent_data['day_of_year'] = recent_data[DATE_COLUMN].dt.dayofyear
            recent_data['month'] = recent_data[DATE_COLUMN].dt.month
            recent_data['day'] = recent_data[DATE_COLUMN].dt.day
            recent_data['year'] = recent_data[DATE_COLUMN].dt.year
        
        # Sort by date
        if DATE_COLUMN in recent_data.columns:
            recent_data = recent_data.sort_values(by=DATE_COLUMN)
        
        # Make predictions for each day ahead
        predictions = []
        current_data = recent_data.copy()
        
        for day in range(days_ahead):
            # Prepare features for prediction
            lag_features = {}
            
            # Add lag features for target column
            for i in range(1, 6):  # Assuming lag_days=5 in training
                if len(current_data) >= i:
                    lag_features[f'{target_column}_lag_{i}'] = current_data[target_column].iloc[-i]
                else:
                    # Not enough historical data
                    return predictions
            
            # Add lag features for other weather variables
            for col in [HUMIDITY_COLUMN, WIND_SPEED_COLUMN, PRECIPITATION_COLUMN]:
                if col in current_data.columns and col != target_column:
                    for i in range(1, 6):  # Assuming lag_days=5 in training
                        if len(current_data) >= i:
                            lag_features[f'{col}_lag_{i}'] = current_data[col].iloc[-i]
                        else:
                            # Not enough historical data for this lag
                            lag_features[f'{col}_lag_{i}'] = np.nan
            
            # Get the next date
            if DATE_COLUMN in current_data.columns:
                last_date = current_data[DATE_COLUMN].iloc[-1]
                next_date = last_date + timedelta(days=1)
                
                # Add date features
                next_day_features = {
                    'day_of_year': next_date.dayofyear,
                    'month': next_date.month,
                    'day': next_date.day,
                    'year': next_date.year
                }
            else:
                # If no date column, use dummy values
                next_day_features = {
                    'day_of_year': 1,
                    'month': 1,
                    'day': 1,
                    'year': 2023
                }
            
            # Combine features
            features = {**next_day_features, **lag_features}
            
            # Create feature array
            feature_names = ['day_of_year', 'month', 'day', 'year'] + \
                           [f'{target_column}_lag_{i}' for i in range(1, 6)] + \
                           [f'{col}_lag_{i}' for col in [HUMIDITY_COLUMN, WIND_SPEED_COLUMN, PRECIPITATION_COLUMN] 
                            if col in current_data.columns and col != target_column
                            for i in range(1, 6)]
            
            X_pred = np.array([[features.get(name, np.nan) for name in feature_names]])
            
            # Handle missing values
            X_pred = np.nan_to_num(X_pred, nan=0)
            
            # Scale features
            X_pred_scaled = self.scaler.transform(X_pred)
            
            # Make prediction
            prediction = self.model.predict(X_pred_scaled)[0]
            predictions.append(prediction)
            
            # Add prediction to current data for next iteration
            new_row = current_data.iloc[-1:].copy()
            new_row[target_column] = prediction
            if DATE_COLUMN in new_row.columns:
                new_row[DATE_COLUMN] = next_date
            
            current_data = pd.concat([current_data, new_row], ignore_index=True)
        
        return predictions


def main():
    """Main function to run the script from command line."""
    parser = argparse.ArgumentParser(description="Train and use a weather forecast model")
    parser.add_argument("--data", help="CSV file with historical weather data")
    parser.add_argument("--train", action="store_true", help="Train a new model")
    parser.add_argument("--predict", action="store_true", help="Make predictions")
    parser.add_argument("--recent-data", help="CSV file with recent weather data for predictions")
    parser.add_argument("--target", choices=["temperature", "humidity", "wind_speed", "precipitation"],
                        default="temperature", help="Target variable to predict")
    parser.add_argument("--days-ahead", type=int, default=5, help="Number of days to predict ahead")
    parser.add_argument("--model-file", default="weather_model.pkl", help="File to save/load model")
    parser.add_argument("--data-dir", default=DEFAULT_DATA_DIR, help="Directory for data files")
    parser.add_argument("--model-dir", default=DEFAULT_MODEL_DIR, help="Directory for model files")
    
    args = parser.parse_args()
    
    model = WeatherForecastModel(args.data_dir, args.model_dir)
    
    if args.train:
        if not args.data:
            print("Error: --data is required for training")
            sys.exit(1)
        
        if not model.load_data(args.data):
            sys.exit(1)
        
        print(f"Training model to predict {args.target}...")
        metrics = model.train_model(args.target)
        
        print("Model evaluation metrics:")
        for metric, value in metrics.items():
            print(f"  {metric}: {value:.4f}")
        
        if model.save_model(args.model_file):
            print(f"Model saved to {os.path.join(args.model_dir, args.model_file)}")
    
    if args.predict:
        if not args.recent_data:
            print("Error: --recent-data is required for predictions")
            sys.exit(1)
        
        if not model.load_model(args.model_file):
            print(f"Error: Could not load model from {os.path.join(args.model_dir, args.model_file)}")
            sys.exit(1)
        
        # Load recent data
        recent_data_path = os.path.join(args.data_dir, args.recent_data)
        try:
            recent_data = pd.read_csv(recent_data_path)
        except Exception as e:
            print(f"Error loading recent data from {recent_data_path}: {e}")
            sys.exit(1)
        
        print(f"Making {args.days_ahead}-day predictions for {args.target}...")
        predictions = model.predict(recent_data, args.target, args.days_ahead)
        
        print("Predictions:")
        for i, pred in enumerate(predictions):
            print(f"  Day {i+1}: {pred:.2f}")


if __name__ == "__main__":
    main()

