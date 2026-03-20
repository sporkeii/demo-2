// ============================================
// RESIDENT EVIL BIRTHDAY ESCAPE - ENHANCED
// With Proper Flow, Gating, and Progression
// ============================================

// Game State with Progression Gates
const gameState = {
    // Progression tracking
    currentPhase: 0, // 0: Start, 1: Keycard found, 2: Terminal unlocked, 3: First puzzle solved, 4: Second puzzle solved, 5: Victory
    completedSteps: [],
    
    // Inventory and items
    inventory: [],
    foundItems: [],
    usedItems: [],
    
    // Puzzle states
    solvedPuzzles: [],
    puzzleAttempts: {},
    
    // Stats
    virusLevel: 0,
    hintsRemaining: 3,
    hintsUsed: 0,
    startTime: null,
    
    // Flags
    isGameWon: false,
    terminalUnlocked: false,
    deskExamined: false,
    doorChecked: false,
    cabinetSearched: false,
    floorInspected: false
};

// Progression milestones
const PHASES = {
    START: 0,
    KEYCARD_FOUND: 1,
    TERMINAL_UNLOCKED: 2,
    PASSWORD_SOLVED: 3,
    CIPHER_SOLVED: 4,
    VICTORY: 5
};

// Sound Effects
const sounds = {
    playTyping() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            osc.type = 'square';
            gain.gain.value = 0.05;
            osc.start();
            setTimeout(() => osc.stop(), 50);
        } catch(e) {}
    },
    
    playDoorCreak() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 200;
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
            osc.start();
            setTimeout(() => osc.stop(), 1000);
        } catch(e) {}
    },
    
    playError() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 100;
            osc.type = 'square';
            gain.gain.value = 0.15;
            osc.start();
            setTimeout(() => osc.stop(), 200);
        } catch(e) {}
    },
    
    playSuccess() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            [400, 500, 600].forEach((freq, i) => {
                setTimeout(() => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = freq;
                    gain.gain.value = 0.1;
                    osc.start();
                    setTimeout(() => osc.stop(), 100);
                }, i * 100);
            });
        } catch(e) {}
    },
    
    playNotification() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 600;
            osc.type = 'sine';
            gain.gain.value = 0.1;
            osc.start();
            setTimeout(() => osc.stop(), 150);
        } catch(e) {}
    }
};

// Initialize Game
document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    setupEventListeners();
});

function setupEventListeners() {
    // Start button
    document.getElementById('start-btn').addEventListener('click', () => {
        sounds.playDoorCreak();
        switchScreen('warning-screen', 'game-screen');
        initGame();
    });
    
    // Terminal input
    const terminalInput = document.getElementById('terminal-input');
    terminalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !terminalInput.disabled) {
            handleCommand(terminalInput.value);
            terminalInput.value = '';
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keypress', (e) => {
        if (!isInputFocused()) {
            if (e.key === 'h') showHelp();
            if (e.key === 's') saveGame();
        }
    });
}

function initGame() {
    gameState.startTime = Date.now();
    printToTerminal(`
<span class="text-red">╔════════════════════════════════════════════╗</span>
<span class="text-red">║   SYSTEM BOOT - BIRTHDAY PROTOCOL v2.4    ║</span>
<span class="text-red">╚════════════════════════════════════════════╝</span>

<p class="text-yellow">Initializing biometric scanner...</p>
<p class="text-green">✓ Identity confirmed</p>
<p class="text-yellow">Loading containment protocols...</p>
<p class="text-red">⚠ WARNING: T-Virus detected in subject</p>
<p class="text-dim">Infection rate: Accelerating</p>

<p>You look around the sterile laboratory.</p>
<p>The room is small, maybe 15x15 feet.</p>
<p>There's a desk with this terminal, a locked door,</p>
<p>a filing cabinet, and various equipment scattered about.</p>

<p class="text-yellow">The terminal screen blinks a message:</p>
<p class="text-green">"To escape, you must solve the mysteries hidden here."</p>

<p class="text-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
<p class="text-yellow">OBJECTIVE: Explore the room using the interaction buttons →</p>
<p class="text-dim">The terminal is currently LOCKED. You need to find a way in...</p>
    `);
    
    updateObjective('Search the room for clues');
    startVirusTimer();
    updateProgress();
}

// ============================================
// ROOM INTERACTIONS (Main Puzzle Flow)
// ============================================

