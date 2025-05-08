
# Arduino Web Wizard - Flask Edition

A web-based interface for Arduino development using PlatformIO.

## Requirements

- Python 3.7+
- Flask
- pySerial
- PlatformIO CLI (must be installed on your system)

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Ensure PlatformIO CLI is installed on your system

## Usage

1. Run the Flask application:
   ```
   python app.py
   ```
2. Open your browser and navigate to `http://localhost:5000`

## Features

- Code editing with syntax highlighting
- Project management
- Terminal access to PlatformIO commands
- Serial monitor
- Library management

## Notes

This is a web interface that interacts with a locally installed PlatformIO CLI.
For security reasons, this application should only be run locally and not exposed to the internet.
