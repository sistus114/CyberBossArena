import Engine from 'gameEngine';
import Player from 'player';
import { GoblinBoss, ZombieBoss, ChickenBoss } from 'bosses';
import { SkeletonKingBoss } from './bosses_ext.js';
import { LevelManager } from 'levels';
import { UIManager } from 'ui';
import { AudioManager } from 'audio';
import { TransitionManager } from 'transitions';
import { handlePlayerDamage } from './combat_utils.js';
import { updateAutoExpireProjectiles } from './combat_utils_ext.js';
import { VictorySequence } from './victory_sequence.js';
import { MobileControls } from './mobile_controls.js';

// Game initialization

window.addEventListener("load", () => {

    const splash = document.getElementById("y8-splash");
    const loader = document.getElementById("loading-screen");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");

    let progress = 0;

    const loadingInterval = setInterval(() => {

        progress += Math.random() * 15;

        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);

            setTimeout(() => {
                loader.style.display = "none";
            }, 300);

        }

        progressBar.style.width = progress + "%";
        progressText.innerText = Math.floor(progress) + "%";

    }, 200);

});

window.addEventListener("load", () => {

    const splash = document.getElementById("y8-splash");

    setTimeout(() => {
        splash.style.opacity = "0";
        splash.style.transition = "opacity 0.5s";

        setTimeout(()=>{
            splash.style.display = "none";
        },500);

    }, 2000);

});

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Create game instances
    const engine = new Engine(canvas);
    const player = new Player(400, 300);
    const uiManager = new UIManager();
    const audioManager = new AudioManager();
    const transitionManager = new TransitionManager(canvas);
    const victorySequence = new VictorySequence(canvas, engine);
    
    // Make the audio manager globally accessible for player.js
    window.gameEngine = {
        audioManager: audioManager
    };
    
    // Create bosses
    const goblinBoss = new GoblinBoss(600, 300, 'sword');
    const zombieBoss = new ZombieBoss(600, 300, 'bat');
    const chickenBoss = new ChickenBoss(600, 300, 'beak');
    const skeletonKingBoss = new SkeletonKingBoss(600, 300, 'scepter');
    
    // Create level manager with 4 bosses
    const levelManager = new LevelManager([goblinBoss, zombieBoss, chickenBoss, skeletonKingBoss]);
    
    // Enable night mode for the last boss
    levelManager.onBossChange = (bossIndex) => {
        if (bossIndex === 3) { // Skeleton King is the 4th boss (index 3)
            engine.nightMode = true;
            audioManager.play('skeletonAttack');
        } else {
            engine.nightMode = false;
        }
    };
    
    // Set up game objects in engine
    engine.setPlayer(player);
    engine.setLevelManager(levelManager);
    engine.setUIManager(uiManager);
    engine.setAudioManager(audioManager);
    engine.setTransitionManager(transitionManager);
    engine.setVictorySequence(victorySequence);
    
    // Create mobile controls
    const mobileControls = new MobileControls(player, engine);
    engine.setMobileControls(mobileControls);
    
    // Menu navigation
    const showScreen = (screenId) => {
        // Hide all screens
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('how-to-play-screen').style.display = 'none';
        document.getElementById('settings-screen').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'none';
        
        // Show the requested screen
        if (screenId !== null) {
            document.getElementById(screenId).style.display = 'flex';
            audioManager.play('menuClick');
        }
    };
    
    // Main menu buttons
    document.getElementById('start-button').addEventListener('click', () => {
        showScreen(null); // Hide all screens
        audioManager.play('menuClick');
        engine.start();
    });
    
    document.getElementById('how-to-play-button').addEventListener('click', () => {
        showScreen('how-to-play-screen');
    });
    
    document.getElementById('settings-button').addEventListener('click', () => {
        showScreen('settings-screen');
    });
    
    // Back buttons
    document.getElementById('back-from-how-to-play').addEventListener('click', () => {
        showScreen('start-screen');
    });
    
    document.getElementById('back-from-settings').addEventListener('click', () => {
        showScreen('start-screen');
    });
    
    // Game over screen buttons
    document.getElementById('restart-button').addEventListener('click', () => {
        document.getElementById('game-over-screen').style.display = 'none';
        audioManager.play('menuClick');
        engine.reset();
        engine.start();
    });
    
    document.getElementById('menu-button').addEventListener('click', () => {
        showScreen('start-screen');
        engine.reset();
    });
    
    // Settings controls
    const soundToggle = document.getElementById('sound-toggle');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');
    const bloomToggle = document.getElementById('bloom-toggle');
    
    soundToggle.addEventListener('change', () => {
        audioManager.setEnabled(soundToggle.checked);
        if (soundToggle.checked) {
            audioManager.play('menuClick');
        }
    });
    
    volumeSlider.addEventListener('input', () => {
        const volume = volumeSlider.value / 100;
        volumeValue.textContent = `${volumeSlider.value}%`;
        audioManager.setVolume(volume);
        
        if (soundToggle.checked) {
            audioManager.play('menuHover');
        }
    });
    
    bloomToggle.addEventListener('change', () => {
        engine.bloomEnabled = bloomToggle.checked;
        audioManager.play('menuClick');
    });
    
    // Button hover sound
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            audioManager.play('menuHover');
        });
    });
    
    // Clean up before unloading
    window.addEventListener('beforeunload', () => {
        if (audioManager) {
            audioManager.cleanup();
        }
    });
});