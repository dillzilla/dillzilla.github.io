// --- DOM Elements ---
const screens = {
    start: document.getElementById('start-screen'),
    rules: document.getElementById('rules-screen'),
    loading: document.getElementById('loading-screen'),
    game: document.getElementById('game-screen'),
    end: document.getElementById('end-screen'),
};
const startButton = document.getElementById('start-button');
const rulesButton = document.getElementById('rules-button');
const closeRulesButton = document.getElementById('close-rules-button');
const loadingText = document.getElementById('loading-text');
const levelDisplay = document.getElementById('level-display');
const sentenceNumDisplay = document.getElementById('sentence-num-display');
const targetWpmDisplay = document.getElementById('target-wpm-display');
const currentWpmDisplay = document.getElementById('current-wpm-display');
const sentencePrompt = document.getElementById('sentence-prompt');
const startSentenceButton = document.getElementById('start-sentence-button'); // Check HTML ID!
const sentenceDisplayWrapper = document.getElementById('sentence-display-wrapper');
const sentenceDisplay = document.getElementById('sentence-display'); // Target for fuzziness
const typingInput = document.getElementById('typing-input');
const userProgressBar = document.getElementById('user-progress-bar');
const computerProgressBar = document.getElementById('computer-progress-bar');
const endGameButton = document.getElementById('end-game-button');
const endTitle = document.getElementById('end-title');
const endMessage = document.getElementById('end-message');
const finalLevelDisplay = document.getElementById('final-level');
const finalWpmDisplay = document.getElementById('final-wpm');
const restartButton = document.getElementById('restart-button');

// --- Game State ---
let currentLevel = 1;
let sentencesCompletedInLevel = 0;
const sentencesPerLevel = 3;
let targetWPM = 0;
let baseWPM = 20;
let wpmIncrement = 5;
let currentSentence = '';
let sentenceChars = [];
let startTime = 0;
let timerInterval = null;
let computerInterval = null;
let highestWPM = 0;
let gameActive = false;
let currentTimeoutId = null;
let isShaking = false;
let isBackgroundMusic1Playing = true;
let sentenceErrorCount = 0;

// --- Constants ---
const MAX_ERRORS_FOR_FUZZ = 10;
const MAX_FUZZ_BLUR = 3.5;