function interactDesk() {
    const btn = document.getElementById('desk-btn');
    sounds.playTyping();
    
    if (gameState.deskExamined) {
        showNotification('You already examined the desk thoroughly.');
        return;
    }
    
    gameState.deskExamined = true;
    btn.classList.add('completed');
    
    printToTerminal(`
<p class="text-yellow">&gt; EXAMINING DESK...</p>
<p>You carefully search the desk drawers.</p>
<p>Most are empty, but one drawer is jammed.</p>
<p>You pull harder...</p>
<p class="text-green">CRACK!</p>
<p>The drawer opens. Inside you find:</p>
<p class="text-yellow">→ A dusty journal with torn pages</p>
<p class="text-yellow">→ Some scattered research notes</p>

<p class="text-dim">The journal might have clues... but you need terminal access to read files properly.</p>
    `);
    
    addToInventory('journal', 'Research Journal', 'A worn journal with cryptic entries. Might contain clues.');
    updateProgress();
}

function interactDoor() {
    const btn = document.getElementById('door-btn');
    sounds.playError();
    
    if (gameState.doorChecked) {
        if (gameState.currentPhase >= PHASES.CIPHER_SOLVED) {
            printToTerminal(`
<p class="text-green">&gt; DOOR UNLOCKING...</p>
<p>You hear mechanical locks disengaging.</p>
<p>The heavy door swings open.</p>
<p class="text-yellow">Freedom awaits...</p>
            `);
            // Victory will be triggered by cipher puzzle
        } else {
            showNotification('The door remains locked. You need to solve all puzzles.');
        }
        return;
    }
    
    gameState.doorChecked = true;
    btn.classList.add('completed');
    
    printToTerminal(`
<p class="text-yellow">&gt; CHECKING DOOR...</p>
<p>You approach the heavy metal door.</p>
<p>It's sealed shut with an electronic lock.</p>
<p>A small display reads: <span class="text-red">"CONTAINMENT ACTIVE"</span></p>
<p>There's a keypad, but it's dark and unresponsive.</p>

<p class="text-dim">You'll need to solve the laboratory's puzzles to escape.</p>
    `);
    
    increaseVirus(2);
    updateProgress();
}

function interactCabinet() {
    const btn = document.getElementById('cabinet-btn');
    sounds.playTyping();
    
    if (gameState.cabinetSearched) {
        showNotification('The cabinet is empty now.');
        return;
    }
    
    if (!gameState.deskExamined) {
        printToTerminal(`
<p class="text-yellow">&gt; SEARCHING CABINET...</p>
<p>The filing cabinet is locked.</p>
<p class="text-dim">Maybe there's a key somewhere else...</p>
        `);
        showNotification('Try examining other areas first.');
        return;
    }
    
    gameState.cabinetSearched = true;
    btn.classList.add('completed');
    
    printToTerminal(`
<p class="text-yellow">&gt; SEARCHING CABINET...</p>
<p>Using a paperclip from the desk, you pick the lock.</p>
<p class="text-green">CLICK!</p>
<p>Inside you find:</p>
<p class="text-yellow">→ Lab Safety Protocols (useless)</p>
<p class="text-yellow">→ Someone's lunch (very old)</p>
<p class="text-yellow">→ A sticky note that says "PASSWORD HINT: Look at the DATES"</p>

<p class="text-green">Added sticky note to inventory!</p>
    `);
    
    addToInventory('sticky-note', 'Sticky Note', 'Says: "PASSWORD HINT: Look at the DATES"');
    updateProgress();
}

function interactFloor() {
    const btn = document.getElementById('floor-btn');
    sounds.playSuccess();
    
    if (gameState.floorInspected) {
        showNotification('You already found everything here.');
        return;
    }
    
    gameState.floorInspected = true;
    btn.classList.add('completed');
    
    printToTerminal(`
<p class="text-yellow">&gt; INSPECTING FLOOR...</p>
<p>You get on your hands and knees.</p>
<p>Under a desk leg, you spot something metallic...</p>
<p class="text-green">A SECURITY KEYCARD!</p>
<p>It's slightly bent but looks functional.</p>
<p>The card reads: <span class="text-yellow">"DR. WESKER - LEVEL 3 ACCESS"</span></p>

<p class="text-green">✓ KEYCARD added to inventory!</p>
<p class="text-yellow">Maybe you can use this on the terminal...</p>
    `);
    
    addToInventory('keycard', 'Security Keycard', 'Dr. Wesker\'s Level 3 access card. Opens terminal systems.');
    advancePhase(PHASES.KEYCARD_FOUND);
    updateObjective('Use the keycard on the terminal');
    showNotification('NEW OBJECTIVE: Check your inventory and use the keycard!');
}

