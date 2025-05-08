
// Arduino Web Wizard - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Variables
    let editor;
    let terminal;
    let activeFile = '';
    
    // Initialize the application
    initializeEditor();
    initializeTerminal();
    setupEventListeners();
    
    // Initialize Monaco Editor
    function initializeEditor() {
        require(['vs/editor/editor.main'], function() {
            editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                value: [
                    '#include <Arduino.h>',
                    '',
                    'void setup() {',
                    '  Serial.begin(115200);',
                    '  pinMode(LED_BUILTIN, OUTPUT);',
                    '}',
                    '',
                    'void loop() {',
                    '  digitalWrite(LED_BUILTIN, HIGH);',
                    '  Serial.println("LED ON");',
                    '  delay(1000);',
                    '  digitalWrite(LED_BUILTIN, LOW);',
                    '  Serial.println("LED OFF");',
                    '  delay(1000);',
                    '}'
                ].join('\n'),
                language: 'cpp',
                theme: 'vs-dark',
                automaticLayout: true
            });
        });
    }
    
    // Initialize XTerm.js terminal
    function initializeTerminal() {
        terminal = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#000000',
                foreground: '#ffffff'
            }
        });
        
        terminal.open(document.getElementById('terminal-container'));
        terminal.write('Arduino Web Wizard Terminal\r\n$ ');
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.nav-link').forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs and content
                document.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Show corresponding content
                const target = this.getAttribute('data-target');
                document.getElementById(target).classList.add('active');
            });
        });
        
        // Serial port selection
        fetch('/api/ports')
            .then(response => response.json())
            .then(ports => {
                const select = document.getElementById('serialPortSelect');
                ports.forEach(port => {
                    const option = document.createElement('option');
                    option.value = port;
                    option.textContent = port;
                    select.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error fetching ports:', error);
            });
        
        // Open Project button
        document.getElementById('openProjectBtn').addEventListener('click', function() {
            fetch('/api/project/open', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast('Project Opened', data.message, 'success');
                    loadProjectFiles();
                }
            })
            .catch(error => {
                console.error('Error opening project:', error);
                showToast('Error', 'Failed to open project', 'danger');
            });
        });
        
        // Compile Button
        document.getElementById('compileBtn').addEventListener('click', function() {
            runCommand('compile', 'pio run -t compile');
        });
        
        // Upload Button
        document.getElementById('uploadBtn').addEventListener('click', function() {
            runCommand('upload', 'pio run -t upload');
        });
        
        // Serial Send Button
        document.getElementById('serialSendBtn').addEventListener('click', function() {
            const input = document.getElementById('serialInput');
            const message = input.value;
            if (message) {
                // In a real app, this would send data to the serial port
                document.getElementById('serialOutput').textContent += `> ${message}\n`;
                input.value = '';
            }
        });
        
        // Library Search Button
        document.getElementById('searchLibBtn').addEventListener('click', function() {
            const query = document.getElementById('librarySearch').value;
            searchLibraries(query);
        });
        
        // Search libraries when pressing Enter
        document.getElementById('librarySearch').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value;
                searchLibraries(query);
            }
        });
    }
    
    // Load project files
    function loadProjectFiles() {
        fetch('/api/projects/files')
            .then(response => response.json())
            .then(files => {
                const filesList = document.getElementById('filesList');
                filesList.innerHTML = '';
                
                files.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = file;
                    li.addEventListener('click', () => loadFile(file));
                    filesList.appendChild(li);
                });
                
                if (files.length > 0) {
                    loadFile(files[0]);
                }
            })
            .catch(error => {
                console.error('Error loading project files:', error);
                showToast('Error', 'Failed to load project files', 'danger');
            });
    }
    
    // Load a specific file
    function loadFile(filename) {
        activeFile = filename;
        
        // Update UI to show active file
        document.querySelectorAll('#filesList li').forEach(li => {
            li.classList.remove('active');
            if (li.textContent === filename) {
                li.classList.add('active');
            }
        });
        
        fetch(`/api/file/${filename}`)
            .then(response => response.json())
            .then(data => {
                if (editor) {
                    // Determine language mode based on file extension
                    let language = 'cpp';
                    if (filename.endsWith('.ini')) language = 'ini';
                    if (filename.endsWith('.py')) language = 'python';
                    if (filename.endsWith('.h')) language = 'cpp';
                    if (filename.endsWith('.json')) language = 'json';
                    
                    editor.setValue(data.content);
                    monaco.editor.setModelLanguage(editor.getModel(), language);
                }
            })
            .catch(error => {
                console.error(`Error loading file ${filename}:`, error);
                showToast('Error', `Failed to load file ${filename}`, 'danger');
            });
    }
    
    // Search for libraries
    function searchLibraries(query) {
        if (!query) return;
        
        fetch(`/api/libraries/search?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(results => {
                const libraryResults = document.getElementById('libraryResults');
                libraryResults.innerHTML = '';
                
                if (results.length === 0) {
                    libraryResults.innerHTML = '<p class="text-muted small">No libraries found</p>';
                    return;
                }
                
                results.forEach(lib => {
                    const div = document.createElement('div');
                    div.className = 'library-item';
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = lib;
                    
                    const installBtn = document.createElement('button');
                    installBtn.className = 'install-lib-btn';
                    installBtn.innerHTML = '<i class="fas fa-plus"></i>';
                    installBtn.title = `Install ${lib}`;
                    installBtn.addEventListener('click', () => installLibrary(lib));
                    
                    div.appendChild(nameSpan);
                    div.appendChild(installBtn);
                    libraryResults.appendChild(div);
                });
            })
            .catch(error => {
                console.error('Error searching libraries:', error);
                showToast('Error', 'Failed to search libraries', 'danger');
            });
    }
    
    // Install a library
    function installLibrary(library) {
        fetch('/api/libraries/install', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ library })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Library Installed', `Successfully installed ${library}`, 'success');
                
                // Add terminal output
                terminal.write(`\r\n$ pio lib install "${library}"\r\n`);
                terminal.write(`${data.output}\r\n$ `);
                
                // Switch to terminal tab
                document.querySelector('[data-target="terminal"]').click();
            }
        })
        .catch(error => {
            console.error('Error installing library:', error);
            showToast('Error', `Failed to install ${library}`, 'danger');
        });
    }
    
    // Run PlatformIO command
    function runCommand(type, command) {
        // First save the current file
        if (activeFile && editor) {
            const content = editor.getValue();
            
            fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: activeFile,
                    content: content
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // After saving, run the command
                    executeCommand(type, command);
                }
            })
            .catch(error => {
                console.error('Error saving file:', error);
                showToast('Error', 'Failed to save file before running command', 'danger');
            });
        } else {
            executeCommand(type, command);
        }
    }
    
    // Execute PlatformIO command
    function executeCommand(type, command) {
        showToast('Running Command', command, 'info');
        
        fetch('/api/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Display output in terminal
                terminal.write(`\r\n$ ${command}\r\n`);
                terminal.write(`${data.output}\r\n$ `);
                
                showToast('Command Completed', `${type.charAt(0).toUpperCase() + type.slice(1)} successful`, 'success');
                
                // Switch to terminal tab
                document.querySelector('[data-target="terminal"]').click();
            } else {
                showToast('Command Failed', data.output, 'danger');
            }
        })
        .catch(error => {
            console.error('Error running command:', error);
            showToast('Error', `Failed to run ${type} command`, 'danger');
        });
    }
    
    // Display a toast notification
    function showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast toast-notification mb-2 border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        const iconClass = {
            'success': 'fa-check-circle text-success',
            'info': 'fa-info-circle text-info',
            'warning': 'fa-exclamation-triangle text-warning',
            'danger': 'fa-exclamation-circle text-danger'
        };
        
        toast.innerHTML = `
            <div class="toast-header">
                <i class="fas ${iconClass[type]} me-2"></i>
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 5000
        });
        
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', function () {
            toast.remove();
        });
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (editor) {
            editor.layout();
        }
    });
});