// --- SENTENCE DATA (Local Lookup) ---
const sentencesByLevel = {
     1: [ // ~6th Grade
        "The quick brown fox jumps over the lazy dog.",
        "School is fun when you learn new things every day.",
        "My favorite color is blue because it reminds me of the sky.",
        "Playing outside with friends is a great way to spend the afternoon.",
        "Reading books can take you on amazing adventures in your mind.",
        "The sun is very bright today, wear your sunglasses outside.",
        "Birds sing beautiful songs early in the morning time.",
        "We ate pizza for dinner last night and it was delicious.",
        "Remember to always brush your teeth before going to bed.",
        "My cat likes to sleep in a warm and sunny spot.",
        "The tall green trees provide shade on hot summer days.",
        "Look both ways before you cross the busy street.",
        "Learning to ride a bike takes practice but is rewarding.",
        "The moon looks very big and bright in the dark night.",
        "It is important to be kind to everyone you meet.",
        "Water is essential for all living things to survive.",
        "The stars twinkle brightly against the black velvet sky.",
        "Drawing pictures allows you to show your imagination.",
        "Helping others can make you feel very good inside.",
        "What is your favorite animal at the big city zoo?"
    ],
    2: [ // ~8th Grade
        "Technology connects people across vast distances almost instantly.",
        "Exploring different cultures helps us understand the world better.",
        "Regular exercise is important for maintaining physical health.",
        "The scientific method involves observation, hypothesis, and testing.",
        "Many historical events have shaped the society we live in today.",
        "Effective communication requires listening as well as speaking clearly.",
        "Volunteering in the community can be a very fulfilling experience.",
        "The internet provides access to an enormous amount of information.",
        "Environmental conservation is crucial for protecting our planet's future.",
        "Understanding basic economics helps manage personal finances wisely.",
        "Different musical genres evoke a wide range of human emotions.",
        "The solar system contains planets, moons, asteroids, and comets.",
        "Critical thinking allows us to analyze information objectively.",
        "Learning a second language opens up new opportunities and perspectives.",
        "Public libraries offer free access to books and various resources.",
        "The government has three branches with separate powers.",
        "Proper nutrition provides the energy needed for daily activities.",
        "Climate change presents significant challenges for global communities.",
        "Ancient civilizations developed unique forms of art and architecture.",
        "Responsible digital citizenship means using technology safely and ethically."
    ],
    3: [ // ~10th Grade (includes commas)
        "Preparing for exams, students often review notes and practice problems.",
        "Although challenging, learning advanced mathematics builds strong logic skills.",
        "Many factors, such as genetics and lifestyle, influence overall health.",
        "The Industrial Revolution, beginning in Great Britain, transformed manufacturing.",
        "Shakespeare's plays, including Hamlet and Romeo and Juliet, are studied worldwide.",
        "To write effectively, one must organize thoughts clearly and use precise language.",
        "Renewable energy sources, like solar and wind power, offer sustainable alternatives.",
        "Global trade connects economies, allowing for the exchange of goods and services.",
        "Understanding different political ideologies, such as democracy and socialism, is complex.",
        "Artistic movements, for example Impressionism, reflect the cultural values of their time.",
        "Biological diversity, often called biodiversity, is vital for ecosystem stability.",
        "The development of the printing press, a major invention, democratized knowledge access.",
        "Analyzing literature involves examining themes, characters, plot, and literary devices.",
        "Space exploration continues to expand our knowledge of the universe, revealing wonders.",
        "Ethical dilemmas often arise in fields like medicine, business, and technology.",
        "Participating in team sports teaches valuable lessons about collaboration, discipline, and resilience.",
        "The Constitution outlines the fundamental laws and principles governing the nation, ensuring rights.",
        "Computer programming requires logical thinking, attention to detail, and problem-solving skills.",
        "Geological processes, including erosion and plate tectonics, shape the Earth's surface over millennia.",
        "Studying philosophy encourages deep reflection on existence, knowledge, values, reason, and mind."
    ],
    4: [ // ~12th Grade (more complex structure/punctuation)
        "Investigating complex historical narratives requires synthesizing evidence from multiple primary sources.",
        "The intricate balance of neurotransmitters significantly impacts cognitive function and emotional states.",
        "Developing a compelling argument involves not only stating claims but also supporting them rigorously.",
        "While technological advancements offer convenience, they also raise profound questions about privacy.",
        "Quantum mechanics describes the behavior of matter and energy at atomic and subatomic levels; it's counterintuitive.",
        "Understanding macroeconomic indicators, such as GDP and inflation rates, is essential for economic forecasting.",
        "Appreciating diverse artistic expressions, from classical music to contemporary installations, enriches cultural literacy.",
        "The principles of aerodynamic design are crucial for engineering efficient and safe aircraft.",
        "International relations are often shaped by a complex interplay of diplomacy, economic interests, and power dynamics.",
        "Genetic engineering presents both remarkable therapeutic possibilities and significant ethical considerations for society.",
        "Effective leadership often necessitates adaptability, clear communication, and the ability to inspire collective action.",
        "Analyzing the subtext in literary works can reveal deeper meanings and authorial intentions unspoken directly.",
        "The ongoing debate surrounding artificial intelligence ethics centers on issues like autonomy, bias, and responsibility.",
        "Sustainable urban planning seeks to create cities that are environmentally sound, socially equitable, and economically viable.",
        "Philosophical inquiries into the nature of consciousness remain one of the most challenging intellectual frontiers.",
        "Climate modeling utilizes complex algorithms and vast datasets to project future environmental scenarios with uncertainty.",
        "Mastering rhetorical strategies allows speakers and writers to persuade audiences more effectively through careful language.",
        "The symbiotic relationships between different species are fundamental to the intricate functioning of most ecosystems.",
        "Navigating the complexities of the modern legal system often requires specialized knowledge and expert guidance.",
        "Psychological research employs various methodologies, including experimentation and correlational studies, to understand behavior."
    ],
     5: [ // ~University/Complex (can be reused for levels 5+)
        "Examining the epistemological foundations of scientific inquiry reveals inherent assumptions about observation and reality.",
        "The intricate interplay between political economy and cultural hegemony shapes societal structures and individual agency profoundly.",
        "Bioinformatics leverages computational tools to analyze vast biological datasets; this accelerates discovery in genomics.",
        "Deconstructing postmodern literary theory requires grappling with concepts like simulation, intertextuality, and the decentered subject.",
        "Neuroplasticity demonstrates the brain's remarkable capacity for adaptation, reorganizing its structure throughout life.",
        "Comparative mythology identifies recurring archetypes and narrative patterns across disparate global cultures and traditions.",
        "Advanced econometric modeling attempts to quantify complex causal relationships within dynamic economic systems, facing challenges.",
        "The ethical implications of anthropogenic climate change necessitate a global reevaluation of consumption patterns and resource allocation.",
        "Understanding the nuances of international law, particularly concerning state sovereignty and intervention, is perpetually debated.",
        "Chaos theory illustrates how seemingly random behavior in deterministic systems can arise from sensitivity to initial conditions.",
        "The phenomenology of perception challenges traditional subject-object dichotomies, emphasizing embodied experience and intentionality.",
        "Molecular gastronomy applies scientific principles to transform food textures, flavors, and appearances in innovative ways.",
        "Sociolinguistic variation highlights the complex relationship between language use, social identity, and power structures within communities.",
        "Cryo-electron microscopy allows scientists to visualize complex biomolecular structures at near-atomic resolution, revolutionizing structural biology.",
        "The philosophical problem of induction questions the justification for generalizing from specific observations to universal laws.",
        "Analyzing algorithmic bias requires investigating the data, design choices, and societal contexts in which machine learning systems operate.",
        "Geopolitical strategy involves assessing long-term risks, opportunities, and power balances within the dynamic international arena.",
        "Theoretical physics explores fundamental constituents of the universe, including string theory and quantum gravity, often beyond empirical verification.",
        "Conservation genetics utilizes molecular tools to inform strategies for preserving biodiversity and managing endangered populations effectively.",
        "Critical discourse analysis examines how language constructs, maintains, and challenges social inequalities and power relations within society."
    ]
    // Add more sentences as needed
};
const MAX_DEFINED_LEVEL = Object.keys(sentencesByLevel).length;