// ============================================
// TERMINAL COMMANDS SYSTEM
// ============================================

function handleCommand(input) {
    if (!gameState.terminalUnlocked) {
        printToTerminal(`<p class="text-red">✗ TERMINAL LOCKED - ACCESS DENIED</p>`);
        sounds.playError();
        showNotification('Find a way to unlock the terminal first!');
        return;
    }
    
    const output = document.getElementById('terminal-output');
    sounds.playTyping();
    
    output.innerHTML += `\n<p class="text-green">&gt; ${input}</p>`;
    
    const parts = input.trim().toLowerCase().split(' ');
    const command = parts[0];
    const args = parts.slice(1);
    
    let response = '';
    
    // Command routing
    if (command === 'help') response = commandHelp();
    else if (command === 'ls' || command === 'dir') response = commandList();
    else if (command === 'read' || command === 'cat') response = commandRead(args);
    else if (command === 'use') response = commandUse(args);
    else if (command === 'inventory' || command === 'inv') response = commandInventory();
    else if (command === 'solve') response = commandSolve(args);
    else if (command === 'status') response = commandStatus();
    else if (command === 'clear' || command === 'cls') {
        output.innerHTML = '';
        return;
    }
    else if (input.trim() === '') {
        return;
    }
    else {
        response = `<span class="text-red">Unknown command: ${command}</span>\n<span class="text-dim">Type 'help' for available commands</span>`;
        sounds.playError();
    }
    
    if (response) {
        output.innerHTML += `<p>${response}</p>`;
    }
    
    output.scrollTop = output.scrollHeight;
}

function commandHelp() {
    return `
<span class="text-yellow">═══════════ AVAILABLE COMMANDS ═══════════</span>

<span class="text-green">BASIC:</span>
  help          - Show this help menu
  status        - Show your current progress
  clear         - Clear terminal screen
  
<span class="text-green">FILES:</span>
  ls            - List available files
  read [file]   - Read a file (e.g., read log.txt)
  
<span class="text-green">ITEMS:</span>
  inventory     - Show your items
  use [item]    - Use an item from inventory
  
<span class="text-green">PUZZLES:</span>
  solve [name]  - Start a puzzle (password, cipher)

<span class="text-yellow">TIPS:</span>
  • Explore the room using the interaction buttons
  • Read files carefully for clues
  • Items can be combined or used
  • The virus meter is increasing...
  • Save your progress often!
    `;
}

function commandList() {
    const files = ['welcome.txt', 'system_log.txt'];
    
    if (gameState.currentPhase >= PHASES.KEYCARD_FOUND) {
        files.push('research_notes.txt');
    }
    
    if (gameState.currentPhase >= PHASES.TERMINAL_UNLOCKED) {
        files.push('lab_experiment.txt');
    }
    
    if (gameState.currentPhase >= PHASES.PASSWORD_SOLVED) {
        files.push('encrypted_message.dat', 'final_protocol.txt');
    }
    
    return `
<span class="text-yellow">FILES IN SYSTEM:</span>
${files.map(f => `  <span class="text-green">→</span> ${f}`).join('\n')}

<span class="text-dim">Use 'read [filename]' to view files</span>
    `;
}

function commandRead(args) {
    if (!args || args.length === 0) {
        return '<span class="text-red">ERROR: Specify a file to read</span>';
    }
    
    const filename = args.join(' ');
    return readFile(filename);
}

function commandUse(args) {
    if (!args || args.length === 0) {
        return '<span class="text-red">ERROR: Specify an item to use</span>';
    }
    
    const itemName = args.join(' ').toLowerCase();
    
    if (itemName.includes('keycard') || itemName.includes('card')) {
        if (gameState.terminalUnlocked) {
            return '<span class="text-yellow">Terminal already unlocked!</span>';
        }
        return unlockTerminal();
    }
    
    if (itemName.includes('journal')) {
        return '<span class="text-dim">The journal is old and cryptic. Read the lab files to understand it better.</span>';
    }
    
    return `<span class="text-red">You can't use that right now.</span>`;
}

