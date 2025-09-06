// Modal functionality for wellness features
class ModalManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupMoodJournal();
        this.setupMusicTherapy();
        this.setupWellness();
        this.setupMindfulness();
    }

    bindEvents() {
        // Mood journal
        const saveMoodBtn = document.getElementById('saveMoodBtn');
        if (saveMoodBtn) {
            saveMoodBtn.addEventListener('click', () => this.saveMoodEntry());
        }

        // Music therapy
        const musicRecommendBtn = document.getElementById('musicRecommendBtn');
        if (musicRecommendBtn) {
            musicRecommendBtn.addEventListener('click', () => this.getRecommendations());
        }

        // Meditation
        const startMeditationBtn = document.getElementById('startMeditationBtn');
        if (startMeditationBtn) {
            startMeditationBtn.addEventListener('click', () => this.startMeditation());
        }

        // Mindfulness timer
        const startMindfulnessBtn = document.getElementById('startMindfulnessBtn');
        if (startMindfulnessBtn) {
            startMindfulnessBtn.addEventListener('click', () => this.startMindfulness());
        }
    }

    setupMoodJournal() {
        // Initialize mood sliders
        const sliders = ['moodSlider', 'energySlider', 'stressSlider'];
        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            const value = document.getElementById(sliderId.replace('Slider', 'Value'));
            
            if (slider && value) {
                slider.addEventListener('input', (e) => {
                    value.textContent = e.target.value;
                });
            }
        });
    }

    async saveMoodEntry() {
        const mood = document.getElementById('moodSlider').value;
        const energy = document.getElementById('energySlider').value;
        const stress = document.getElementById('stressSlider').value;
        const notes = document.getElementById('moodNotes').value;

        const data = {
            mood: parseInt(mood),
            energy: parseInt(energy),
            stress: parseInt(stress),
            notes: notes,
            timestamp: new Date().toISOString()
        };

        try {
            // Save to localStorage for now (can be enhanced with backend)
            const moodEntries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
            moodEntries.push(data);
            localStorage.setItem('moodEntries', JSON.stringify(moodEntries));

            this.showNotification('Mood entry saved successfully!', 'success');
            dashboard.closeModal(document.getElementById('moodJournalModal'));
            
            // Reset form
            document.getElementById('moodSlider').value = 5;
            document.getElementById('energySlider').value = 5;
            document.getElementById('stressSlider').value = 5;
            document.getElementById('moodNotes').value = '';
            
            // Update display values
            document.getElementById('moodValue').textContent = '5';
            document.getElementById('energyValue').textContent = '5';
            document.getElementById('stressValue').textContent = '5';
            
        } catch (error) {
            console.error('Error saving mood entry:', error);
            this.showNotification('Failed to save mood entry', 'error');
        }
    }

    setupMusicTherapy() {
        this.musicLibrary = [
            { title: 'Calm Waters', artist: 'Nature Sounds', genre: 'ambient', mood: 'calm' },
            { title: 'Energize', artist: 'Upbeat Collective', genre: 'electronic', mood: 'energetic' },
            { title: 'Peaceful Mind', artist: 'Meditation Masters', genre: 'meditation', mood: 'peaceful' },
            { title: 'Happy Vibes', artist: 'Joy Makers', genre: 'pop', mood: 'happy' },
            { title: 'Stress Relief', artist: 'Calm Sounds', genre: 'ambient', mood: 'relaxed' }
        ];
    }

    getRecommendations() {
        const mood = document.getElementById('currentMoodSelect').value;
        const recommendations = this.musicLibrary.filter(song => 
            song.mood === mood || song.genre === 'meditation'
        );

        const recommendationsList = document.getElementById('musicRecommendations');
        recommendationsList.innerHTML = '';

        recommendations.forEach(song => {
            const songItem = document.createElement('div');
            songItem.className = 'music-item';
            songItem.innerHTML = `
                <div class="music-info">
                    <div class="music-title">${song.title}</div>
                    <div class="music-artist">${song.artist}</div>
                </div>
                <button class="btn btn-sm btn-primary" onclick="modals.playMusic('${song.title}')">▶️ Play</button>
            `;
            recommendationsList.appendChild(songItem);
        });
    }

    playMusic(title) {
        this.showNotification(`Now playing: ${title}`, 'info');
        // Simulate music playing
        setTimeout(() => {
            this.showNotification('Music finished playing', 'info');
        }, 5000);
    }

    setupWellness() {
        this.loadWellnessReminders();
    }

    async loadWellnessReminders() {
        try {
            const response = await fetch('/wellness/reminders');
            if (response.ok) {
                const reminders = await response.json();
                this.displayWellnessReminders(reminders);
            }
        } catch (error) {
            console.error('Error loading wellness reminders:', error);
            // Fallback reminders
            this.displayWellnessReminders([
                { type: 'hydration', message: 'Remember to drink water!' },
                { type: 'movement', message: 'Take a short walk or stretch' },
                { type: 'breathing', message: 'Practice deep breathing exercises' }
            ]);
        }
    }

    displayWellnessReminders(reminders) {
        const remindersList = document.getElementById('wellnessReminders');
        if (!remindersList) return;

        remindersList.innerHTML = '';
        reminders.forEach(reminder => {
            const reminderItem = document.createElement('div');
            reminderItem.className = 'wellness-reminder';
            reminderItem.innerHTML = `
                <div class="reminder-icon">${this.getWellnessIcon(reminder.type)}</div>
                <div class="reminder-text">${reminder.message}</div>
                <button class="btn btn-sm btn-ghost" onclick="modals.completeReminder('${reminder.type}')">✓</button>
            `;
            remindersList.appendChild(reminderItem);
        });
    }

    getWellnessIcon(type) {
        const icons = {
            hydration: '💧',
            movement: '🚶',
            breathing: '🫁',
            meditation: '🧘',
            sleep: '😴',
            nutrition: '🥗'
        };
        return icons[type] || '💡';
    }

    completeReminder(type) {
        this.showNotification(`Great job completing your ${type} reminder!`, 'success');
        // Remove the reminder from display
        event.target.closest('.wellness-reminder').remove();
    }

    async startMeditation() {
        const duration = document.getElementById('meditationDuration').value;
        
        try {
            const response = await fetch('/meditation/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ duration: parseInt(duration) })
            });

            if (response.ok) {
                const result = await response.json();
                this.showMeditationTimer(duration, result.session_id);
                dashboard.closeModal(document.getElementById('wellnessModal'));
            }
        } catch (error) {
            console.error('Error starting meditation:', error);
            this.showNotification('Failed to start meditation session', 'error');
        }
    }

    showMeditationTimer(duration, sessionId) {
        // Create meditation timer overlay
        const overlay = document.createElement('div');
        overlay.className = 'meditation-overlay';
        overlay.innerHTML = `
            <div class="meditation-content">
                <h2>Meditation Session</h2>
                <div class="meditation-timer" id="meditationTimer">${duration}:00</div>
                <div class="meditation-instructions">Focus on your breath and let your mind relax</div>
                <button class="btn btn-secondary" onclick="modals.stopMeditation('${sessionId}')">Stop Session</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.startMeditationTimer(duration * 60, sessionId);
    }

    startMeditationTimer(seconds, sessionId) {
        this.meditationInterval = setInterval(() => {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const display = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            
            const timer = document.getElementById('meditationTimer');
            if (timer) {
                timer.textContent = display;
            }
            
            if (seconds <= 0) {
                this.completeMeditation(sessionId);
                return;
            }
            
            seconds--;
        }, 1000);
    }

    async stopMeditation(sessionId) {
        if (this.meditationInterval) {
            clearInterval(this.meditationInterval);
        }
        
        const overlay = document.querySelector('.meditation-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        this.showNotification('Meditation session stopped', 'info');
    }

    async completeMeditation(sessionId) {
        if (this.meditationInterval) {
            clearInterval(this.meditationInterval);
        }
        
        try {
            await fetch(`/meditation/complete/${sessionId}`, { method: 'POST' });
            this.showNotification('Meditation session completed! Well done!', 'success');
        } catch (error) {
            console.error('Error completing meditation:', error);
        }
        
        const overlay = document.querySelector('.meditation-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    setupMindfulness() {
        this.loadMindfulnessPrompt();
    }

    async loadMindfulnessPrompt() {
        try {
            const response = await fetch('/wellness/mindfulness');
            if (response.ok) {
                const result = await response.json();
                const promptElement = document.getElementById('mindfulnessPrompt');
                if (promptElement) {
                    promptElement.textContent = result.prompt;
                }
            }
        } catch (error) {
            console.error('Error loading mindfulness prompt:', error);
        }
    }

    startMindfulness() {
        const duration = document.getElementById('mindfulnessDuration').value;
        this.showMindfulnessTimer(duration);
        dashboard.closeModal(document.getElementById('mindfulnessModal'));
    }

    showMindfulnessTimer(duration) {
        const overlay = document.createElement('div');
        overlay.className = 'mindfulness-overlay';
        overlay.innerHTML = `
            <div class="mindfulness-content">
                <h2>Mindfulness Practice</h2>
                <div class="mindfulness-timer" id="mindfulnessTimer">${duration}:00</div>
                <div class="mindfulness-prompt" id="mindfulnessPromptDisplay">
                    ${document.getElementById('mindfulnessPrompt').textContent}
                </div>
                <button class="btn btn-secondary" onclick="modals.stopMindfulness()">Stop Practice</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.startMindfulnessTimer(duration * 60);
    }

    startMindfulnessTimer(seconds) {
        this.mindfulnessInterval = setInterval(() => {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const display = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            
            const timer = document.getElementById('mindfulnessTimer');
            if (timer) {
                timer.textContent = display;
            }
            
            if (seconds <= 0) {
                this.completeMindfulness();
                return;
            }
            
            seconds--;
        }, 1000);
    }

    stopMindfulness() {
        if (this.mindfulnessInterval) {
            clearInterval(this.mindfulnessInterval);
        }
        
        const overlay = document.querySelector('.mindfulness-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        this.showNotification('Mindfulness practice stopped', 'info');
    }

    completeMindfulness() {
        if (this.mindfulnessInterval) {
            clearInterval(this.mindfulnessInterval);
        }
        
        const overlay = document.querySelector('.mindfulness-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        this.showNotification('Mindfulness practice completed! Great job!', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize modals when DOM is loaded
let modals;
document.addEventListener('DOMContentLoaded', () => {
    modals = new ModalManager();
});

// Add modal-specific CSS
const modalCSS = `
.meditation-overlay, .mindfulness-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.meditation-content, .mindfulness-content {
    text-align: center;
    color: white;
    padding: var(--space-2xl);
    max-width: 500px;
}

.meditation-timer, .mindfulness-timer {
    font-size: 4rem;
    font-weight: bold;
    margin: var(--space-xl) 0;
    color: var(--primary-color);
}

.meditation-instructions, .mindfulness-prompt {
    font-size: 1.2rem;
    margin-bottom: var(--space-xl);
    color: var(--text-secondary);
    line-height: 1.6;
}

.music-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    background: var(--surface);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-sm);
}

.music-title {
    font-weight: 500;
    margin-bottom: var(--space-xs);
}

.music-artist {
    font-size: 0.875rem;
    color: var(--text-muted);
}

.wellness-reminder {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
    background: var(--surface);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-sm);
}

.reminder-icon {
    font-size: 1.5rem;
}

.reminder-text {
    flex: 1;
}

.mood-slider-container {
    margin-bottom: var(--space-lg);
}

.mood-slider-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-sm);
}

.mood-slider {
    width: 100%;
    margin-bottom: var(--space-sm);
}

.slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-muted);
}
`;

// Inject modal CSS
const modalStyle = document.createElement('style');
modalStyle.textContent = modalCSS;
document.head.appendChild(modalStyle);