// --- Debugging ---
const DEBUG = true;
function logDebug(message, ...args) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, ...args);
    }
}

// --- Sound Effects ---
const sounds = {
    click: new Audio('sounds/click.mp3'),
    computerLoading: new Audio('sounds/loading.mp3'),
    error: new Audio('sounds/error.mp3'),
    backgroundMusic1: new Audio('sounds/background1.mp3'),
    backgroundMusic2: new Audio('sounds/background2.mp3'),
    endGameMusic: new Audio('sounds/end_game.mp3')
};

// Configure loops
sounds.backgroundMusic1.loop = false;
sounds.backgroundMusic2.loop = false;
sounds.computerLoading.loop = true;

// Sound helper functions
function playSound(soundName) {
    const sound = sounds[soundName];
    if (sound && typeof sound.play === 'function') {
        sound.currentTime = 0;
        sound.play().then(() => { logDebug(`Playing sound: ${soundName}`); })
                    .catch(e => { console.error(`Error playing ${soundName}:`, e); });
    } else { logDebug(`Sound not found or invalid: ${soundName}`); }
}

function stopSound(soundName) {
    const sound = sounds[soundName];
    if (sound && typeof sound.pause === 'function') {
        sound.pause();
        // Setting currentTime = 0 after pause can sometimes cause issues if the sound state isn't ready.
        // Try setting it *before* pause or just let playSound handle rewind. Resetting is mainly needed if you might resume.
        try {
             sound.currentTime = 0;
        } catch (e) {
             console.warn(`Could not reset currentTime for ${soundName} after pause: ${e}`);
        }
        logDebug(`Stopping sound: ${soundName}`);
    }
}

function stopAllSounds() {
    logDebug("Stopping all sounds");
    Object.keys(sounds).forEach(key => stopSound(key));
}

