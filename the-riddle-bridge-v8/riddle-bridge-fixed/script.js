// --- GAME ASSETS AND CONFIGURATION ---
const WALK_DISTANCE = 120; // Step size in pixels
const PLAYER_WALK_DURATION = 1000; // Milliseconds for walk animation
const MAX_LIGHT = 5; // Maximum light level
const TOTAL_LEVELS = 10;

const ASSETS = {
    LIGHT_BAR: [
        'assets/images/light 0.png',
        'assets/images/light 1.png', 
        'assets/images/light 2.png',
        'assets/images/light 3.png',
        'assets/images/light 4.png',
        'assets/images/light 5.png'
    ],
    BRIDGE_TILE: 'assets/images/bridge miss part.png',
    CHARACTER_STAND: 'assets/images/stand pose.png',
    CHARACTER_WALK_1: 'assets/images/first step pose.png',
    CHARACTER_WALK_2: 'assets/images/second step pose.png',
    DEATH_IMAGE: 'assets/images/you died.png',
    WIN_IMAGE: 'assets/images/label.png',
};

const RIDDLES = [
    {
        "riddle": "Q: A cowboy rode into town on Friday. He stayed for three nights and rode out on Friday. How is this possible?",
        "answer": ["his horse's name is friday", "horse's name is friday", "friday"],
    },
    {
        "riddle": "Q: What is full of holes but still holds water?",
        "answer": ["sponge"],
    },
    {
        "riddle": "Q: What question can you never answer yes to?",
        "answer": ["are you asleep yet", "are you asleep"],
    },
    {
        "riddle": "Q: I am always hungry, I must always be fed, the finger I lick will soon turn red. What am I?",
        "answer": ["fire"],
    },
    {
        "riddle": "Q: What is always coming, but never arrives?",
        "answer": ["tomorrow"],
    },
    {
        "riddle": "Q: What has an eye but cannot see?",
        "answer": ["needle"],
    },
    {
        "riddle": "Q: What runs but never walks, often murmurs, never talks, has a bed but never sleeps, has a mouth but never eats?",
        "answer": ["river"],
    },
    {
        "riddle": "Q: What goes up, but never comes down?",
        "answer": ["age", "your age"],
    },
    {
        "riddle": "Q: What has cities, but no houses; forests, but no trees; and water, but no fish?",
        "answer": ["map"],
    },
    {
        "riddle": "Q: If you have me, you want to share me. If you share me, you haven't kept me. What am I?",
        "answer": ["secret"],
    },
];

// --- GAME STATE ---
let gameState = {
    currentRiddleIndex: 0,
    tilesPlaced: 0,
    currentLight: MAX_LIGHT,
    isWalking: false,
    diedFromLava: false,
};

// --- DOM REFERENCES ---
const ui = {
    riddleUI: document.getElementById('riddle-ui'),
    riddleText: document.getElementById('riddle-text'),
    answerInput: document.getElementById('answer-input'),
    answerButton: document.getElementById('answer-button'),
    sacrificeButton: document.getElementById('sacrifice-button'),
    lightBarImg: document.getElementById('light-bar-img'),
    lightText: document.getElementById('light-text'),
    levelDisplay: document.getElementById('level-display'),
    character: document.getElementById('character'),
    bridgeContainer: document.getElementById('bridge-container'),
    missPart: document.getElementById('miss-part'),
    deathScreen: document.getElementById('death-screen'),
    winScreen: document.getElementById('win-screen'),
    deathImage: document.getElementById('death-image'),
    deathMessage: document.getElementById('death-message'),
    winMessage: document.getElementById('win-message'),
    errorMessage: document.getElementById('error-message'),
    sacrificeMessage: document.getElementById('sacrifice-message'),
    background: document.getElementById('background'),
    bridgeBase: document.getElementById('bridge-base'),
};

// --- CORE FUNCTIONS ---

function updateLightBar() {
    const lightIndex = Math.min(gameState.currentLight, MAX_LIGHT);
    ui.lightBarImg.src = ASSETS.LIGHT_BAR[Math.max(0, lightIndex)];
    ui.lightText.textContent = `LIGHT: ${gameState.currentLight}/${MAX_LIGHT}`;
    
    // Add flicker effect when light is low
    if (gameState.currentLight <= 2) {
        ui.lightBarImg.classList.add('light-low');
    } else {
        ui.lightBarImg.classList.remove('light-low');
    }
}

function updateLevelDisplay() {
    ui.levelDisplay.textContent = `LEVEL: ${gameState.currentRiddleIndex + 1}/${TOTAL_LEVELS}`;
}

function reduceLight() {
    if (gameState.currentLight > 0) {
        gameState.currentLight -= 1;
        updateLightBar();
        
        // Show sacrifice message
        ui.sacrificeMessage.classList.remove('hidden');
        setTimeout(() => {
            ui.sacrificeMessage.classList.add('hidden');
        }, 2000);
        
        return true;
    } else {
        gameState.diedFromLava = true;
        return false; 
    }
}

function isAnswerCorrect(userInput, correctAnswers) {
    const cleanInput = userInput.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
    return correctAnswers.some(answer => 
        answer.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '') === cleanInput
    );
}

function setupRiddle() {
    if (gameState.currentRiddleIndex >= TOTAL_LEVELS) {
        showWinScreen();
        return;
    }

    const currentRiddle = RIDDLES[gameState.currentRiddleIndex];
    ui.riddleText.textContent = `${currentRiddle.riddle}`;
    ui.answerInput.value = '';
    ui.riddleUI.classList.remove('hidden');
    ui.errorMessage.classList.add('hidden');
    ui.sacrificeMessage.classList.add('hidden');

    updateLevelDisplay();

    // Re-enable buttons and focus input
    ui.answerButton.disabled = false;
    ui.sacrificeButton.disabled = false;
    setTimeout(() => ui.answerInput.focus(), 100);
}

