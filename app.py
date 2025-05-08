
import os
from flask import Flask, render_template, request, jsonify, send_from_directory
import subprocess
import json
import serial.tools.list_ports

app = Flask(__name__, 
            static_folder="static",
            template_folder="templates")

# Mock data for development
PROJECT_FILES = ["main.cpp", "platformio.ini", ".gitignore"]
AVAILABLE_LIBRARIES = ["ArduinoJson", "FastLED", "ESP8266WiFi", "WiFiManager", "PubSubClient"]

@app.route('/')
def index():
    """Render the main application page"""
    return render_template('index.html')

@app.route('/api/ports')
def get_ports():
    """Get available serial ports"""
    ports = []
    for port, desc, hwid in serial.tools.list_ports.comports():
        ports.append(port)
    return jsonify(ports)

@app.route('/api/projects/files')
def get_project_files():
    """Get project files (mock for now)"""
    # In a real implementation, this would list files from the opened project
    return jsonify(PROJECT_FILES)

@app.route('/api/file/<path:filename>')
def get_file_content(filename):
    """Get file content"""
    # In a real implementation, this would read from actual project files
    if filename == "main.cpp":
        content = """#include <Arduino.h>

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.println("LED ON");
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  Serial.println("LED OFF");
  delay(1000);
}"""
        return jsonify({"content": content})
    elif filename == "platformio.ini":
        content = """[env:uno]
platform = atmelavr
board = uno
framework = arduino"""
        return jsonify({"content": content})
    else:
        return jsonify({"content": ""})

@app.route('/api/save', methods=['POST'])
def save_file():
    """Save file content"""
    data = request.json
    filename = data.get('filename')
    content = data.get('content')
    # In a real implementation, this would save to the actual file
    return jsonify({"success": True, "message": f"Saved {filename}"})

@app.route('/api/run', methods=['POST'])
def run_command():
    """Run a PlatformIO command"""
    data = request.json
    command = data.get('command')
    # In a real implementation, this would execute the actual command
    # For safety, we'd need to validate and sanitize the command
    result = {
        "success": True,
        "output": f"Executed command: {command}\nSuccess! Operation completed."
    }
    return jsonify(result)

@app.route('/api/libraries/search')
def search_libraries():
    """Search for libraries"""
    query = request.args.get('q', '').lower()
    results = [lib for lib in AVAILABLE_LIBRARIES if query in lib.lower()]
    return jsonify(results)

@app.route('/api/libraries/install', methods=['POST'])
def install_library():
    """Install library"""
    data = request.json
    library = data.get('library')
    # In a real implementation, this would run pio lib install command
    return jsonify({
        "success": True, 
        "message": f"Installed library: {library}",
        "output": f"Installing library {library}...\nSuccess! Installed library"
    })

@app.route('/api/project/open', methods=['POST'])
def open_project():
    """Open a project"""
    # In a real implementation, this would open a project directory
    return jsonify({
        "success": True,
        "message": "Example project loaded successfully"
    })

if __name__ == '__main__':
    app.run(debug=True)