function playNextBackgroundTrack() {
    if (isBackgroundMusic1Playing) {
        logDebug("Background Music 1 ended, switching to Background Music 2");
        playSound('backgroundMusic2');
        isBackgroundMusic1Playing = false;
    } else {
        logDebug("Background Music 2 ended, switching to Background Music 1");
        playSound('backgroundMusic1');
        isBackgroundMusic1Playing = true;
    }
}

function stopBackgroundMusic() {
    logDebug("Stopping background music and removing listeners");
    stopSound('backgroundMusic1');
    stopSound('backgroundMusic2');
    if (sounds.backgroundMusic1 && typeof sounds.backgroundMusic1.removeEventListener === 'function') {
      sounds.backgroundMusic1.removeEventListener('ended', playNextBackgroundTrack);
    }
    if (sounds.backgroundMusic2 && typeof sounds.backgroundMusic2.removeEventListener === 'function') {
      sounds.backgroundMusic2.removeEventListener('ended', playNextBackgroundTrack);
    }
}

// Attach 'ended' listeners safely
if (sounds.backgroundMusic1 && typeof sounds.backgroundMusic1.addEventListener === 'function') {
    sounds.backgroundMusic1.addEventListener('ended', playNextBackgroundTrack);
} else { console.error("Could not add 'ended' listener to backgroundMusic1"); }
if (sounds.backgroundMusic2 && typeof sounds.backgroundMusic2.addEventListener === 'function') {
    sounds.backgroundMusic2.addEventListener('ended', playNextBackgroundTrack);
} else { console.error("Could not add 'ended' listener to backgroundMusic2"); }


// --- Screen Management ---
function showScreen(screenName) {
    logDebug(`Showing screen: ${screenName}`);
    stopSound('computerLoading');

    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });

    if (screens[screenName]) {
        screens[screenName].classList.add('active');
        if (screenName === 'loading') {
            playSound('computerLoading');
        }
    } else {
        console.error(`Screen "${screenName}" not found!`);
    }
}

// --- Function to get sentence locally ---
function getSentenceForLevel(level) {
    logDebug(`Getting sentence locally for level ${level}`);
    const levelKey = level > MAX_DEFINED_LEVEL ? MAX_DEFINED_LEVEL : level;
    const levelSentences = sentencesByLevel[levelKey];

    if (!levelSentences || levelSentences.length === 0) {
        console.error(`No sentences defined for level key ${levelKey} (original level ${level})`);
        return "Error: Sentence data missing.";
    }

    const randomIndex = Math.floor(Math.random() * levelSentences.length);
    const sentence = levelSentences[randomIndex];
    logDebug(`Selected sentence for level ${level} (using key ${levelKey}): "${sentence}"`);
    return sentence;
}

// --- resetSentenceUI Function Definition ---
function resetSentenceUI() {
    logDebug("Resetting Sentence UI elements");

    if (typingInput) {
        typingInput.value = '';
        typingInput.disabled = true;
    }
    if (sentenceDisplay) {
        // Spans are cleared/recreated in prepareSentenceDisplay
        sentenceDisplay.style.filter = 'none';
        sentenceDisplay.style.textShadow = 'none';
    } else {
        logDebug("Warning: sentenceDisplay element not found during sentence reset.");
    }
    sentenceErrorCount = 0;
    logDebug("Fuzziness reset for sentence.");

    sentenceChars.forEach(span => { if(span) span.className = ''; }); // Clear span classes

    if (userProgressBar) userProgressBar.style.width = '0%';
    if (computerProgressBar) {
        computerProgressBar.style.width = '0%';
        computerProgressBar.classList.remove('pulse-medium', 'pulse-critical');
        computerProgressBar.style.backgroundColor = '';
    } else {
        logDebug("Warning: computerProgressBar element not found during sentence reset.");
    }

    isShaking = false;
    if (document.body) {
        document.body.classList.remove('shakeOnError');
    }
}