function commandInventory() {
    if (gameState.inventory.length === 0) {
        return '<span class="text-dim">Your inventory is empty.</span>';
    }
    
    return `
<span class="text-yellow">INVENTORY:</span>
${gameState.inventory.map((item, i) => `  ${i + 1}. <span class="text-green">${item.name}</span> - ${item.description}`).join('\n')}
    `;
}

function commandSolve(args) {
    if (!args || args.length === 0) {
        return '<span class="text-red">ERROR: Specify puzzle name (password, cipher)</span>';
    }
    
    const puzzleName = args[0].toLowerCase();
    
    if (puzzleName === 'password') {
        if (gameState.currentPhase < PHASES.TERMINAL_UNLOCKED) {
            return '<span class="text-red">You need to unlock the terminal first!</span>';
        }
        if (gameState.solvedPuzzles.includes('password')) {
            return '<span class="text-yellow">You already solved this puzzle!</span>';
        }
        showPasswordPuzzle();
        return '<span class="text-yellow">Opening password puzzle...</span>';
    }
    
    if (puzzleName === 'cipher') {
        if (gameState.currentPhase < PHASES.PASSWORD_SOLVED) {
            return '<span class="text-red">Solve the password puzzle first!</span>';
        }
        if (gameState.solvedPuzzles.includes('cipher')) {
            return '<span class="text-yellow">You already solved this puzzle!</span>';
        }
        showCipherPuzzle();
        return '<span class="text-yellow">Opening cipher puzzle...</span>';
    }
    
    return `<span class="text-red">Unknown puzzle: ${puzzleName}</span>`;
}

function commandStatus() {
    const phaseNames = ['Just Started', 'Keycard Found', 'Terminal Unlocked', 'Password Solved', 'Cipher Solved', 'Escaped!'];
    return `
<span class="text-yellow">═══════════ STATUS ═══════════</span>
Progress: ${phaseNames[gameState.currentPhase]}
Puzzles Solved: ${gameState.solvedPuzzles.length}/2
Items Found: ${gameState.inventory.length}
Virus Level: ${gameState.virusLevel}%
Hints Remaining: ${gameState.hintsRemaining}
    `;
}

// ============================================
// FILE READING SYSTEM
// ============================================

function readFile(filename) {
    const files = {
        'welcome.txt': `
<span class="text-green">╔══════════════════════════════════════╗</span>
<span class="text-green">║   WELCOME TO YOUR BIRTHDAY ESCAPE    ║</span>
<span class="text-green">╚══════════════════════════════════════╝</span>

Dear Subject,

You've been infected with the T-Virus.
The only cure? Solving the puzzles in this lab.

Your survival depends on your wits.
Search the room. Find the clues.
Unlock the terminal. Solve the mysteries.

The clock is ticking. The virus is spreading.

Good luck.

<span class="text-dim">- Dr. W.</span>
        `,
        
        'system_log.txt': `
<span class="text-yellow">SYSTEM LOG - SECTOR 7 LABORATORY</span>
═══════════════════════════════════════

[08:47] System boot complete
[09:12] Dr. Wesker logged in
[09:45] Experiment #471 initiated
[10:30] Subject shows unusual resistance
[11:15] Dr. Wesker logged out
[11:47] EMERGENCY: Containment breach detected
[12:00] Automatic lockdown engaged
[12:15] T-Virus exposure detected

<span class="text-red">CURRENT STATUS: CONTAINMENT ACTIVE</span>
<span class="text-yellow">NOTE: Password required for Level 4 access</span>
        `,
        
        'research_notes.txt': `
<span class="text-yellow">DR. WESKER'S RESEARCH NOTES</span>
═══════════════════════════════════════

<span class="text-dim">These notes are scattered and hard to read...</span>

"...experiment showing promising results..."
"...Day 29 - mutation accelerating..."
"...Day 25 - need to adjust dosage..."
"...Day 18 - subject remarkably stable..."
"...Day 04 - initial injection successful..."

<span class="text-green">IMPORTANT NOTE:</span>
Password hint: The most significant days,
in descending order, first four digits.

<span class="text-dim">What could that mean?</span>
        `,
        
        'lab_experiment.txt': `
<span class="text-yellow">EXPERIMENT LOG #471</span>
═══════════════════════════════════════

Subject: Birthday Protocol Test Subject
Virus Strain: T-Virus (Modified)
Objective: Test cognitive function under stress

<span class="text-green">EXPERIMENT PARAMETERS:</span>
- Subject must solve sequential puzzles
- Virus simulation increases pressure
- Success = escape and birthday gift
- Failure = ...well, let's not think about that

<span class="text-red">WARNING:</span> The password is hidden in the
research notes. Look for the pattern in the days.

<span class="text-dim">Hint: 29, 25, 18, 04... what order?</span>
        `,
        
        'encrypted_message.dat': `
<span class="text-red">╔════════════════════════════════════╗</span>
<span class="text-red">║  ENCRYPTED MESSAGE - DECRYPTING   ║</span>
<span class="text-red">╚════════════════════════════════════╝</span>

<span class="text-green">✓ PASSWORD ACCEPTED - DECRYPTION COMPLETE</span>

Congratulations! You've proven your worth.
But there's one final test...

The birthday vault contains your gift.
To open it, you must decode the cipher.

Type 'solve cipher' when you're ready.

The final piece of the puzzle awaits...

<span class="text-yellow">P.S. - You're doing great! Almost there!</span>
        `,
        
        'final_protocol.txt': `
<span class="text-yellow">FINAL BIRTHDAY PROTOCOL</span>
═══════════════════════════════════════

This is it. The last puzzle.

The cipher is a simple letter-to-number code.
A=1, B=2, C=3, and so on...

Decode the numbers to reveal the word.
The word is something you should be today.

Once you solve it, the vault opens.
Your birthday gift awaits.

<span class="text-green">Good luck, birthday survivor!</span>
        `
    };
    
    if (files[filename]) {
        // Check if file is gated
        if (filename === 'research_notes.txt' && gameState.currentPhase < PHASES.KEYCARD_FOUND) {
            return '<span class="text-red">ACCESS DENIED: File not found</span>';
        }
        if (filename === 'lab_experiment.txt' && gameState.currentPhase < PHASES.TERMINAL_UNLOCKED) {
            return '<span class="text-red">ACCESS DENIED: Insufficient clearance</span>';
        }
        if ((filename === 'encrypted_message.dat' || filename === 'final_protocol.txt') && gameState.currentPhase < PHASES.PASSWORD_SOLVED) {
            return '<span class="text-red">FILE ENCRYPTED: Solve the password puzzle first</span>';
        }
        
        return files[filename];
    }
    
    return `<span class="text-red">ERROR: File '${filename}' not found</span>`;
}

