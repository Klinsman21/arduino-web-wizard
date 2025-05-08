
// Global variables
let editor;
let terminal;
let currentFile = null;
let projectOpen = false;
let serialConnected = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initMonacoEditor();
    initTerminal();
    initTabSystem();
    initProjectExplorer();
    initLibraryManager();
    initSerialMonitor();
    initActionButtons();
});

// Initialize Monaco Editor
function initMonacoEditor() {
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.0/min/vs' }});
    require(['vs/editor/editor.main'], function() {
        editor = monaco.editor.create(document.getElementById('monaco-editor'), {
            value: '// Select a file to begin editing',
            language: 'cpp',
            theme: 'vs-dark',
            automaticLayout: true
        });
    });
}

// Initialize XTerm.js terminal
function initTerminal() {
    terminal = new Terminal({
        theme: {
            background: '#000000',
            foreground: '#ffffff'
        },
        cursorBlink: true
    });
    terminal.open(document.getElementById('terminal'));
    terminal.writeln("Arduino Web Wizard initialized.");
    terminal.writeln("Ready for commands...");
}

// Tab system
function initTabSystem() {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all tabs
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(
                content => content.style.display = 'none'
            );
            
            // Activate selected tab
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).style.display = 'flex';
            
            // Special case for Monitor button
            if (tab.dataset.tab === 'serial') {
                updateSerialPorts();
            }
        });
    });
}

// Project Explorer
function initProjectExplorer() {
    const openProjectBtn = document.getElementById('openProjectBtn');
    const projectFiles = document.getElementById('projectFiles');
    const filesList = document.getElementById('filesList');

    openProjectBtn.addEventListener('click', () => {
        fetch('/api/project/open', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                projectOpen = true;
                projectFiles.classList.remove('hidden');
                showToast("Project opened", data.message);
                
                // Get project files
                fetch('/api/projects/files')
                    .then(response => response.json())
                    .then(files => {
                        filesList.innerHTML = '';
                        files.forEach(file => {
                            const li = document.createElement('li');
                            li.textContent = file;
                            li.addEventListener('click', () => {
                                openFile(file);
                                
                                // Set active class
                                document.querySelectorAll('#filesList li').forEach(
                                    item => item.classList.remove('active')
                                );
                                li.classList.add('active');
                            });
                            filesList.appendChild(li);
                        });
                    });
            }
        })
        .catch(error => {
            console.error('Error opening project:', error);
            showToast("Error", "Failed to open project");
        });
    });
}

// Library Manager
function initLibraryManager() {
    const toggleLibraryBtn = document.getElementById('toggleLibraryBtn');
    const libraryManager = document.getElementById('libraryManager');
    const expandIcon = document.getElementById('libraryExpandIcon');
    const collapseIcon = document.getElementById('libraryCollapseIcon');
    const librarySearch = document.getElementById('librarySearch');
    const libraryResults = document.getElementById('libraryResults');

    toggleLibraryBtn.addEventListener('click', () => {
        if (libraryManager.classList.contains('hidden')) {
            libraryManager.classList.remove('hidden');
            expandIcon.classList.add('hidden');
            collapseIcon.classList.remove('hidden');
        } else {
            libraryManager.classList.add('hidden');
            expandIcon.classList.remove('hidden');
            collapseIcon.classList.add('hidden');
        }
    });

    librarySearch.addEventListener('input', debounce(() => {
        const query = librarySearch.value;
        if (query.length > 0) {
            fetch(`/api/libraries/search?q=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(libraries => {
                    libraryResults.innerHTML = '';
                    libraries.forEach(lib => {
                        const li = document.createElement('li');
                        li.className = 'library-item';
                        
                        const span = document.createElement('span');
                        span.textContent = lib;
                        li.appendChild(span);
                        
                        const button = document.createElement('button');
                        button.className = 'install-lib-btn';
                        button.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        `;
                        button.addEventListener('click', () => installLibrary(lib));
                        li.appendChild(button);
                        
                        libraryResults.appendChild(li);
                    });
                });
        } else {
            libraryResults.innerHTML = '';
        }
    }, 300));
}

// Serial Monitor
function initSerialMonitor() {
    const connectBtn = document.getElementById('connectBtn');
    const baudRateBtn = document.getElementById('baudRateBtn');
    const serialPortSelect = document.getElementById('serialPort');
    const serialOutput = document.getElementById('serialOutput');

    // Populate serial ports dropdown
    updateSerialPorts();
    
    serialPortSelect.addEventListener('change', () => {
        connectBtn.disabled = !serialPortSelect.value;
        baudRateBtn.disabled = !serialPortSelect.value;
    });

    connectBtn.addEventListener('click', () => {
        if (serialConnected) {
            serialConnected = false;
            connectBtn.textContent = "Connect";
            serialOutput.textContent = "Disconnected from port";
        } else {
            const port = serialPortSelect.value;
            if (port) {
                serialConnected = true;
                connectBtn.textContent = "Disconnect";
                serialOutput.textContent = `Connected to ${port}\nWaiting for data...`;
                showToast("Serial Monitor", `Connected to ${port}`);

                // In a real implementation, this would actually connect to the serial port
            }
        }
    });
}