// --- resetGameUI Function Definition ---
function resetGameUI() {
    logDebug("Resetting Game UI completely");

    // Reset overall game state displays
    if (levelDisplay) levelDisplay.textContent = '1';
    if (sentenceNumDisplay) sentenceNumDisplay.textContent = '1';
    if (targetWpmDisplay) targetWpmDisplay.textContent = '0';
    if (currentWpmDisplay) currentWpmDisplay.textContent = '0';

    // Call resetSentenceUI to handle sentence-specific parts
    resetSentenceUI();

    // Reset Prompts/Buttons visibility for a new game start
    if(sentencePrompt) {
        sentencePrompt.textContent = 'Prepare to type. Press "Start Task" when ready.';
        sentencePrompt.style.display = 'block';
    }
    if(startSentenceButton) startSentenceButton.style.display = 'none';
    if(sentenceDisplayWrapper) sentenceDisplayWrapper.style.display = 'none';
}

// --- Game Logic ---
function startGame() {
    logDebug("Starting game...");
    stopAllSounds();
    stopBackgroundMusic();
    playSound('click'); // Play click inside here

    isBackgroundMusic1Playing = true;
    playSound('backgroundMusic1');

    // Re-add listeners safely
    if (sounds.backgroundMusic1 && typeof sounds.backgroundMusic1.addEventListener === 'function') {
        sounds.backgroundMusic1.removeEventListener('ended', playNextBackgroundTrack);
        sounds.backgroundMusic1.addEventListener('ended', playNextBackgroundTrack);
    }
    if (sounds.backgroundMusic2 && typeof sounds.backgroundMusic2.addEventListener === 'function') {
        sounds.backgroundMusic2.removeEventListener('ended', playNextBackgroundTrack);
        sounds.backgroundMusic2.addEventListener('ended', playNextBackgroundTrack);
    }

    currentLevel = 1;
    sentencesCompletedInLevel = 0;
    highestWPM = 0;
    gameActive = true;

    resetGameUI();
    loadLevel();
}

// --- loadLevel ---
function loadLevel() {
    logDebug(`Loading level ${currentLevel}`);
    showScreen('loading');

    // WPM scaling logic
    if (currentLevel === 1) { targetWPM = 20; }
    else if (currentLevel <= 3) { targetWPM = 25 + (currentLevel - 2) * 7; }
    else if (currentLevel <= 6) { targetWPM = 40 + (currentLevel - 4) * 8; }
    else { targetWPM = 60 + (currentLevel - 7) * 10; }

    if(levelDisplay) levelDisplay.textContent = currentLevel;
    if(targetWpmDisplay) targetWpmDisplay.textContent = targetWPM;
    if(sentenceNumDisplay) sentenceNumDisplay.textContent = sentencesCompletedInLevel + 1;

    fetchAndPrepareSentence();
}

// --- fetchAndPrepareSentence ---
async function fetchAndPrepareSentence() {
    if(loadingText) loadingText.textContent = `Loading challenge matrix for level ${currentLevel}...`;
    playSound('computerLoading');

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading

    currentSentence = getSentenceForLevel(currentLevel);
    stopSound('computerLoading');

    prepareSentenceDisplay(); // Prepare spans
    showScreen('game'); // Show the game screen

    // Reset sentence specific UI *after* showing screen and preparing spans
    resetSentenceUI();

    // Update sentence number display *after* reset
    if(sentenceNumDisplay) sentenceNumDisplay.textContent = sentencesCompletedInLevel + 1;

    // Setup for starting the task
    if(sentencePrompt) {
        sentencePrompt.textContent = 'Prepare to type. Press "Start Task" when ready.';
        sentencePrompt.style.display = 'block';
    }
    if(startSentenceButton) { // Ensure button exists before showing
        startSentenceButton.style.display = 'block';
        logDebug("Start Task button should be visible now.");
    } else {
        console.error("Start Task button element not found!");
    }
    if(sentenceDisplayWrapper) sentenceDisplayWrapper.style.display = 'none'; // Hide actual sentence
    if(typingInput) typingInput.disabled = true; // Input disabled until start
}

