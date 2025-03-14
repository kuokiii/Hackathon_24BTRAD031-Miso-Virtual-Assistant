#!/usr/bin/env python3


from datetime import datetime, timedelta
from typing import Dict, List, Callable
import time

class Schedule:
    def __init__(self, device_name: str, action: str, time: str, days: List[str]):
        self.device_name = device_name
        self.action = action
        self.time = time
        self.days = days
        self.last_run = None

    def should_run(self, current_time: datetime) -> bool:
        # Check if schedule should run based on current time and day
        current_day = current_time.strftime("%A")
        current_time_str = current_time.strftime("%H:%M")
        
        if current_day in self.days and current_time_str == self.time:
            if self.last_run is None or \
               (current_time - self.last_run).total_seconds() >= 60:
                self.last_run = current_time
                return True
        return False

class SmartHomeScheduler:
    def __init__(self):
        self.schedules: List[Schedule] = []

    def add_schedule(self, schedule: Schedule):
        self.schedules.append(schedule)
        print(f"Added schedule for {schedule.device_name}: {schedule.action} at {schedule.time} on {', '.join(schedule.days)}")

    def run(self, demo_speed: int = 1):
        print("\nStarting scheduler demo...")
        print("(Using accelerated time for demonstration)\n")

        # Demo time starts at Monday 00:00
        demo_time = datetime(2024, 1, 1, 0, 0)  # A Monday
        
        # Run for a demo "week" in accelerated time
        while True:
            for schedule in self.schedules:
                if schedule.should_run(demo_time):
                    print(f"[{demo_time.strftime('%A %H:%M')}] Executing: {schedule.device_name} - {schedule.action}")

            # Advance time by 1 minute (accelerated for demo)
            demo_time += timedelta(minutes=1)
            time.sleep(1 / demo_speed)  # Accelerate time for demo

            # Stop after a week
            if demo_time.date() >= (datetime(2024, 1, 1) + timedelta(days=7)).date():
                break

def main():
    scheduler = SmartHomeScheduler()

    # Add some example schedules
    schedules = [
        Schedule("Living Room Lights", "turn_on", "07:00", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
        Schedule("Living Room Lights", "turn_off", "23:00", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
        Schedule("Kitchen Lights", "turn_on", "06:30", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
        Schedule("Kitchen Lights", "turn_off", "22:00", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
        Schedule("Thermostat", "set_temperature(22)", "17:00", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
        Schedule("Thermostat", "set_temperature(18)", "23:00", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
    ]

    for schedule in schedules:
        scheduler.add_schedule(schedule)

    # Run the scheduler with accelerated time (1 demo minute = 1 real second)
    scheduler.run(demo_speed=60)

if __name__ == "__main__":
    main()