function updateSerialPorts() {
    const serialPortSelect = document.getElementById('serialPort');
    fetch('/api/ports')
        .then(response => response.json())
        .then(ports => {
            // Save current selected value
            const currentValue = serialPortSelect.value;
            
            // Clear and rebuild options
            serialPortSelect.innerHTML = '<option value="">Select a port</option>';
            
            ports.forEach(port => {
                const option = document.createElement('option');
                option.value = port;
                option.textContent = port;
                serialPortSelect.appendChild(option);
            });
            
            // Restore selected value if it exists in the new list
            if (ports.includes(currentValue)) {
                serialPortSelect.value = currentValue;
            }
            
            // Update button state
            document.getElementById('connectBtn').disabled = !serialPortSelect.value;
            document.getElementById('baudRateBtn').disabled = !serialPortSelect.value;
        })
        .catch(error => {
            console.error('Error fetching serial ports:', error);
        });
}

// Action Buttons
function initActionButtons() {
    const compileBtn = document.getElementById('compileBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const monitorBtn = document.getElementById('monitorBtn');
    const updateBtn = document.getElementById('updateBtn');
    const refreshTerminal = document.getElementById('refreshTerminal');

    compileBtn.addEventListener('click', () => {
        runCommand('pio run -t compile');
    });

    uploadBtn.addEventListener('click', () => {
        runCommand('pio run -t upload');
    });

    monitorBtn.addEventListener('click', () => {
        // Switch to serial monitor tab
        document.querySelector('.tab-button[data-tab="serial"]').click();
    });

    updateBtn.addEventListener('click', () => {
        runCommand('pio lib update');
    });

    refreshTerminal.addEventListener('click', () => {
        terminal.clear();
        terminal.writeln("Terminal cleared.");
        terminal.writeln("Ready for commands...");
    });
}

// Helper Functions
function openFile(filename) {
    currentFile = filename;
    document.getElementById('current-file').textContent = filename;

    fetch(`/api/file/${encodeURIComponent(filename)}`)
        .then(response => response.json())
        .then(data => {
            const fileExtension = filename.split('.').pop().toLowerCase();
            let language = 'plaintext';
            
            // Set language for syntax highlighting
            if (['cpp', 'h', 'c', 'ino'].includes(fileExtension)) {
                language = 'cpp';
            } else if (fileExtension === 'py') {
                language = 'python';
            } else if (fileExtension === 'json') {
                language = 'json';
            } else if (fileExtension === 'md') {
                language = 'markdown';
            }
            
            // Update editor model
            if (editor) {
                const model = editor.getModel();
                monaco.editor.setModelLanguage(model, language);
                editor.setValue(data.content);
            }
        })
        .catch(error => {
            console.error(`Error opening file ${filename}:`, error);
            showToast("Error", `Failed to open file ${filename}`);
        });
}

function saveCurrentFile() {
    if (!currentFile) return;
    
    const content = editor.getValue();
    fetch('/api/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename: currentFile,
            content: content
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast("File saved", `${currentFile} saved successfully`);
        }
    })
    .catch(error => {
        console.error(`Error saving file ${currentFile}:`, error);
        showToast("Error", `Failed to save file ${currentFile}`);
    });
}

function runCommand(command) {
    terminal.writeln(`$ ${command}`);
    terminal.writeln("Executing...");
    
    // Show the terminal tab
    document.querySelector('.tab-button[data-tab="terminal"]').click();
    
    fetch('/api/run', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            command: command
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            terminal.writeln(data.output);
            showToast("Command executed", command);
        } else {
            terminal.writeln(`Error: ${data.output}`);
            showToast("Command failed", command);
        }
    })
    .catch(error => {
        console.error(`Error executing command ${command}:`, error);
        terminal.writeln(`Error: Failed to execute command`);
        showToast("Error", `Failed to execute command ${command}`);
    });
}

function installLibrary(library) {
    runCommand(`pio lib install "${library}"`);
    showToast("Installing library", library);
}

function showToast(title, message) {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const content = document.createElement('div');
    
    const titleEl = document.createElement('div');
    titleEl.className = 'toast-title';
    titleEl.textContent = title;
    content.appendChild(titleEl);
    
    if (message) {
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        content.appendChild(messageEl);
    }
    
    toast.appendChild(content);
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });
    toast.appendChild(closeBtn);
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Utility function to debounce user input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl+S to save
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (currentFile) {
            saveCurrentFile();
        }
    }
});