// --- prepareSentenceDisplay ---
function prepareSentenceDisplay() {
    logDebug("Preparing sentence display");
    if (!sentenceDisplay) { console.error("Sentence display element not found!"); return; }
    sentenceDisplay.innerHTML = ''; // Clear previous spans
    sentenceChars = currentSentence.split('').map(char => {
        const span = document.createElement('span');
        span.textContent = char;
        sentenceDisplay.appendChild(span);
        return span; // Store the span element
    });
    logDebug(`Sentence prepared with ${sentenceChars.length} characters.`);
}

// --- startTypingSession ---
function startTypingSession() {
    logDebug("Starting typing session for the current sentence");
    playSound('click');

    if(startSentenceButton) startSentenceButton.style.display = 'none';
    if(sentencePrompt) sentencePrompt.style.display = 'none';
    if(sentenceDisplayWrapper) sentenceDisplayWrapper.style.display = 'block'; // Show sentence
    if(typingInput) {
        typingInput.disabled = false;
        typingInput.focus();
    }

    resetTimers();
    startTime = new Date().getTime();
    gameActive = true;
    isShaking = false;
    sentenceErrorCount = 0;
    updateFuzziness(sentenceErrorCount); // Reset visual fuzziness

    timerInterval = setInterval(updateWPM, 500);

    // Computer Progress Interval
    const sentenceLength = currentSentence.length;
    const safeTargetWPM = Math.max(1, targetWPM);
    const computerTimeMs = (sentenceLength / 5) / safeTargetWPM * 60 * 1000;
    const computerUpdateInterval = 50;
    let computerProgress = 0;
    const increment = computerTimeMs > 0 ? (computerUpdateInterval / computerTimeMs) * 100 : 0;
    logDebug(`Computer estimated time: ${computerTimeMs > 0 ? (computerTimeMs / 1000).toFixed(2) : 'N/A'}s`);

    computerInterval = setInterval(() => {
        if (!gameActive || !computerProgressBar || increment <= 0) {
            clearInterval(computerInterval); return;
        }
        computerProgress += increment;
        const currentWidth = Math.min(computerProgress, 100);
        computerProgressBar.style.width = `${currentWidth}%`;

        // Handle Color Pulsing
        if (currentWidth >= 80) {
             if (!computerProgressBar.classList.contains('pulse-critical')) {
                logDebug("Progress >= 80%, add critical pulse");
                computerProgressBar.classList.remove('pulse-medium');
                computerProgressBar.classList.add('pulse-critical');
             }
        } else if (currentWidth >= 50) {
             if (!computerProgressBar.classList.contains('pulse-medium') && !computerProgressBar.classList.contains('pulse-critical')) {
                 logDebug("Progress >= 50%, add medium pulse");
                 computerProgressBar.classList.add('pulse-medium');
             }
        } else {
            if (computerProgressBar.classList.contains('pulse-medium') || computerProgressBar.classList.contains('pulse-critical')) {
                 logDebug("Progress < 50%, removing pulses");
                 computerProgressBar.classList.remove('pulse-medium', 'pulse-critical');
                 computerProgressBar.style.backgroundColor = '';
            }
        }
        if (computerProgress >= 100) { handleSentenceLoss("System progress reached 100%."); }
    }, computerUpdateInterval);
}

// --- triggerErrorShake ---
function triggerErrorShake() {
    if (isShaking || !document.body) return;
    playSound('error');
    const body = document.body;
    isShaking = true;
    body.classList.add('shakeOnError');
    logDebug("Shake triggered on error!");
    setTimeout(() => {
        if (body) body.classList.remove('shakeOnError');
        isShaking = false;
    }, 300);
}

// --- Function to generate static text shadow ---
function generateStaticShadow(intensity) {
    if (intensity <= 0) return 'none';
    const baseOpacity = Math.min(0.6, intensity * 0.5);
    const spread = Math.min(2.0, intensity * 1.5);
    let shadow = '';
    const numShadows = 2 + Math.floor(intensity * 3);
    for (let i = 0; i < numShadows; i++) {
        const xOff = (Math.random() - 0.5) * spread * 2;
        const yOff = (Math.random() - 0.5) * spread * 2;
        const opacity = Math.max(0, Math.min(1, (Math.random() * 0.6 + 0.4) * baseOpacity));
        shadow += `${xOff.toFixed(1)}px ${yOff.toFixed(1)}px 0px rgba(220, 220, 220, ${opacity.toFixed(2)}), `;
    }
    return shadow.slice(0, -2);
}