function hideRiddleUI() {
    ui.riddleUI.classList.add('hidden');
}

function gameOver() {
    console.log("Game Over");
    ui.deathScreen.classList.remove('hidden');
    
    if (gameState.diedFromLava) {
        ui.deathScreen.classList.add('lava-background');
        ui.deathMessage.textContent = 'YOU FELL INTO THE LAVA!';
        ui.deathMessage.classList.remove('hidden');
    } else {
        ui.deathScreen.classList.remove('lava-background');
        ui.deathMessage.classList.add('hidden');
    }
}

function showWinScreen() {
    let winMessage = 'CONGRATULATIONS! YOU CROSSED THE BRIDGE!';
    
    if (gameState.currentLight <= 2) {
        winMessage = 'YOU BARELY MADE IT! SO CLOSE TO THE LAVA...';
    } else if (gameState.currentLight >= 4) {
        winMessage = 'EXCELLENT! YOU CROSSED WITH MOST OF YOUR LIGHT INTACT!';
    }

    ui.winMessage.textContent = winMessage;
    ui.winScreen.classList.remove('hidden');
}

// --- BRIDGE AND MOVEMENT FUNCTIONS ---

function placeBridgeTile() {
    const tile = document.createElement('img');
    tile.src = ASSETS.BRIDGE_TILE;
    tile.alt = 'Bridge Tile';
    tile.classList.add('pixelated', 'w-24', 'h-16', 'bridge-tile');
    
    ui.bridgeContainer.appendChild(tile);
    gameState.tilesPlaced += 1;
}

function showMissPart() {
    ui.missPart.classList.remove('hidden');
    ui.missPart.classList.add('miss-part-active');
}

function hideMissPart() {
    ui.missPart.classList.add('hidden');
    ui.missPart.classList.remove('miss-part-active');
}

function animateWalk(duration, targetX) {
    return new Promise(resolve => {
        let startTime;
        const charElement = ui.character;
        const startX = parseInt(charElement.style.left || '150');
        
        // Start walking animation
        charElement.classList.add('walking');
        
        // Switch between walk poses
        let walkFrame = 1;
        const walkInterval = setInterval(() => {
            walkFrame = walkFrame === 1 ? 2 : 1;
            charElement.style.backgroundImage = `url(${ASSETS['CHARACTER_WALK_' + walkFrame]})`;
        }, 200);

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const newX = startX + (targetX - startX) * progress;
            charElement.style.left = newX + 'px';

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                // Movement finished
                clearInterval(walkInterval);
                charElement.classList.remove('walking');
                charElement.style.backgroundImage = `url(${ASSETS.CHARACTER_STAND})`;
                charElement.style.left = targetX + 'px';
                resolve();
            }
        }
        requestAnimationFrame(step);
    });
}

async function placeBridgeAndMovePlayer(isSuccess, isSacrifice = false) {
    if (gameState.isWalking) return;
    gameState.isWalking = true;
    
    ui.answerButton.disabled = true;
    ui.sacrificeButton.disabled = true;
    hideRiddleUI();
    
    const currentX = parseInt(ui.character.style.left || '150');
    const targetX = currentX + WALK_DISTANCE;
    
    if (!isSuccess) {
        // Fall sequence
        console.log("Initiating Fall Sequence");
        
        // Walk to edge
        await animateWalk(PLAYER_WALK_DURATION * 0.6, currentX + WALK_DISTANCE / 2);
        
        // Fall down
        ui.character.classList.add('falling');
        
        setTimeout(() => {
            gameOver();
        }, 2000);

    } else {
        // Successful crossing
        if (gameState.currentRiddleIndex > 0) {
            placeBridgeTile();
        }
        
        // Show missing part animation for sacrifice
        if (isSacrifice) {
            showMissPart();
        }
        
        await animateWalk(PLAYER_WALK_DURATION, targetX);
        
        // Hide miss part after crossing
        hideMissPart();
        
        _onPlayerMoveFinished();
    }
}

function _onPlayerMoveFinished() {
    gameState.isWalking = false;
    gameState.currentRiddleIndex += 1;
    
    if (gameState.currentRiddleIndex >= TOTAL_LEVELS) {
        showWinScreen();
    } else {
        // Small delay before next riddle
        setTimeout(setupRiddle, 1000);
    }
}

// --- EVENT LISTENERS ---

ui.answerButton.addEventListener('click', () => {
    if (gameState.isWalking) return;
    
    const userInput = ui.answerInput.value;
    const currentRiddle = RIDDLES[gameState.currentRiddleIndex];
    
    if (!currentRiddle) return;

    if (isAnswerCorrect(userInput, currentRiddle.answer)) {
        ui.errorMessage.classList.add('hidden');
        placeBridgeAndMovePlayer(true);
    } else {
        ui.errorMessage.classList.remove('hidden');
    }
});

ui.sacrificeButton.addEventListener('click', () => {
    if (gameState.isWalking) return;
    
    const successfullyReduced = reduceLight();
    
    if (successfullyReduced) {
        placeBridgeAndMovePlayer(true, true);
    } else {
        placeBridgeAndMovePlayer(false, false);
    }
});

// Enter key support for answer input
ui.answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        ui.answerButton.click();
    }
});

// --- INITIALIZATION ---
function init() {
    // Set initial character pose
    ui.character.style.backgroundImage = `url(${ASSETS.CHARACTER_STAND})`;
    
    // Set initial light bar
    updateLightBar();
    updateLevelDisplay();
    
    // Background is set via CSS (background.png)
    
    // Start the first riddle
    setTimeout(setupRiddle, 1000);
}

window.onload = init;