// ============================================
// PUZZLE SYSTEM
// ============================================

function showPasswordPuzzle() {
    const puzzleWindow = document.getElementById('puzzle-window');
    const puzzleTitle = document.getElementById('puzzle-title');
    const puzzleContent = document.getElementById('puzzle-content');
    
    puzzleTitle.textContent = 'FACILITY PASSWORD LOCK';
    puzzleContent.innerHTML = `
        <p class="text-yellow">Enter the 4-digit facility password:</p>
        <p class="text-dim">Hint: Check the research notes for day numbers</p>
        <p class="text-dim">Remember: "Most significant days, descending order, first four digits"</p>
        <br>
        <input type="text" id="password-input" class="puzzle-input" maxlength="4" placeholder="####">
        <br>
        <button class="puzzle-btn" onclick="checkPassword()">SUBMIT</button>
        <button class="puzzle-btn" onclick="closePuzzle()" style="background: #333;">CANCEL</button>
        <p id="password-feedback"></p>
    `;
    
    puzzleWindow.style.display = 'block';
    document.getElementById('password-input').focus();
}

function checkPassword() {
    const input = document.getElementById('password-input').value;
    const feedback = document.getElementById('password-feedback');
    
    // Answer: Days 29, 25, 18, 04 in descending = 2925
    const correctPassword = '2925';
    
    if (input === correctPassword) {
        sounds.playSuccess();
        feedback.innerHTML = '<p class="text-green">✓ ACCESS GRANTED! PASSWORD CORRECT!</p>';
        gameState.solvedPuzzles.push('password');
        advancePhase(PHASES.PASSWORD_SOLVED);
        
        setTimeout(() => {
            closePuzzle();
            printToTerminal(`
<p class="text-green">╔════════════════════════════════════╗</p>
<p class="text-green">║  PASSWORD ACCEPTED - LEVEL 4 ACCESS  ║</p>
<p class="text-green">╚════════════════════════════════════╝</p>

<span class="text-yellow">New files unlocked!</span>
Type 'ls' to see them, then read 'encrypted_message.dat'
            `);
            updateObjective('Read the encrypted files and prepare for the final puzzle');
            showNotification('PASSWORD SOLVED! New files available!');
        }, 1500);
    } else {
        sounds.playError();
        feedback.innerHTML = '<p class="text-red">✗ INCORRECT PASSWORD</p>';
        increaseVirus(10);
        triggerGlitch();
        
        if (!gameState.puzzleAttempts.password) gameState.puzzleAttempts.password = 0;
        gameState.puzzleAttempts.password++;
        
        if (gameState.puzzleAttempts.password >= 3) {
            feedback.innerHTML += '<p class="text-yellow">Hint: Days 29, 25, 18, 04 → 2925</p>';
        }
    }
}