// --- Function to update sentence fuzziness ---
function updateFuzziness(errorCount) {
    if (!sentenceDisplay) { logDebug("Cannot update fuzziness - sentenceDisplay not found."); return; }
    const clampedErrorCount = Math.min(errorCount, MAX_ERRORS_FOR_FUZZ);
    const intensity = clampedErrorCount / MAX_ERRORS_FOR_FUZZ;
    const blurValue = intensity * MAX_FUZZ_BLUR;
    const shadowValue = generateStaticShadow(intensity);
    logDebug(`Updating fuzziness: Errors=${errorCount} (Clamped=${clampedErrorCount}), Intensity=${intensity.toFixed(2)}, Blur=${blurValue.toFixed(1)}px`);
    sentenceDisplay.style.filter = `blur(${blurValue.toFixed(1)}px)`;
    sentenceDisplay.style.textShadow = shadowValue;
}

// --- handleTyping (Force Correct Letter + Fuzziness) ---
function handleTyping() {
    if (!gameActive || !sentenceChars || sentenceChars.length === 0 || !typingInput) return;

    const typedText = typingInput.value;
    const typedLength = typedText.length;
    let currentTargetIndex = 0;

    // Find first mismatch
    while (currentTargetIndex < typedLength && currentTargetIndex < currentSentence.length) {
        if (typedText[currentTargetIndex] === currentSentence[currentTargetIndex]) {
            currentTargetIndex++;
        } else { break; } // Mismatch
    }

    // If mismatch occurred before end of typed text
    if (currentTargetIndex < typedLength) {
        logDebug(`Error at index ${currentTargetIndex}. Typed: '${typedText[currentTargetIndex]}', Expected: '${currentSentence[currentTargetIndex]}'`);
        sentenceErrorCount++;
        updateFuzziness(sentenceErrorCount);
        triggerErrorShake();
        typingInput.value = typedText.slice(0, currentTargetIndex); // Correct input
        return; // Stop processing this input event further
    }

    // --- Update Highlighting (only if no error correction happened in this event) ---
    const finalTypedLength = typingInput.value.length; // Use current length
    sentenceChars.forEach((charSpan, index) => {
        if (!charSpan) return;
        charSpan.className = ''; // Clear
        if (index < finalTypedLength) {
            charSpan.classList.add('correct');
        } else if (index === finalTypedLength && index < sentenceChars.length) {
            charSpan.classList.add('current');
        }
    });

    // Update User Progress Bar
    const userProgress = finalTypedLength > 0 ? (finalTypedLength / currentSentence.length) * 100 : 0;
    if (userProgressBar) userProgressBar.style.width = `${Math.min(userProgress, 100)}%`;

    // Check for sentence completion
    if (finalTypedLength === currentSentence.length) {
         // Ensure we didn't *just* correct an error on the last char
        if (currentTargetIndex === finalTypedLength) {
             setTimeout(handleSentenceWin, 50);
        }
    }
}

// --- updateWPM ---
function updateWPM() {
    if (!gameActive || startTime === 0) return;
    const now = new Date().getTime();
    const timeElapsedSeconds = (now - startTime) / 1000;
    if (timeElapsedSeconds <= 0) return;
    const typedText = typingInput ? typingInput.value : '';
    const correctCharsCount = typedText.length;
    const wordCount = correctCharsCount / 5;
    const wpm = Math.round(wordCount / (timeElapsedSeconds / 60));
    if(currentWpmDisplay) currentWpmDisplay.textContent = wpm >= 0 ? wpm : 0;
    if (wpm > highestWPM) { highestWPM = wpm; }
}

