// Add a global error handler for uncaught exceptions
window.onerror = function (message, source, lineno, colno, error) {
    console.error("!!! Uncaught Global Error:", {
        message: message,
        source: source,
        lineno: lineno,
        colno: colno,
        errorObject: error
    });
    // Optionally display a user-friendly error message on the screen
    const body = document.querySelector('body');
    if (body) {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '10px';
        errorDiv.style.left = '10px';
        errorDiv.style.padding = '10px';
        errorDiv.style.backgroundColor = 'red';
        errorDiv.style.color = 'white';
        errorDiv.style.zIndex = '9999';
        errorDiv.textContent = `FATAL ERROR: ${message}. Check console (F12).`;
        body.appendChild(errorDiv);
    }
};


document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded event fired.");

    // --- DOM Elements ---
    const nodeNumberEl = document.getElementById('node-number');
    const scoreEl = document.getElementById('score');
    const integrityPointsEl = document.getElementById('integrity-points');
    const dataPacketsEl = document.getElementById('data-packets');
    const highScoreEl = document.getElementById('high-score');
    const nodeDescriptionEl = document.getElementById('node-description');
    const nodeMessageEl = document.getElementById('node-message');
    const diceResultsEl = document.getElementById('dice-results');
    const startButton = document.getElementById('start-button');
    const rulesButton = document.getElementById('rules-button');
    const commitButton = document.getElementById('commit-button');
    const skipBonusButton = document.getElementById('skip-bonus-button');
    const proceedButton = document.getElementById('proceed-button');
    const playAgainButton = document.getElementById('play-again-button');
    const diceSelectionArea = document.getElementById('dice-selection-area');
    const diceSelectInput = document.getElementById('dice-select-input');
    const diceRangeLabel = document.getElementById('dice-range-label');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = loadingOverlay.querySelector('.loading-text');
    const gameContainer = document.getElementById('game-container');
    const rulesScreen = document.getElementById('rules-screen');
    const backButton = document.getElementById('back-to-main-button');
    // Port Alignment UI Elements
    const portAlignmentUIDiv = document.getElementById('port-alignment-ui');
    const clickableDiceArea = document.getElementById('clickable-dice-area');
    const clickablePortsArea = document.getElementById('clickable-ports-area');
    const confirmAlignmentButton = document.getElementById('confirm-alignment-button');


    // --- Simplified Audio Elements ---
    let soundEnabled = false;
    const sounds = {
        click: document.getElementById('audio-click'),
        loading: document.getElementById('audio-loading'),
        bgmMusic: document.getElementById('audio-bgm-music'),
        bgmEndscreen: document.getElementById('audio-bgm-endscreen'),
    };

    // --- Game State Variables ---
    let score = 0;
    let integrityPoints = 5; // STARTING VALUE
    const STARTING_INTEGRITY = 5; // STARTING VALUE
    let dataPackets = 15;
    const STARTING_PACKETS = 15;
    let nodeNumber = 0;
    let highScore = 0;
    let currentChallenge = null;
    let dice = [];
    let gameState = 'start';
    // Port Alignment State
    let selectedDieIndex = null;
    let portAssignments = {};


    // --- Constants ---
    const DICE_SIDES = 6;
    const BASE_SCORE_PER_NODE = 18;
    const SCORE_SCALING_PER_NODE = 5;
    const BONUS_SCORE_PACKET_EFFICIENCY = 15;
    const BONUS_ROUND_BASE_SCORE = 40;
    const BONUS_ROUND_PACKET_SCORE = 10;
    const PORT_ALIGNMENT_BASE_SCORE = 25;
    const PORT_ALIGNMENT_SCALING = 6;
    const HIGH_SCORE_KEY = 'nr_highScore_v3';
    const MIN_LOADING_TIME = 450;
    const GLITCH_INTERVAL = 1800;
    const GLITCH_DURATION = 180;
    const TYPEWRITER_SPEED = 15; // ms per character

    // --- Typewriter Function (Corrected & Debugged)---
    function typeWriter(element, text, speed, callback) {
        console.log(`DEBUG: typeWriter called for element: ${element.id}, text: "${text.substring(0, 30)}..."`);
        const timeoutKey = `typingTimeoutId_${element.id}`; // Use element ID for unique key

        // Clear existing timeout specifically for this element
        const existingTimeoutId = window[timeoutKey]; // Store globally or on a shared object
        if (existingTimeoutId) {
            console.log(`DEBUG: Clearing existing timeout ${existingTimeoutId} for ${element.id}`);
            clearTimeout(existingTimeoutId);
            window[timeoutKey] = null; // Clear the stored ID
        }

        element.textContent = ''; // Clear immediately
        let i = 0;

        function typeChar() {
            try { // Add try-catch inside the recursive function
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    // Store the new timeout ID globally or on a shared object
                    window[timeoutKey] = setTimeout(typeChar, speed);
                } else {
                    console.log(`DEBUG: typeWriter finished for ${element.id}. Executing callback.`);
                    window[timeoutKey] = null; // Clear the stored ID
                    if (callback) {
                        // Use a small delay before callback to ensure rendering completes
                        setTimeout(callback, 50);
                    } else {
                         console.log(`DEBUG: typeWriter finished for ${element.id}. No callback provided.`);
                    }
                }
            } catch(e) {
                 console.error(`DEBUG: Error inside typeChar for ${element.id}:`, e);
                 window[timeoutKey] = null; // Ensure timeout is cleared on error
            }
        }
        // Start the typing process with a tiny delay
        console.log(`DEBUG: Starting typeChar for ${element.id}`);
        window[timeoutKey] = setTimeout(typeChar, 10);
    }

    // --- Audio Helper Functions ---
    function enableSoundInteraction() {
        if (!soundEnabled) {
            console.log("DEBUG: User interaction detected. Enabling sound.");
            soundEnabled = true;
        }
    }

    function playSoundEffect(sound) {
        if (!soundEnabled || !sound) {
            // console.log(`DEBUG: Sound not played (disabled or missing): ${sound?.id}`);
            return;
        }
        // console.log(`DEBUG: Attempting to play sound: ${sound.id}`);
        sound.currentTime = 0;
        sound.play().catch(e => console.error(`DEBUG: Audio play failed for ${sound.id}:`, e));
    }

    function playLoop(sound) {
        if (!soundEnabled || !sound) return;
        stopAllLoops();
        console.log(`DEBUG: Starting loop: ${sound.id}`);
        sound.loop = true;
        sound.play().catch(e => console.error(`DEBUG: Audio loop failed for ${sound.id}:`, e));
    }

    function stopLoop(sound) {
        if (!sound) return;
        sound.pause();
        sound.currentTime = 0;
    }

    function stopAllLoops() {
         stopLoop(sounds.bgmMusic);
         stopLoop(sounds.bgmEndscreen);
    }

    // --- Game Logic Functions ---

    function showLoading(message = "PROCESSING...") {
        console.log("DEBUG: showLoading called. Message:", message);
        if (gameState === 'loading') return;
        playSoundEffect(sounds.loading);
        const previousState = gameState;
        gameState = 'loading';
        loadingText.textContent = message;
        loadingOverlay.classList.remove('hidden');
        updateUI();
        return previousState;
    }

    function hideLoading(restoreState = null) {
        console.log("DEBUG: hideLoading called. Restore state:", restoreState);
        loadingOverlay.classList.add('hidden');
        if (restoreState && gameState === 'loading') {
             gameState = restoreState;
             console.log("DEBUG: Game state restored to:", gameState);
        }
        updateUI();
    }

    function showRules() {
        console.log("DEBUG: showRules called.");
        if (gameState === 'start') {
             playSoundEffect(sounds.click);
             gameState = 'rules';
             gameContainer.classList.add('hidden');
             rulesScreen.classList.remove('hidden');
             stopGlitchTimer(); updateUI();
        }
    }

    function hideRules() {
        console.log("DEBUG: hideRules called.");
         if (gameState === 'rules') {
             playSoundEffect(sounds.click);
             gameState = 'start';
             rulesScreen.classList.add('hidden');
             gameContainer.classList.remove('hidden'); updateUI();
         }
    }

    function startGame() {
        console.log("DEBUG: startGame called.");
        playSoundEffect(sounds.click);
        stopAllLoops(); playLoop(sounds.bgmMusic);
        console.log("DEBUG: Starting sequence...");
        showLoading("INITIALIZING CONNECTION...");

        score = 0; integrityPoints = STARTING_INTEGRITY; dataPackets = STARTING_PACKETS;
        nodeNumber = 0; dice = []; currentChallenge = null; portAssignments = {}; selectedDieIndex = null;

        highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0');
        diceResultsEl.textContent = '';
        nodeMessageEl.textContent = '';

        const welcomeMsg = `> Welcome, Runner. Connection to Mainframe requires navigating secure Nodes.\n> Allocate Data Packets wisely. Connection Integrity: ${STARTING_INTEGRITY}. Packets: ${STARTING_PACKETS}.\n> Initiate sequence...`;
        console.log("DEBUG: Calling typeWriter for welcome message.");
        typeWriter(nodeDescriptionEl, welcomeMsg, TYPEWRITER_SPEED, () => {
             // --- This is the callback function for the welcome message ---
             console.log("DEBUG: typeWriter callback for welcome message executing.");
             // -------------------------------------------------------------
             setTimeout(() => { // Use timeout to ensure loading screen minimum time
                 console.log("DEBUG: Inside startGame setTimeout (after welcome message typed).");
                 try {
                     hideLoading('generating_node'); // Intend to set state before generating
                     console.log("DEBUG: Calling generateNextNode for the first time.");
                     generateNextNode(); // Generate the first node
                     console.log("DEBUG: generateNextNode completed. Calling startGlitchTimer.");
                     startGlitchTimer();
                     console.log("DEBUG: startGlitchTimer completed.");
                 } catch (error) {
                     console.error("DEBUG: Error during game initialization after loading:", error);
                     typeWriter(nodeDescriptionEl, "> CRITICAL SYSTEM ERROR DURING NODE GENERATION.\n> Unable to proceed.", TYPEWRITER_SPEED);
                     typeWriter(nodeMessageEl, `> Error: ${error.message}`, TYPEWRITER_SPEED);
                     gameState = 'game_over';
                     stopAllLoops(); playLoop(sounds.bgmEndscreen);
                     hideLoading('game_over'); updateUI();
                 }
             }, MIN_LOADING_TIME); // Ensure loading screen shows briefly
        });
    }

    function generateNextNode() {
        console.log(`DEBUG: generateNextNode called for Node ${nodeNumber + 1}. Current state: ${gameState}`);
        if (gameState === 'game_over' || gameState === 'loading') {
             console.log("DEBUG: generateNextNode returning early due to state.");
             return;
        }

        nodeNumber++;
        dice = []; diceResultsEl.textContent = ''; nodeMessageEl.textContent = '';
        clearPortAssignmentUI();

        const challengeFunctions = [
            setupTargetSumChallenge, setupTargetUnderChallenge, setupSpecificNumberChallenge,
            setupPortAlignmentChallenge, setupSecureCache, setupPacketLossRisk, setupBonusGuess
        ];

        let specialNodeChance = 0.1 + (nodeNumber * 0.012);
        if (nodeNumber < 3) specialNodeChance = 0;
        if (specialNodeChance > 0.40) specialNodeChance = 0.40;

        let selectedFunction;
        // Selection logic...
        if (Math.random() < specialNodeChance) {
             const specialFunctions = challengeFunctions.filter(fn => fn.name.includes('Cache') || fn.name.includes('Risk') || fn.name.includes('Bonus'));
             if (specialFunctions.length > 0) { selectedFunction = specialFunctions[Math.floor(Math.random() * specialFunctions.length)]; }
             else { selectedFunction = setupTargetSumChallenge; }
        } else {
             const challengeOnlyFunctions = challengeFunctions.filter(fn => !fn.name.includes('Cache') && !fn.name.includes('Risk') && !fn.name.includes('Bonus'));
             if (challengeOnlyFunctions.length === 0) { selectedFunction = setupTargetSumChallenge; }
             else { selectedFunction = challengeOnlyFunctions[Math.floor(Math.random() * challengeOnlyFunctions.length)]; }
        }
        console.log("DEBUG: Selected Node Function:", selectedFunction.name);

        // --- Safely call the selected function ---
        try {
             console.log(`DEBUG: Attempting to call ${selectedFunction.name} to set up challenge.`);
             selectedFunction(); // This should set currentChallenge
             console.log(`DEBUG: ${selectedFunction.name} completed. currentChallenge set:`, currentChallenge);
        } catch (error) {
             console.error(`DEBUG: Error setting up challenge '${selectedFunction?.name}' for Node ${nodeNumber}:`, error);
             nodeDescriptionEl.textContent = `> Node ${nodeNumber}: Datastream Corruption! Route unstable. Proceeding cautiously.`; // Directly set text on error
             currentChallenge = { type: 'event', description: nodeDescriptionEl.textContent, message: `Error: ${error.message}` };
             console.warn("DEBUG: Fallback challenge assigned due to error:", currentChallenge);
        }
        // ----------------------------------------


        // --- Determine next state & Type Description ---
        if (currentChallenge && currentChallenge.type === 'event') {
             console.log("DEBUG: Challenge type is 'event'. Typing description.");
             typeWriter(nodeDescriptionEl, currentChallenge.description, TYPEWRITER_SPEED, () => {
                 console.log("DEBUG: Event description typed. Setting state to awaiting_proceed.");
                 gameState = 'awaiting_proceed';
                 updateUI();
             });
        } else if (currentChallenge) {
             console.log(`DEBUG: Challenge type is '${currentChallenge.type}'. Typing description.`);
             typeWriter(nodeDescriptionEl, currentChallenge.description, TYPEWRITER_SPEED, () => {
                 console.log("DEBUG: Challenge description typed. Setting state to awaiting_selection.");
                 gameState = 'awaiting_selection';
                 if (currentChallenge.maxDiceAllowed !== undefined) {
                      console.log("DEBUG: Calling configureDiceSelector.");
                      configureDiceSelector();
                 } else {
                      console.error("DEBUG: Cannot configure dice selector - challenge data invalid?", currentChallenge);
                      typeWriter(nodeMessageEl, "\n> Error configuring node interaction. Proceeding.", TYPEWRITER_SPEED);
                      gameState = 'awaiting_proceed';
                 }
                 updateUI();
             });
        } else {
             console.error("DEBUG: CRITICAL: currentChallenge is null after setup attempt and fallback logic!");
             typeWriter(nodeDescriptionEl, `> Node ${nodeNumber}: CRITICAL ROUTING FAILURE.`, TYPEWRITER_SPEED);
             typeWriter(nodeMessageEl, "> Unable to initialize Node. Terminating run.", TYPEWRITER_SPEED);
             gameState = 'game_over';
             updateUI();
        }
    }


    function configureDiceSelector() {
        console.log("DEBUG: configureDiceSelector called.");
        if (!currentChallenge || currentChallenge.type === 'event') {
             diceSelectionArea.classList.add('hidden'); return;
        }
         const maxDiceAllowed = currentChallenge.maxDiceAllowed !== undefined ? currentChallenge.maxDiceAllowed : dataPackets;
         const minDiceRequired = currentChallenge.minDiceRequired !== undefined ? currentChallenge.minDiceRequired : 1;
         const maxDice = Math.min(dataPackets, maxDiceAllowed);
         const minDice = Math.max(1, minDiceRequired);
         const finalMaxDice = Math.max(minDice, maxDice);
         const inputMax = finalMaxDice; const inputMin = minDice;
         console.log(`DEBUG: Dice selector config: min=${inputMin}, max=${inputMax}, availablePackets=${dataPackets}`);

         if (inputMin > dataPackets) {
             typeWriter(nodeMessageEl, `> CRITICAL ERROR: Insufficient packets (${dataPackets}) for minimum Node requirement (${inputMin}). Routing Failure Imminent.`, TYPEWRITER_SPEED);
             commitButton.disabled = true; diceSelectInput.disabled = true; skipBonusButton.classList.add('hidden');
             gameState = 'awaiting_proceed';
             return;
         }
         diceSelectInput.max = inputMax; diceSelectInput.min = inputMin;
         let currentVal = parseInt(diceSelectInput.value);
         if(isNaN(currentVal)) currentVal = inputMin;
         diceSelectInput.value = Math.min(inputMax, Math.max(inputMin, currentVal));
         diceRangeLabel.textContent = `${inputMin}-${inputMax}`;
         diceSelectionArea.classList.remove('hidden');
         console.log("DEBUG: Dice selector configured and shown.");
    }

    function commitPackets() {
        playSoundEffect(sounds.click);
        console.log("DEBUG: commitPackets called.");
        if (gameState !== 'awaiting_selection' || !currentChallenge) {
            console.warn("DEBUG: commitPackets called in wrong state or no challenge.");
            return;
        }

        const selectedCount = parseInt(diceSelectInput.value);
        const maxAllowed = parseInt(diceSelectInput.max);
        const minRequired = parseInt(diceSelectInput.min);
        console.log(`DEBUG: Committing ${selectedCount} packets (min: ${minRequired}, max: ${maxAllowed}).`);
        if (isNaN(selectedCount) || selectedCount < minRequired || selectedCount > maxAllowed) {
            typeWriter(nodeMessageEl, `> Invalid packet allocation. Commit between ${minRequired} and ${maxAllowed}.`, TYPEWRITER_SPEED);
            diceSelectInput.focus(); diceSelectInput.select();
            return;
        }

        dice = [];
        for (let i = 0; i < selectedCount; i++) { dice.push(Math.floor(Math.random() * DICE_SIDES) + 1); }
        console.log("DEBUG: Dice results:", dice);
        diceResultsEl.textContent = dice.map(d => `[ ${d} ]`).join(' ');

        if (currentChallenge.type === 'port_alignment') {
            console.log("DEBUG: Transitioning to awaiting_port_assignment state.");
            gameState = 'awaiting_port_assignment';
            portAssignments = {}; selectedDieIndex = null;
            displayPortAssignmentUI();
            typeWriter(nodeMessageEl, '> Alignment required. Select an available die, then a target port.', TYPEWRITER_SPEED);
            updateUI();
        } else {
            console.log("DEBUG: Calling resolveChallenge for non-port challenge.");
            resolveChallenge(selectedCount);
        }
    }

    // --- Port Alignment UI Functions ---
    function displayPortAssignmentUI() {
        console.log("DEBUG: displayPortAssignmentUI called.");
        clearPortAssignmentUI();
        portAlignmentUIDiv.classList.remove('hidden');
        confirmAlignmentButton.disabled = true;

        clickableDiceArea.textContent = 'Dice Available: ';
        dice.forEach((dieValue, index) => {
            const dieSpan = document.createElement('span');
            dieSpan.textContent = `[${dieValue}]`;
            dieSpan.dataset.index = index; dieSpan.dataset.value = dieValue;
            dieSpan.addEventListener('click', () => handleDieClick(index));
            clickableDiceArea.appendChild(dieSpan);
        });

        clickablePortsArea.textContent = 'Target Ports: ';
        currentChallenge.portValues.forEach((portValue, index) => {
            const portSpan = document.createElement('span');
            portSpan.textContent = `P${index + 1}:${portValue}`;
            portSpan.dataset.index = index; portSpan.dataset.value = portValue;
            portSpan.addEventListener('click', () => handlePortClick(index));
            clickablePortsArea.appendChild(portSpan);
        });
        console.log("DEBUG: Port assignment UI populated.");
    }

    function handleDieClick(index) {
        console.log(`DEBUG: handleDieClick called for index ${index}.`);
        const dieSpan = clickableDiceArea.querySelector(`span[data-index="${index}"]`);
        if (!dieSpan || dieSpan.classList.contains('assigned')) {
             typeWriter(nodeMessageEl, '> Die already assigned or unavailable.', TYPEWRITER_SPEED);
             console.log(`DEBUG: Click ignored on assigned/unavailable die ${index}.`);
            return;
        }
        playSoundEffect(sounds.click);
        selectedDieIndex = index;
        clickableDiceArea.querySelectorAll('span').forEach(span => span.classList.remove('selected'));
        dieSpan.classList.add('selected');
        typeWriter(nodeMessageEl, `> Selected Die [${dice[index]}]. Now select target port.`, TYPEWRITER_SPEED);
        console.log(`DEBUG: Die ${index} selected.`);
    }

    function handlePortClick(index) {
        console.log(`DEBUG: handlePortClick called for index ${index}. Selected die: ${selectedDieIndex}`);
        const portSpan = clickablePortsArea.querySelector(`span[data-index="${index}"]`);
        if (!portSpan || portSpan.classList.contains('assigned')) {
            typeWriter(nodeMessageEl, '> Port already has assignment.', TYPEWRITER_SPEED);
            console.log(`DEBUG: Click ignored on assigned port ${index}.`);
            return;
        }
        if (selectedDieIndex === null) {
            typeWriter(nodeMessageEl, '> Select a die first.', TYPEWRITER_SPEED);
            console.log("DEBUG: Port click ignored, no die selected.");
            return;
        }

        playSoundEffect(sounds.click);
        portAssignments[index] = selectedDieIndex; // Store assignment: port index -> die index
        console.log("DEBUG: Port assignments updated:", portAssignments);

        portSpan.classList.add('assigned');
        portSpan.textContent += ` <= [${dice[selectedDieIndex]}]`; // Show assignment
        const assignedDieSpan = clickableDiceArea.querySelector(`span[data-index="${selectedDieIndex}"]`);
        assignedDieSpan?.classList.add('assigned'); // Mark die as used
        assignedDieSpan?.classList.remove('selected');

        const assignedDieValue = dice[selectedDieIndex];
        const portValue = parseInt(portSpan.dataset.value);
        portSpan.classList.add(assignedDieValue >= portValue ? 'success' : 'fail'); // Visual success/fail feedback

        const previouslySelectedDieIndex = selectedDieIndex;
        selectedDieIndex = null; // Reset die selection

        const totalPorts = currentChallenge.portValues.length;
        if (Object.keys(portAssignments).length === totalPorts) {
            confirmAlignmentButton.disabled = false;
            typeWriter(nodeMessageEl, `> Port ${index+1} assigned with [${dice[previouslySelectedDieIndex]}]. All ports assigned. Confirm Alignment.`, TYPEWRITER_SPEED);
            console.log("DEBUG: All ports assigned, confirm button enabled.");
        } else {
             typeWriter(nodeMessageEl, `> Port ${index+1} assigned with [${dice[previouslySelectedDieIndex]}]. Select next die.`, TYPEWRITER_SPEED);
        }
    }

     function confirmAlignment() {
         playSoundEffect(sounds.click);
         console.log("DEBUG: confirmAlignment called. Assignments:", portAssignments);

         if (Object.keys(portAssignments).length !== currentChallenge.portValues.length) {
             typeWriter(nodeMessageEl, "> ERROR: Not all ports assigned.", TYPEWRITER_SPEED);
             console.error("DEBUG: confirmAlignment attempted before all ports assigned.");
             return;
         }

         let allSuccess = true;
         let failedPortsCount = 0;
         for (const portIndex in portAssignments) {
             const dieIndex = portAssignments[portIndex];
             const portValue = currentChallenge.portValues[portIndex];
             if (dice[dieIndex] < portValue) {
                 allSuccess = false;
                 failedPortsCount++;
             }
         }
         console.log(`DEBUG: Alignment check result: allSuccess=${allSuccess}, failedPorts=${failedPortsCount}`);

         resolveChallengePortResult(allSuccess, failedPortsCount);
         // updateUI called after result message is typed
     }

    function clearPortAssignmentUI() {
        console.log("DEBUG: clearPortAssignmentUI called.");
        portAlignmentUIDiv.classList.add('hidden');
        clickableDiceArea.innerHTML = 'Dice Available: ';
        clickablePortsArea.innerHTML = 'Target Ports: ';
        portAssignments = {};
        selectedDieIndex = null;
    }

    function skipBonusNode() {
         playSoundEffect(sounds.click);
         console.log("DEBUG: skipBonusNode called.");
         dice = []; diceResultsEl.textContent = '';
         gameState = 'awaiting_proceed';
         typeWriter(nodeMessageEl, `> Bonus Node bypassed. Maintaining current trajectory.`, TYPEWRITER_SPEED, () => {
             updateUI();
         });
    }

    // Modified resolveChallenge to handle separate port result
    function resolveChallenge(packetsCommitted) {
        console.log(`DEBUG: resolveChallenge called for type ${currentChallenge?.type} with ${packetsCommitted} packets.`);
        if (currentChallenge.type === 'port_alignment') {
            console.error("DEBUG: resolveChallenge called directly for port_alignment - this shouldn't happen."); return;
        }

        let success = false; let message = ''; let bonusMessage = '';
        let integrityLoss = 1; let packetLoss = 0; let scoreGained = 0;

        if (!currentChallenge || (dice.length === 0 && currentChallenge.type !== 'event')) {
            console.error("DEBUG: Resolve error: No challenge data or dice rolled for non-event.");
            message = "> Internal Error: Challenge data missing.";
            success = false;
        } else {
            const diceSum = dice.reduce((a, b) => a + b, 0);
            const diceString = dice.map(d => `[ ${d} ]`).join(' ');

            try {
                switch (currentChallenge.type) {
                    case 'target_sum':
                        success = diceSum > currentChallenge.target;
                        message = `> Commit ${packetsCommitted}. Result: ${diceString} (Sum: ${diceSum}). Target > ${currentChallenge.target}.`;
                        if (success && packetsCommitted <= 2) { scoreGained += BONUS_SCORE_PACKET_EFFICIENCY; bonusMessage = `\n> Rapid Execution Bonus! (+${BONUS_SCORE_PACKET_EFFICIENCY} Score)`; }
                        break;
                    case 'target_under':
                        success = diceSum < currentChallenge.target;
                        message = `> Commit ${packetsCommitted}. Result: ${diceString} (Sum: ${diceSum}). Target < ${currentChallenge.target}.`;
                        if (success && packetsCommitted >= 3) { scoreGained += BONUS_SCORE_PACKET_EFFICIENCY; bonusMessage = `\n> Thorough Analysis Bonus! (+${BONUS_SCORE_PACKET_EFFICIENCY} Score)`; }
                        break;
                    case 'specific_number':
                        const count = dice.filter(d => d === currentChallenge.targetNumber).length;
                        success = count >= currentChallenge.requiredCount;
                        message = `> Commit ${packetsCommitted}. Result: ${diceString}. Required ${currentChallenge.requiredCount}x [ ${currentChallenge.targetNumber} ]. Found ${count}.`;
                        break;
                    case 'bonus_guess':
                        success = dice.includes(currentChallenge.targetNumber);
                        message = `> BONUS NODE: Commit ${packetsCommitted}. Result: ${diceString}. Target [ ${currentChallenge.targetNumber} ].`;
                        integrityLoss = 0;
                        if (success) { scoreGained = BONUS_ROUND_BASE_SCORE + (packetsCommitted * BONUS_ROUND_PACKET_SCORE); packetLoss = -packetsCommitted; message += `\n> Frequency Matched! Bonus score secured!`; }
                        else { packetLoss = packetsCommitted; message += `\n> Target frequency missed. Packets lost!`; }
                        break;
                    default: // Includes 'event' type
                        message = currentChallenge.description || `> Anomaly in Node ${nodeNumber}. Routing stable.`;
                        success = true; integrityLoss = 0;
                        break;
                }
            } catch (error) {
                console.error("DEBUG: Error during challenge resolution logic:", error);
                message = `> Critical Error resolving node ${nodeNumber}! Fallback routing.`;
                success = false; integrityLoss = 2;
            }
        }
        console.log(`DEBUG: Challenge resolved. Success: ${success}, Message: "${message.substring(0,50)}..."`);

        // --- Update Game State Based on Outcome ---
        if(currentChallenge.type === 'event') integrityLoss = 0; // Ensure events don't cause integrity loss

        if (currentChallenge.type !== 'bonus_guess') {
            if (success) {
                 if (currentChallenge.type !== 'event') { scoreGained += BASE_SCORE_PER_NODE + (nodeNumber * SCORE_SCALING_PER_NODE); }
                 score += scoreGained;
                 if (scoreGained > 0) { message += `\n> SUCCESS! Node ${nodeNumber} Secured. Acquired ${scoreGained} score packets.`; }
                 else if (currentChallenge.type !== 'event') { message += `\n> SUCCESS! Node ${nodeNumber} Secured.`; }
                 message += bonusMessage;
                 if (dataPackets < STARTING_PACKETS && Math.random() < 0.12) { dataPackets++; message += `\n> Minor packet stream stabilized (+1 Data Packet).`; }
                 gameState = 'awaiting_proceed';
            } else { // Failure on standard node
                 integrityPoints -= integrityLoss;
                 dataPackets -= packetLoss;
                 if (dataPackets < 0) dataPackets = 0;
                 message += `\n> FAILURE! Security Alert! Lost ${integrityLoss} Integrity.`;
                 if (packetLoss > 0) message += ` Lost ${packetLoss} Data Packet(s).`;
                 if (integrityPoints <= 0) { gameOver("Integrity Failure"); return; }
                 else if (dataPackets <= 0 && (currentChallenge?.minDiceRequired || 0) > 0) { gameOver("Packet Depletion"); return; }
                 else { gameState = 'awaiting_proceed'; }
            }
        } else { // Bonus round outcome processing
             score += scoreGained; dataPackets -= packetLoss;
             if (dataPackets < 0) dataPackets = 0;
             if (dataPackets <= 0 && !(success && packetLoss < 0)) { gameOver("Packet Depletion"); return; }
             gameState = 'awaiting_proceed';
        }

        console.log(`DEBUG: State after resolution: ${gameState}, Integrity: ${integrityPoints}, Packets: ${dataPackets}`);
        typeWriter(nodeMessageEl, message, TYPEWRITER_SPEED, () => {
             console.log("DEBUG: Result message typed. Updating UI.");
             updateUI();
        });
        currentChallenge.message = message;
    }


    function resolveChallengePortResult(overallSuccess, failedPortsCount) {
        console.log(`DEBUG: resolveChallengePortResult called. Success: ${overallSuccess}, Failed ports: ${failedPortsCount}`);
        let message = '';
        let scoreGained = 0;
        let integrityLoss = 0;

        if (overallSuccess) {
            scoreGained = PORT_ALIGNMENT_BASE_SCORE + (nodeNumber * PORT_ALIGNMENT_SCALING);
            score += scoreGained;
            message = `> All ports aligned successfully!\n> Acquired ${scoreGained} score packets.`;
            if (dataPackets < STARTING_PACKETS && Math.random() < 0.12) { dataPackets++; message += `\n> Minor packet stream stabilized (+1 Data Packet).`; }
             gameState = 'awaiting_proceed';
        } else {
            integrityLoss = 1;
            integrityPoints -= integrityLoss;
            message = `> Alignment Failed! ${failedPortsCount} port(s) unsecured.\n> Lost ${integrityLoss} Integrity.`;
            if (integrityPoints <= 0) { gameOver("Integrity Failure"); return; }
            else { gameState = 'awaiting_proceed'; }
        }

        console.log(`DEBUG: State after port resolution: ${gameState}, Integrity: ${integrityPoints}`);
        typeWriter(nodeMessageEl, message, TYPEWRITER_SPEED, () => {
            console.log("DEBUG: Port result message typed. Clearing UI and updating.");
            clearPortAssignmentUI();
            diceResultsEl.textContent = '';
            updateUI();
        });
    }


    function gameOver(reason = "Unknown") {
        console.log(`DEBUG: gameOver called. Reason: ${reason}`);
        stopAllLoops(); playLoop(sounds.bgmEndscreen);
        showLoading("TERMINATING CONNECTION...");
        gameState = 'game_over'; stopGlitchTimer();

        setTimeout(() => {
             let gameOverMessage = `\n\n--- CONNECTION TERMINATED ---`;
             gameOverMessage += `\n> REASON: ${reason}`;
             gameOverMessage += `\n> Final Score: ${score}`;
             gameOverMessage += `\n> Nodes Reached: ${nodeNumber}`;
             if (score > highScore) { gameOverMessage += `\n> NEW HIGH SCORE! Previous: ${highScore}`; highScore = score; localStorage.setItem(HIGH_SCORE_KEY, highScore.toString()); }
             else { gameOverMessage += `\n> High Score: ${highScore}`; }
             gameOverMessage += `\n> Runner sequence ended.`;

             typeWriter(nodeDescriptionEl, `> Node ${nodeNumber}: Connection Trace Lost...`, TYPEWRITER_SPEED);
             typeWriter(nodeMessageEl, gameOverMessage, TYPEWRITER_SPEED, () => {
                 console.log("DEBUG: Game over message typed. Hiding loading and updating UI.");
                 hideLoading('game_over');
                 updateUI();
             });
             diceResultsEl.textContent = ''; clearPortAssignmentUI();
        }, MIN_LOADING_TIME);
    }

    function proceed() {
        console.log("DEBUG: proceed called.");
        if (gameState !== 'awaiting_proceed') {
             console.warn(`DEBUG: proceed called in wrong state: ${gameState}`);
             return;
        }
        playSoundEffect(sounds.click);
        showLoading(`ROUTING TO NODE ${nodeNumber + 1}...`);
        setTimeout(() => {
             console.log("DEBUG: Proceed timeout finished. Generating next node.");
             hideLoading('generating_node');
             generateNextNode();
        }, MIN_LOADING_TIME / 1.5);
    }


    function updateUI() {
         // console.log(`DEBUG: updateUI called. Current state: ${gameState}`); // Can be noisy, enable if needed
         nodeNumberEl.textContent = nodeNumber; scoreEl.textContent = score; integrityPointsEl.textContent = integrityPoints;
         dataPacketsEl.textContent = dataPackets; highScoreEl.textContent = highScore;

         const showDiceSelect = (gameState === 'awaiting_selection');
         const showPortAlign = (gameState === 'awaiting_port_assignment');
         const isBonusNode = (currentChallenge?.type === 'bonus_guess');
         const showProceed = (gameState === 'awaiting_proceed');
         const showGameOver = (gameState === 'game_over');
         const showStartControls = (gameState === 'start');
         const isLoading = (gameState === 'loading');

         gameContainer.classList.toggle('hidden', gameState === 'rules'); rulesScreen.classList.toggle('hidden', gameState !== 'rules');
         startButton.classList.toggle('hidden', !showStartControls); rulesButton.classList.toggle('hidden', !showStartControls);
         diceSelectionArea.classList.toggle('hidden', !showDiceSelect);
         commitButton.classList.toggle('hidden', !showDiceSelect);
         skipBonusButton.classList.toggle('hidden', !(showDiceSelect && isBonusNode));
         portAlignmentUIDiv.classList.toggle('hidden', !showPortAlign);
         confirmAlignmentButton.classList.toggle('hidden', !showPortAlign);
         if(showPortAlign) confirmAlignmentButton.disabled = (Object.keys(portAssignments).length !== (currentChallenge?.portValues?.length || Infinity));
         proceedButton.classList.toggle('hidden', !showProceed); playAgainButton.classList.toggle('hidden', !showGameOver);

         commitButton.disabled = isLoading || !showDiceSelect; skipBonusButton.disabled = isLoading || !showDiceSelect || !isBonusNode;
         confirmAlignmentButton.disabled = confirmAlignmentButton.disabled || isLoading || !showPortAlign;
         proceedButton.disabled = isLoading || !showProceed; playAgainButton.disabled = isLoading || !showGameOver;
         startButton.disabled = isLoading; rulesButton.disabled = isLoading; backButton.disabled = isLoading;
         diceSelectInput.disabled = isLoading || !showDiceSelect;
    }

    // --- Challenge Setup Functions ---
    // Added console logs to setup functions
    function setupTargetSumChallenge() {
        console.log("DEBUG: Setting up TargetSum challenge.");
        const minDiceRequired = 1; const baseMaxDice = 4;
        const maxDiceAllowed = Math.min(dataPackets, baseMaxDice);
        let target = Math.floor(Math.random() * 5) + 8; // 8..12
        target = Math.min(target, maxDiceAllowed * DICE_SIDES);
        if (minDiceRequired > dataPackets || target < minDiceRequired * 1) {
            console.warn("DEBUG: TargetSum impossible, fallback."); return setupSecureCache();
        }
        currentChallenge = { type: 'target_sum', description: `> Node ${nodeNumber}: Overload Threshold Alpha.\n> Combined signature must exceed ${target}.\n> Commit ${minDiceRequired}-${maxDiceAllowed} packets. (Bonus for using <= 2 packets)`, maxDiceAllowed, minDiceRequired, target, message: '' };
    }

     function setupTargetUnderChallenge() {
        console.log("DEBUG: Setting up TargetUnder challenge.");
        const minDiceRequired = 1; const baseMaxDice = 5;
        const maxDiceAllowed = Math.min(dataPackets, baseMaxDice);
        let target = Math.floor(Math.random() * 4) + 5; // 5..8
        target = Math.max(target, minDiceRequired * 1 + 1);
        if (minDiceRequired > dataPackets || target <= minDiceRequired) {
            console.warn("DEBUG: TargetUnder impossible, fallback."); return setupSecureCache();
        }
        currentChallenge = { type: 'target_under', description: `> Node ${nodeNumber}: Sub-Signature Protocol Beta.\n> Total signature must be less than ${target}.\n> Commit ${minDiceRequired}-${maxDiceAllowed} packets. (Bonus for using >= 3 packets)`, maxDiceAllowed, minDiceRequired, target, message: '' };
    }

     function setupSpecificNumberChallenge() {
        console.log("DEBUG: Setting up SpecificNumber challenge.");
        const minDiceRequired = 3; const baseMaxDice = 6;
        const maxDiceAllowed = Math.min(dataPackets, baseMaxDice);
        const targetNumber = Math.floor(Math.random() * DICE_SIDES) + 1;
        const requiredCount = Math.random() < 0.6 ? 1 : 2;
        if (minDiceRequired > dataPackets || minDiceRequired > maxDiceAllowed) {
             console.warn("DEBUG: SpecificNumber impossible, falling back."); return setupTargetSumChallenge();
        }
        currentChallenge = { type: 'specific_number', description: `> Node ${nodeNumber}: Resonance Lock Zeta.\n> Requires ${requiredCount} packet(s) resonating at [ ${targetNumber} ].\n> Commit ${minDiceRequired}-${maxDiceAllowed} packets.`, maxDiceAllowed, minDiceRequired, targetNumber, requiredCount, message: '' };
    }

    function setupPortAlignmentChallenge() {
        console.log("DEBUG: Setting up PortAlignment challenge.");
         const portCount = Math.floor(Math.random() * 3) + 3;
         const portValues = [];
         for (let i = 0; i < portCount; i++) { portValues.push(Math.floor(Math.random() * DICE_SIDES) + 1); }
         const minDiceRequired = 1; const baseMaxDice = 8;
         const maxDiceAllowed = Math.min(dataPackets, baseMaxDice);
         if (minDiceRequired > dataPackets) { console.warn("DEBUG: PortAlignment impossible, fallback."); return setupSecureCache(); }
         const portDisplay = portValues.map((val, index) => `[P${index + 1}:${val}]`).join(' ');
         currentChallenge = { type: 'port_alignment', description: `> Node ${nodeNumber}: Multi-Port Security Matrix.\n> Align packets (>=) to breach all ports: ${portDisplay}\n> Commit ${minDiceRequired}-${maxDiceAllowed} packets. Failure breaches Integrity.`, maxDiceAllowed, minDiceRequired, portCount, portValues, message: '' };
     }

    function setupSecureCache() {
        console.log("DEBUG: Setting up SecureCache event.");
         const canGainIntegrity = integrityPoints < STARTING_INTEGRITY;
         const packetsToGain = (Math.random() < 0.6) ? 1 : 2;
         let message = `> Node ${nodeNumber}: Found Secure Data Cache!`;
         if (canGainIntegrity) { integrityPoints++; message += `\n> Connection Integrity stabilized (+1 Integrity).`; }
         else { message += `\n> Integrity already optimal.`; }
         dataPackets += packetsToGain; message += `\n> Recovered ${packetsToGain} Data Packet(s).`;
         currentChallenge = { type: 'event', description: message, message: '' };
     }

     function setupPacketLossRisk() {
        console.log("DEBUG: Setting up PacketLossRisk event.");
         const riskFactor = Math.random(); let message = `> Node ${nodeNumber}: Unstable Datastream Detected!`; let effectApplied = false;
         if (riskFactor < 0.3 && dataPackets > 1) { dataPackets--; message += `\n> A Data Packet was corrupted! (-1 Packet)`; effectApplied = true; }
         else if (riskFactor < 0.6 && integrityPoints > 1) { integrityPoints--; message += `\n> Minor connection instability! (-1 Integrity)`; effectApplied = true; }
         if (!effectApplied) { message += `\n> Managed to stabilize the connection without loss.`; }
         currentChallenge = { type: 'event', description: message, message: '' };
     }

     function setupBonusGuess() {
        console.log("DEBUG: Setting up BonusGuess challenge.");
        const maxDice = Math.min(dataPackets, Math.max(1, 3 + Math.floor(nodeNumber / 5)));
        const minDiceRequired = 1;
        const targetNumber = Math.floor(Math.random() * DICE_SIDES) + 1;
        if (minDiceRequired > dataPackets) { console.warn("DEBUG: BonusGuess impossible, fallback."); return setupSecureCache(); }
        currentChallenge = { type: 'bonus_guess', description: `> BONUS NODE DETECTED: High-Gain Data Spike Opportunity!\n> Interface requires matching frequency [ ${targetNumber} ].\n> Success: Bonus Score + Recover committed packets.\n> Failure: Lose committed packets (Integrity Unaffected).\n> This route is optional. Commit ${minDiceRequired}-${maxDiceAllowed} packets OR [Bypass Route].`, maxDiceAllowed, minDiceRequired, targetNumber, message: '' };
    }

    // --- Glitch Effect Timer ---
    let glitchTimer = null;
    function startGlitchTimer() {
        console.log("DEBUG: startGlitchTimer called.");
        if (glitchTimer) clearInterval(glitchTimer);
        function triggerGlitch() {
            const elements = [ /* ... */ ].filter(el => el != null);
            if (elements.length === 0) { /* ... schedule next ... */ return; }
            const targetElement = elements[Math.floor(Math.random() * elements.length)];
            targetElement.classList.add('glitch-active');
            setTimeout(() => { if (targetElement) targetElement.classList.remove('glitch-active'); }, GLITCH_DURATION);
            const nextGlitchTime = GLITCH_INTERVAL / 2 + Math.random() * GLITCH_INTERVAL;
            glitchTimer = setTimeout(triggerGlitch, Math.max(300, nextGlitchTime));
        }
        glitchTimer = setTimeout(triggerGlitch, 500 + Math.random() * 1000);
    }
    function stopGlitchTimer() {
        console.log("DEBUG: stopGlitchTimer called.");
         if (glitchTimer) clearTimeout(glitchTimer); glitchTimer = null;
         document.querySelectorAll('.glitch-active').forEach(el => el.classList.remove('glitch-active'));
    }

    // --- Event Listeners ---
    console.log("DEBUG: Adding event listeners.");
    startButton.addEventListener('click', () => { console.log("DEBUG: Start Button clicked."); enableSoundInteraction(); startGame(); });
    rulesButton.addEventListener('click', () => { console.log("DEBUG: Rules Button clicked."); enableSoundInteraction(); showRules(); });
    backButton.addEventListener('click', () => { console.log("DEBUG: Back Button clicked."); enableSoundInteraction(); hideRules(); });
    commitButton.addEventListener('click', commitPackets);
    skipBonusButton.addEventListener('click', skipBonusNode);
    confirmAlignmentButton.addEventListener('click', confirmAlignment);
    proceedButton.addEventListener('click', proceed);
    playAgainButton.addEventListener('click', () => { console.log("DEBUG: Play Again Button clicked."); startGame(); });
    diceSelectInput.addEventListener('keydown', (event) => { if (event.key === 'Enter' && gameState === 'awaiting_selection' && !commitButton.disabled) { event.preventDefault(); commitPackets(); } });
    diceSelectInput.addEventListener('input', () => { const val = parseInt(diceSelectInput.value); const min = parseInt(diceSelectInput.min); const max = parseInt(diceSelectInput.max); if (isNaN(val)) return; if (val < min) diceSelectInput.value = min; if (val > max) diceSelectInput.value = max; });

    // --- Initial Setup ---
    console.log("DEBUG: Performing initial setup.");
    highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0');
    integrityPointsEl.textContent = STARTING_INTEGRITY;
    dataPacketsEl.textContent = STARTING_PACKETS;
    nodeDescriptionEl.textContent = '> Standby...'; // This should be quickly overwritten by startGame's typeWriter
    nodeMessageEl.textContent = '';
    updateUI();
    console.log("DEBUG: Initial setup complete. Waiting for user interaction.");

}); // End DOMContentLoaded