function showCipherPuzzle() {
    const puzzleWindow = document.getElementById('puzzle-window');
    const puzzleTitle = document.getElementById('puzzle-title');
    const puzzleContent = document.getElementById('puzzle-content');
    
    puzzleTitle.textContent = '🎁 BIRTHDAY VAULT CIPHER';
    puzzleContent.innerHTML = `
        <p class="text-yellow">Decode the cipher to unlock your birthday gift:</p>
        <p class="text-dim">Letter-to-Number Code: A=1, B=2, C=3, etc.</p>
        <br>
        <div class="cipher-grid">
            <div class="cipher-cell">8</div>
            <div class="cipher-cell">1</div>
            <div class="cipher-cell">16</div>
            <div class="cipher-cell">16</div>
            <div class="cipher-cell">25</div>
        </div>
        <br>
        <p class="text-dim">What word do these numbers spell?</p>
        <input type="text" id="cipher-input" class="puzzle-input" placeholder="Enter decoded word">
        <br>
        <button class="puzzle-btn" onclick="checkCipher()">SUBMIT</button>
        <button class="puzzle-btn" onclick="closePuzzle()" style="background: #333;">CANCEL</button>
        <p id="cipher-feedback"></p>
    `;
    
    puzzleWindow.style.display = 'block';
    document.getElementById('cipher-input').focus();
}

function checkCipher() {
    const input = document.getElementById('cipher-input').value.toLowerCase();
    const feedback = document.getElementById('cipher-feedback');
    
    // 8=H, 1=A, 16=P, 16=P, 25=Y = HAPPY
    if (input === 'happy') {
        sounds.playSuccess();
        feedback.innerHTML = '<p class="text-green">✓ CIPHER DECODED! VAULT UNLOCKED!</p>';
        gameState.solvedPuzzles.push('cipher');
        advancePhase(PHASES.CIPHER_SOLVED);
        
        setTimeout(() => {
            gameState.isGameWon = true;
            closePuzzle();
            triggerVictory();
        }, 2000);
    } else {
        sounds.playError();
        feedback.innerHTML = '<p class="text-red">✗ INCORRECT DECODING</p>';
        increaseVirus(5);
        
        if (!gameState.puzzleAttempts.cipher) gameState.puzzleAttempts.cipher = 0;
        gameState.puzzleAttempts.cipher++;
        
        if (gameState.puzzleAttempts.cipher >= 3) {
            feedback.innerHTML += '<p class="text-yellow">Hint: H=8, A=1, P=16...</p>';
        }
    }
}

function closePuzzle() {
    document.getElementById('puzzle-window').style.display = 'none';
}

// ============================================
// TERMINAL UNLOCK SEQUENCE
// ============================================

function unlockTerminal() {
    if (gameState.terminalUnlocked) {
        return '<span class="text-yellow">Terminal already unlocked!</span>';
    }
    
    if (!gameState.inventory.find(item => item.id === 'keycard')) {
        return '<span class="text-red">You need the keycard first!</span>';
    }
    
    sounds.playSuccess();
    gameState.terminalUnlocked = true;
    document.getElementById('terminal-input').disabled = false;
    document.getElementById('terminal-status').textContent = '✓ UNLOCKED';
    document.getElementById('terminal-status').classList.add('unlocked');
    
    advancePhase(PHASES.TERMINAL_UNLOCKED);
    updateObjective('Read the lab files and find the password');
    showNotification('TERMINAL UNLOCKED! You can now use commands!');
    
    return `
<p class="text-green">╔════════════════════════════════════╗</p>
<p class="text-green">║  KEYCARD ACCEPTED - ACCESS GRANTED ║</p>
<p class="text-green">╚════════════════════════════════════╝</p>

<span class="text-yellow">✓ Terminal unlocked!</span>
<span class="text-yellow">✓ Command input enabled</span>
<span class="text-yellow">✓ File system accessible</span>

Type 'help' to see available commands.
Type 'ls' to list files.
Type 'read [filename]' to read files.

<span class="text-dim">Your first goal: Find the facility password...</span>
    `;
}