// --- handleSentenceWin ---
function handleSentenceWin() {
    if (!gameActive) return;
    logDebug("Sentence Win!");
    gameActive = false;
    resetTimers();
    updateWPM(); // Final WPM
    if(typingInput) typingInput.disabled = true;

    sentencesCompletedInLevel++;
    if(sentenceNumDisplay) sentenceNumDisplay.textContent = Math.min(sentencesCompletedInLevel + 1, sentencesPerLevel);

    if (sentencesCompletedInLevel >= sentencesPerLevel) {
        logDebug(`Level ${currentLevel} complete!`);
        if(sentencePrompt) {
            sentencePrompt.textContent = `Level ${currentLevel} Cleared! Preparing next challenge...`;
            sentencePrompt.style.display = 'block';
        }
        if(sentenceDisplayWrapper) sentenceDisplayWrapper.style.display = 'none';
        setTimeout(() => {
            currentLevel++;
            sentencesCompletedInLevel = 0;
            loadLevel();
        }, 2500);
    } else {
        logDebug(`Sentence ${sentencesCompletedInLevel}/${sentencesPerLevel} completed.`);
         if(sentencePrompt) {
            sentencePrompt.textContent = `Sentence ${sentencesCompletedInLevel}/${sentencesPerLevel} complete! Get ready...`;
            sentencePrompt.style.display = 'block';
         }
        if(sentenceDisplayWrapper) sentenceDisplayWrapper.style.display = 'none';
        setTimeout(fetchAndPrepareSentence, 2000);
    }
}

// --- handleSentenceLoss ---
function handleSentenceLoss(reason) {
     if (!gameActive) return;
    logDebug(`Sentence Loss: ${reason}`);
    gameActive = false;
    resetTimers();
    if(typingInput) typingInput.disabled = true;
    endGame(`Failed Level ${currentLevel}. ${reason}`);
}

// --- endGame ---
function endGame(reason = "Manual Abort") {
    logDebug(`Ending game. Reason: ${reason}`);
    gameActive = false;
    resetTimers();
    stopBackgroundMusic();
    stopSound('computerLoading');
    playSound('endGameMusic');

    updateWPM(); // Final update

    if (endTitle) endTitle.textContent = reason.includes("Failed") ? "System Lockout" : "Session Terminated";
    if (endMessage) endMessage.textContent = `Reason: ${reason}`;
    if (finalLevelDisplay) finalLevelDisplay.textContent = currentLevel;
    if (finalWpmDisplay) finalWpmDisplay.textContent = highestWPM;

    showScreen('end');
}

// --- restartGame ---
function restartGame() {
    logDebug("Restarting game...");
    playSound('click');
    startGame();
}

// --- resetTimers ---
function resetTimers() {
    logDebug("Resetting timers (WPM, Computer)");
    clearInterval(timerInterval);
    clearInterval(computerInterval);
    clearTimeout(currentTimeoutId);
    timerInterval = null;
    computerInterval = null;
    currentTimeoutId = null;
    startTime = 0;
}

// --- Event Listeners ---
// Added checks to ensure elements exist before adding listeners
if (startButton) startButton.addEventListener('click', startGame);
if (rulesButton) rulesButton.addEventListener('click', () => { playSound('click'); showScreen('rules'); });
if (closeRulesButton) closeRulesButton.addEventListener('click', () => { playSound('click'); showScreen('start'); });
if (startSentenceButton) startSentenceButton.addEventListener('click', startTypingSession);
if (typingInput) typingInput.addEventListener('input', handleTyping);
if (endGameButton) endGameButton.addEventListener('click', () => { playSound('click'); endGame("Manual Abort"); });
if (restartButton) restartButton.addEventListener('click', restartGame);

// --- Initial Setup ---
window.addEventListener('load', () => {
    logDebug("Window loaded. Initializing.");
    // Check essential elements exist
    if (!typingInput || !sentenceDisplay || !computerProgressBar || !userProgressBar || !screens.start || !startSentenceButton) {
         console.error("CRITICAL ERROR: Essential game elements not found in the HTML!");
         alert("Error loading game: Missing essential HTML elements. Check the console.");
         return;
    }
    // Check critical functions exist
    if (typeof resetGameUI !== 'function' || typeof resetSentenceUI !== 'function' || typeof startGame !== 'function') {
        console.error("CRITICAL ERROR: Core game functions are not defined!");
        alert("Error loading game: Core functions missing. Check the console.");
        return;
    }
    showScreen('start');
});