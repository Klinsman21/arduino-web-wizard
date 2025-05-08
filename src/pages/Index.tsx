
import React, { useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, FolderOpen, Play, RefreshCw, Plus, Search, Upload, Download } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("editor");
  const [projectOpen, setProjectOpen] = useState(false);
  const [serialOpen, setSerialOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedPort, setSelectedPort] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("Arduino Web Wizard initialized.\nReady for commands...");
  const [searchLibrary, setSearchLibrary] = useState("");
  const [currentFile, setCurrentFile] = useState("main.cpp");
  const [editorContent, setEditorContent] = useState(
`#include <Arduino.h>

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
}
`);

  // Mock data
  const availablePorts = ["COM1", "COM3", "/dev/ttyUSB0", "/dev/ttyACM0"];
  const projectFiles = ["main.cpp", "platformio.ini", ".gitignore"];
  const searchResults = [
    "ArduinoJson",
    "FastLED",
    "ESP8266WiFi", 
    "WiFiManager",
    "PubSubClient"
  ].filter(lib => lib.toLowerCase().includes(searchLibrary.toLowerCase()));

  const runCommand = (command: string) => {
    toast({
      title: "Running command",
      description: command,
    });
    
    // In a real application, this would connect to the PlatformIO CLI
    setTerminalOutput(prev => `${prev}\n$ ${command}\nExecuting...`);
    
    // Simulate terminal output after a delay
    setTimeout(() => {
      if (command.includes("compile") || command.includes("build")) {
        setTerminalOutput(prev => `${prev}\nSuccess! Compiled 'framework-arduino-avr' in 2.1s\nBinary size: 3,428 bytes`);
      } else if (command.includes("upload")) {
        setTerminalOutput(prev => `${prev}\nUploading .pio/build/uno/firmware.hex\nSuccess! Uploaded to Arduino Uno`);
      } else if (command.includes("install")) {
        setTerminalOutput(prev => `${prev}\nInstalling library...\nSuccess! Installed library`);
      }
    }, 1500);
  };

  const openProject = () => {
    // This would open a file dialog in a real implementation
    toast({
      title: "Project opened",
      description: "Example project loaded successfully",
    });
    setProjectOpen(true);
  };

  const installLibrary = (library: string) => {
    runCommand(`pio lib install "${library}"`);
    toast({
      title: "Installing library",
      description: library,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="bg-primary p-4">
        <h1 className="text-2xl font-bold text-primary-foreground">Arduino Web Wizard</h1>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Project Explorer */}
        <div className="w-64 border-r border-border bg-muted p-4 overflow-auto">
          <div className="mb-4">
            <Button onClick={openProject} variant="outline" className="w-full flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Open Project
            </Button>
          </div>
          
          {projectOpen && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Project Files</h3>
              <ul className="space-y-1">
                {projectFiles.map(file => (
                  <li key={file} 
                    className={`p-2 rounded text-sm cursor-pointer hover:bg-accent ${currentFile === file ? 'bg-accent' : ''}`}
                    onClick={() => setCurrentFile(file)}>
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <Collapsible
            open={libraryOpen}
            onOpenChange={setLibraryOpen}
            className="mt-6 border-t border-border pt-4"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full mb-2">
              <span className="font-semibold">Library Manager</span>
              {libraryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search libraries..." 
                    value={searchLibrary}
                    onChange={(e) => setSearchLibrary(e.target.value)}
                  />
                  <Button size="icon" variant="ghost">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="mt-2 space-y-1">
                  {searchResults.map(lib => (
                    <li key={lib} className="flex items-center justify-between p-2 text-sm bg-background rounded">
                      {lib}
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => installLibrary(lib)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="editor" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-border">
              <TabsList className="h-10">
                <TabsTrigger value="editor">Code Editor</TabsTrigger>
                <TabsTrigger value="terminal">Terminal</TabsTrigger>
                <TabsTrigger value="serial">Serial Monitor</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="editor" className="flex-1 p-0 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="bg-muted px-4 py-1 text-sm text-muted-foreground border-b border-border">
                  {currentFile}
                </div>
                <Textarea
                  className="flex-1 font-mono text-sm resize-none p-4 rounded-none border-0 focus-visible:ring-0"
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="terminal" className="flex-1 p-0">
              <div className="h-full flex flex-col">
                <div className="bg-muted px-4 py-1 text-sm flex items-center justify-between border-b border-border">
                  <span>Terminal Output</span>
                  <Button size="sm" variant="ghost">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 bg-black text-white font-mono text-sm p-4 overflow-auto whitespace-pre-wrap">
                  {terminalOutput}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="serial" className="flex-1 p-0">
              <div className="h-full flex flex-col">
                <div className="bg-muted p-2 flex items-center gap-2 border-b border-border">
                  <Label className="text-sm">Port:</Label>
                  <select 
                    className="h-8 rounded-md border border-input px-3 py-1 text-sm bg-background"
                    value={selectedPort}
                    onChange={(e) => setSelectedPort(e.target.value)}
                  >
                    <option value="">Select a port</option>
                    {availablePorts.map(port => (
                      <option key={port} value={port}>{port}</option>
                    ))}
                  </select>
                  <Button size="sm" disabled={!selectedPort}>Connect</Button>
                  <Button size="sm" variant="outline" disabled={!selectedPort}>115200</Button>
                </div>
                <div className="flex-1 bg-black text-green-400 font-mono text-sm p-4 overflow-auto">
                  {selectedPort ? "No data received yet..." : "Select a port to connect"}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Action buttons */}
          <div className="border-t border-border p-2 flex justify-between">
            <div className="flex gap-2">
              <Button onClick={() => runCommand("pio run -t compile")} className="flex items-center gap-1">
                <Play className="h-4 w-4" /> Compile
              </Button>
              <Button onClick={() => runCommand("pio run -t upload")} variant="outline" className="flex items-center gap-1">
                <Upload className="h-4 w-4" /> Upload
              </Button>
              <Button onClick={() => setActiveTab("serial")} variant="outline" className="flex items-center gap-1">
                <Download className="h-4 w-4" /> Monitor
              </Button>
            </div>
            <div>
              <Button variant="secondary" onClick={() => runCommand("pio lib update")}>Update All</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