// ============================================
// INVENTORY SYSTEM
// ============================================

function addToInventory(id, name, description) {
    if (!gameState.inventory.find(item => item.id === id)) {
        gameState.inventory.push({ id, name, description });
        updateInventoryDisplay();
        document.getElementById('item-count').textContent = gameState.inventory.length;
        sounds.playNotification();
    }
}

function updateInventoryDisplay() {
    const inventoryEl = document.getElementById('inventory');
    
    if (gameState.inventory.length === 0) {
        inventoryEl.innerHTML = '<div class="inventory-empty">NO ITEMS</div>';
        return;
    }
    
    inventoryEl.innerHTML = gameState.inventory.map(item => `
        <div class="inventory-item ${gameState.usedItems.includes(item.id) ? 'used' : ''}" onclick="useItem('${item.id}')">
            <div class="item-name">${item.name}</div>
            <div class="item-desc">${item.description}</div>
        </div>
    `).join('');
}

function useItem(itemId) {
    if (itemId === 'keycard' && !gameState.terminalUnlocked) {
        printToTerminal(unlockTerminal());
        gameState.usedItems.push(itemId);
        updateInventoryDisplay();
    } else if (itemId === 'keycard') {
        showNotification('Terminal already unlocked!');
    } else {
        showNotification('This item has no direct use. Check the terminal for more info.');
    }
}

function toggleInventory() {
    // Inventory is always visible in this design
    showNotification('Inventory is displayed in the right panel.');
}

// ============================================
// PROGRESSION SYSTEM
// ============================================

function advancePhase(newPhase) {
    if (newPhase > gameState.currentPhase) {
        gameState.currentPhase = newPhase;
        updateProgress();
        saveGame();
    }
}

function updateProgress() {
    const progress = (gameState.currentPhase / PHASES.VICTORY) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('progress-text').textContent = `${gameState.currentPhase}/${PHASES.VICTORY}`;
}

function updateObjective(text) {
    document.getElementById('objective').textContent = 'OBJECTIVE: ' + text;
    gameState.objective = text;
}

// ============================================
// VIRUS SYSTEM
// ============================================

function startVirusTimer() {
    setInterval(() => {
        if (!gameState.isGameWon && gameState.virusLevel < 100) {
            increaseVirus(1);
        }
    }, 15000); // Every 15 seconds
}

function increaseVirus(amount) {
    gameState.virusLevel = Math.min(100, gameState.virusLevel + amount);
    
    const fill = document.getElementById('virus-fill');
    const percent = document.getElementById('virus-percent');
    const status = document.getElementById('virus-status');
    
    fill.style.width = gameState.virusLevel + '%';
    percent.textContent = gameState.virusLevel + '%';
    
    if (gameState.virusLevel >= 75) {
        status.textContent = 'CRITICAL';
        status.style.color = 'var(--text-red)';
    } else if (gameState.virusLevel >= 50) {
        status.textContent = 'ELEVATED';
        status.style.color = 'var(--text-yellow)';
    } else {
        status.textContent = 'STABLE';
    }
    
    if (gameState.virusLevel >= 100) {
        showFakeDeathScreen();
    } else if (gameState.virusLevel >= 75) {
        triggerGlitch();
    }
}

function showFakeDeathScreen() {
    printToTerminal(`
<span class="text-red">╔═══════════════════════════════════════╗</span>
<span class="text-red">║   SYSTEM FAILURE - VIRUS AT 100%     ║</span>
<span class="text-red">╚═══════════════════════════════════════╝</span>

<span class="text-red">T-VIRUS INFECTION: COMPLETE</span>

Just kidding! This is a birthday game, not a tragedy.
But you should probably solve those puzzles faster! 😉

<span class="text-yellow">Virus level reset to 60%. Keep going!</span>
    `);
    
    gameState.virusLevel = 60;
    updateVirusDisplay();
    triggerGlitch();
}

function updateVirusDisplay() {
    const fill = document.getElementById('virus-fill');
    const percent = document.getElementById('virus-percent');
    fill.style.width = gameState.virusLevel + '%';
    percent.textContent = gameState.virusLevel + '%';
}

