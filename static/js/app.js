
// Global variables
let editor;
let terminal;
let currentFile = null;
let serialPort = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeMonacoEditor();
    initializeTerminal();
    loadSerialPorts();
    setupEventListeners();
    fetchProjectFiles();
});

// Initialize tab switching
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deactivate all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');
            
            // Activate selected tab
            button.classList.add('active');
            const target = button.getAttribute('data-target');
            document.getElementById(target).style.display = 'flex';
        });
    });
}

// Initialize Monaco Editor
function initializeMonacoEditor() {
    require(['vs/editor/editor.main'], function() {
        editor = monaco.editor.create(document.getElementById('monaco-editor'), {
            value: '// Open a file to start editing',
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
    terminal.writeln('Arduino Web Wizard Terminal');
    terminal.writeln('Ready to execute PlatformIO commands');
    terminal.writeln('');
}

// Setup Event Listeners
function setupEventListeners() {
    // Open Project Button
    document.getElementById('openProjectBtn').addEventListener('click', openProject);
    
    // Compile Button
    document.getElementById('compileBtn').addEventListener('click', () => {
        runPlatformIOCommand('pio run');
    });
    
    // Upload Button
    document.getElementById('uploadBtn').addEventListener('click', () => {
        const port = document.getElementById('serialPortSelect').value;
        if (!port) {
            showToast('Error', 'Please select a serial port', 'error');
            return;
        }
        runPlatformIOCommand(`pio run --target upload --upload-port ${port}`);
    });
    
    // Library Search
    document.getElementById('searchLibBtn').addEventListener('click', searchLibraries);
    document.getElementById('librarySearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchLibraries();
    });
    
    // Serial Send Button
    document.getElementById('serialSendBtn').addEventListener('click', sendSerialData);
    document.getElementById('serialInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendSerialData();
    });

    // Save file shortcut (Ctrl+S)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (currentFile) {
                saveCurrentFile();
            }
        }
    });
}

// Fetch project files
function fetchProjectFiles() {
    fetch('/api/projects/files')
        .then(response => response.json())
        .then(files => {
            const filesList = document.getElementById('filesList');
            filesList.innerHTML = '';
            
            files.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file;
                li.addEventListener('click', () => openFile(file));
                filesList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error fetching project files:', error);
            showToast('Error', 'Failed to load project files', 'error');
        });
}

// Open file
function openFile(filename) {
    // Mark file as active in the list
    const fileItems = document.querySelectorAll('#filesList li');
    fileItems.forEach(item => {
        item.classList.remove('active');
        if (item.textContent === filename) {
            item.classList.add('active');
        }
    });
    
    // Fetch file content
    fetch(`/api/file/${filename}`)
        .then(response => response.json())
        .then(data => {
            currentFile = filename;
            
            // Determine language based on file extension
            let language = 'plaintext';
            if (filename.endsWith('.cpp') || filename.endsWith('.h') || filename.endsWith('.ino')) {
                language = 'cpp';
            } else if (filename.endsWith('.py')) {
                language = 'python';
            } else if (filename.endsWith('.ini')) {
                language = 'ini';
            } else if (filename.endsWith('.json')) {
                language = 'json';
            }
            
            // Update editor
            monaco.editor.setModelLanguage(editor.getModel(), language);
            editor.setValue(data.content);
        })
        .catch(error => {
            console.error('Error opening file:', error);
            showToast('Error', `Failed to open ${filename}`, 'error');
        });
}

// Save current file
function saveCurrentFile() {
    if (!currentFile) {
        showToast('Error', 'No file is currently open', 'error');
        return;
    }
    
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
            showToast('Success', data.message, 'success');
        } else {
            showToast('Error', data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error saving file:', error);
        showToast('Error', 'Failed to save file', 'error');
    });
}

// Run PlatformIO command
function runPlatformIOCommand(command) {
    // Display command in terminal
    terminal.writeln(`$ ${command}`);
    terminal.writeln('Executing...');
    
    // Show terminal tab
    document.querySelector('.tab-button[data-target="terminal"]').click();
    
    // Send command to server
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
            terminal.writeln(data.output);
            showToast('Success', 'Command executed successfully', 'success');
        } else {
            terminal.writeln(`Error: ${data.output}`);
            showToast('Error', 'Command execution failed', 'error');
        }
    })
    .catch(error => {
        console.error('Error executing command:', error);
        terminal.writeln('Error: Failed to execute command');
        showToast('Error', 'Failed to execute command', 'error');
    });
}

// Search libraries
function searchLibraries() {
    const query = document.getElementById('librarySearch').value;
    if (!query) return;
    
    fetch(`/api/libraries/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(libraries => {
            const resultsContainer = document.getElementById('libraryResults');
            resultsContainer.innerHTML = '';
            
            if (libraries.length === 0) {
                resultsContainer.innerHTML = '<p>No libraries found</p>';
                return;
            }
            
            libraries.forEach(lib => {
                const div = document.createElement('div');
                div.className = 'library-item flex justify-between items-center mb-1';
                div.innerHTML = `
                    <span>${lib}</span>
                    <button class="install-lib-btn" data-lib="${lib}" title="Install Library">
                        +
                    </button>
                `;
                resultsContainer.appendChild(div);
                
                // Add install button event
                div.querySelector('.install-lib-btn').addEventListener('click', () => {
                    installLibrary(lib);
                });
            });
        })
        .catch(error => {
            console.error('Error searching libraries:', error);
            showToast('Error', 'Failed to search libraries', 'error');
        });
}

// Install library
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
            showToast('Success', data.message, 'success');
            terminal.writeln(data.output);
        } else {
            showToast('Error', data.message, 'error');
            terminal.writeln(`Error: ${data.output}`);
        }
    })
    .catch(error => {
        console.error('Error installing library:', error);
        showToast('Error', 'Failed to install library', 'error');
    });
}

// Load serial ports
function loadSerialPorts() {
    fetch('/api/ports')
        .then(response => response.json())
        .then(ports => {
            const portSelect = document.getElementById('serialPortSelect');
            portSelect.innerHTML = '<option value="">Select Port</option>';
            
            ports.forEach(port => {
                const option = document.createElement('option');
                option.value = port;
                option.textContent = port;
                portSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading serial ports:', error);
            showToast('Error', 'Failed to load serial ports', 'error');
        });
}

// Open project
function openProject() {
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
            showToast('Success', data.message, 'success');
            fetchProjectFiles();
        } else {
            showToast('Error', data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error opening project:', error);
        showToast('Error', 'Failed to open project', 'error');
    });
}

// Send serial data
function sendSerialData() {
    const input = document.getElementById('serialInput');
    const data = input.value;
    if (!data) return;
    
    // In a real implementation, this would send data to the selected serial port
    const serialOutput = document.getElementById('serialOutput');
    serialOutput.innerHTML += `<div class="text-blue-500">&gt; ${data}</div>`;
    input.value = '';
    
    // Auto-scroll to bottom
    serialOutput.scrollTop = serialOutput.scrollHeight;
}

// Show toast notification
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    
    // Set classes based on type
    let borderColor = 'border-blue-500';
    if (type === 'success') borderColor = 'border-green-500';
    if (type === 'error') borderColor = 'border-red-500';
    
    toast.className = `toast ${borderColor}`;
    toast.innerHTML = `
        <div>
            <div class="toast-title">${title}</div>
            <div>${message}</div>
        </div>
        <span class="toast-close">&times;</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Add close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}