function triggerGlitch() {
    const overlay = document.getElementById('glitch-overlay');
    overlay.classList.add('active');
    setTimeout(() => overlay.classList.remove('active'), 300);
}

// ============================================
// HINT SYSTEM
// ============================================

function showHints() {
    if (gameState.hintsRemaining <= 0) {
        showNotification('No hints remaining!');
        return;
    }
    
    let hint = '';
    
    if (gameState.currentPhase === PHASES.START) {
        hint = 'HINT: Try inspecting the floor. Things often hide in plain sight...';
    } else if (gameState.currentPhase === PHASES.KEYCARD_FOUND) {
        hint = 'HINT: Check your inventory. The keycard can be used with "use keycard" command.';
    } else if (gameState.currentPhase === PHASES.TERMINAL_UNLOCKED) {
        hint = 'HINT: Read "research_notes.txt" and look for day numbers. Then type "solve password".';
    } else if (gameState.currentPhase === PHASES.PASSWORD_SOLVED) {
        hint = 'HINT: Read the encrypted files, then type "solve cipher". A=1, B=2, C=3...';
    } else {
        hint = 'You\'re doing great! Keep solving puzzles!';
    }
    
    gameState.hintsRemaining--;
    gameState.hintsUsed++;
    document.getElementById('hint-count').textContent = gameState.hintsRemaining;
    
    showNotification(hint);
    printToTerminal(`<p class="text-yellow">💡 ${hint}</p>`);
    sounds.playNotification();
}

// ============================================
// VICTORY SYSTEM
// ============================================

function triggerVictory() {
    sounds.playSuccess();
    
    const elapsed = Date.now() - gameState.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    document.getElementById('final-virus').textContent = gameState.virusLevel + '%';
    document.getElementById('time-survived').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('hints-used').textContent = gameState.hintsUsed;
    
    setTimeout(() => {
        switchScreen('game-screen', 'victory-screen');
    }, 500);
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

function switchScreen(from, to) {
    document.getElementById(from).classList.remove('active');
    document.getElementById(to).classList.add('active');
}

function printToTerminal(text) {
    const output = document.getElementById('terminal-output');
    output.innerHTML += `\n${text}`;
    output.scrollTop = output.scrollHeight;
}

function showNotification(message) {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.classList.add('show');
    sounds.playNotification();
    
    setTimeout(() => {
        notif.classList.remove('show');
    }, 4000);
}

function showHelp() {
    printToTerminal(commandHelp());
}

function isInputFocused() {
    return document.activeElement.tagName === 'INPUT';
}

// ============================================
// SAVE/LOAD SYSTEM
// ============================================

function saveGame() {
    const saveData = {
        currentPhase: gameState.currentPhase,
        inventory: gameState.inventory,
        foundItems: gameState.foundItems,
        usedItems: gameState.usedItems,
        solvedPuzzles: gameState.solvedPuzzles,
        virusLevel: gameState.virusLevel,
        hintsRemaining: gameState.hintsRemaining,
        hintsUsed: gameState.hintsUsed,
        terminalUnlocked: gameState.terminalUnlocked,
        deskExamined: gameState.deskExamined,
        doorChecked: gameState.doorChecked,
        cabinetSearched: gameState.cabinetSearched,
        floorInspected: gameState.floorInspected
    };
    
    localStorage.setItem('re_birthday_save_v2', JSON.stringify(saveData));
    
    const saveText = document.getElementById('save-text');
    saveText.textContent = 'Game Saved!';
    sounds.playSuccess();
    showNotification('Progress saved!');
    
    setTimeout(() => {
        saveText.textContent = 'Auto-Save';
    }, 2000);
}

function loadGame() {
    const saveData = localStorage.getItem('re_birthday_save_v2');
    
    if (saveData) {
        try {
            const data = JSON.parse(saveData);
            Object.assign(gameState, data);
            updateInventoryDisplay();
            updateVirusDisplay();
            updateProgress();
            
            if (gameState.terminalUnlocked) {
                document.getElementById('terminal-input').disabled = false;
                document.getElementById('terminal-status').textContent = '✓ UNLOCKED';
                document.getElementById('terminal-status').classList.add('unlocked');
            }
            
            document.getElementById('hint-count').textContent = gameState.hintsRemaining;
            document.getElementById('item-count').textContent = gameState.inventory.length;
        } catch (e) {
            console.error('Failed to load save:', e);
        }
    }
}

// Auto-save every 30 seconds
setInterval(saveGame, 30000);
