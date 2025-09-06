/**
 * Modern Dashboard JavaScript
 * Handles chat, camera, and navigation functionality
 */

class ModernDashboard {
    constructor() {
        this.currentSection = 'chat';
        this.currentSessionId = null;
        this.cameraActive = false;
        this.mediaStream = null;
        this.emotionDetectionInterval = null;
        this.isAnalyzing = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUserInfo();
        this.loadChatSessions();
        this.initializeChat();
    }

    bindEvents() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });

        // Mobile sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // User dropdown
        const userDropdown = document.getElementById('userDropdown');
        if (userDropdown) {
            userDropdown.addEventListener('click', () => this.toggleUserDropdown());
        }

        // Message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            messageInput.addEventListener('input', () => {
                this.adjustTextareaHeight(messageInput);
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('dropdownMenu');
            const userDropdown = document.getElementById('userDropdown');
            
            if (dropdown && !userDropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    switchSection(section) {
        // Update active sidebar item
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Hide all sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.add('hidden');
            sec.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
        }

        this.currentSection = section;

        // Initialize section-specific functionality
        if (section === 'camera') {
            this.initializeCamera();
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }

    toggleUserDropdown() {
        const dropdown = document.getElementById('dropdownMenu');
        dropdown.classList.toggle('hidden');
    }

    async loadUserInfo() {
        try {
            const response = await fetch('/profile');
            if (response.ok) {
                const data = await response.json();
                const user = data.user;
                
                // Update user display
                const initials = this.getInitials(user.username || user.name || 'User');
                document.getElementById('userInitials').textContent = initials;
                document.getElementById('userName').textContent = user.username || user.name || 'User';
                document.getElementById('sidebarUserInitials').textContent = initials;
                document.getElementById('sidebarUserName').textContent = user.username || user.name || 'Welcome';
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    async loadChatSessions() {
        try {
            const response = await fetch('/chat/sessions');
            if (response.ok) {
                const data = await response.json();
                this.renderChatSessions(data.sessions || []);
            }
        } catch (error) {
            console.error('Error loading chat sessions:', error);
        }
    }

    renderChatSessions(sessions) {
        const container = document.getElementById('chatSessions');
        if (!container) return;

        container.innerHTML = sessions.map(session => `
            <div class="chat-session p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors ${session.id === this.currentSessionId ? 'ring-2 ring-purple-500' : ''}" 
                 onclick="dashboard.loadChatSession('${session.id}')">
                <div class="flex justify-between items-start mb-1">
                    <h4 class="text-white font-medium text-sm truncate">${session.title || 'New Chat'}</h4>
                    <button class="text-slate-400 hover:text-red-400 ml-2" onclick="event.stopPropagation(); dashboard.deleteChatSession('${session.id}')">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
                <p class="text-slate-400 text-xs">${session.message_count || 0} messages</p>
                <p class="text-slate-500 text-xs">${this.formatDate(session.created_at)}</p>
            </div>
        `).join('');
    }

    async loadChatSession(sessionId) {
        try {
            const response = await fetch(`/chat/sessions/${sessionId}/messages`);
            if (response.ok) {
                const data = await response.json();
                this.currentSessionId = sessionId;
                this.renderMessages(data.messages || []);
                this.loadChatSessions(); // Refresh to update active state
            }
        } catch (error) {
            console.error('Error loading chat session:', error);
        }
    }

    async deleteChatSession(sessionId) {
        if (!confirm('Are you sure you want to delete this chat session?')) return;

        try {
            const response = await fetch(`/chat/sessions/${sessionId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                if (this.currentSessionId === sessionId) {
                    this.currentSessionId = null;
                    this.clearMessages();
                }
                this.loadChatSessions();
                this.showNotification('Chat session deleted', 'success');
            }
        } catch (error) {
            console.error('Error deleting chat session:', error);
            this.showNotification('Failed to delete chat session', 'error');
        }
    }

    initializeChat() {
        const welcomeMessage = {
            content: "Hello! I'm your AI companion. I'm here to chat, help with your emotions, and support your wellness journey. How are you feeling today?",
            sender: 'ai',
            timestamp: new Date().toISOString()
        };
        
        this.addMessage(welcomeMessage);
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Clear input and reset height
        input.value = '';
        this.adjustTextareaHeight(input);

        // Add user message
        this.addMessage({
            content: message,
            sender: 'user',
            timestamp: new Date().toISOString()
        });

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    session_id: this.currentSessionId
                })
            });

            const data = await response.json();
            
            // Remove typing indicator
            this.hideTypingIndicator();

            if (response.ok) {
                // Update session ID if new session was created
                if (data.session_id) {
                    this.currentSessionId = data.session_id;
                    this.loadChatSessions(); // Refresh sessions list
                }

                // Add AI response
                this.addMessage({
                    content: data.response,
                    sender: 'ai',
                    timestamp: new Date().toISOString(),
                    emotion: data.emotion
                });
            } else {
                this.showNotification(data.error || 'Failed to send message', 'error');
            }
        } catch (error) {
            this.hideTypingIndicator();
            console.error('Error sending message:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    addMessage(message) {
        const container = document.getElementById('messagesContainer');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.sender} fade-in`;
        
        const isUser = message.sender === 'user';
        const avatar = isUser ? 
            `<div class="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-white text-sm font-bold">${this.getInitials(document.getElementById('userName').textContent)}</span>
            </div>` :
            `<div class="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-white text-sm"></i>
            </div>`;

        messageEl.innerHTML = `
            ${avatar}
            <div class="message-bubble ${message.sender}">
                <p>${this.formatMessageContent(message.content)}</p>
                ${message.emotion ? `<div class="text-xs text-slate-400 mt-1">Emotion: ${message.emotion}</div>` : ''}
                <div class="text-xs text-slate-400 mt-2">${this.formatTime(message.timestamp)}</div>
            </div>
        `;

        container.appendChild(messageEl);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const container = document.getElementById('messagesContainer');
        const typingEl = document.createElement('div');
        typingEl.id = 'typingIndicator';
        typingEl.className = 'message ai fade-in';
        typingEl.innerHTML = `
            <div class="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-white text-sm"></i>
            </div>
            <div class="message-bubble ai">
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        container.appendChild(typingEl);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingEl = document.getElementById('typingIndicator');
        if (typingEl) {
            typingEl.remove();
        }
    }

    renderMessages(messages) {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        
        messages.forEach(message => {
            this.addMessage(message);
        });
    }

    clearMessages() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        this.initializeChat();
    }

    startNewChat() {
        this.currentSessionId = null;
        this.clearMessages();
        this.loadChatSessions();
        this.showNotification('New chat started', 'success');
    }

    clearChat() {
        if (confirm('Are you sure you want to clear this chat?')) {
            this.clearMessages();
            this.showNotification('Chat cleared', 'success');
        }
    }

    // Camera functionality
    initializeCamera() {
        // Camera initialization logic here
    }

    async toggleCamera() {
        if (this.cameraActive) {
            this.stopCamera();
        } else {
            await this.startCamera();
        }
    }

    async startCamera() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            
            const video = document.getElementById('cameraFeed');
            const placeholder = document.getElementById('cameraPlaceholder');
            const toggle = document.getElementById('cameraToggle');
            
            if (video && this.mediaStream) {
                video.srcObject = this.mediaStream;
                video.play();
                
                video.classList.remove('hidden');
                placeholder.classList.add('hidden');
                
                toggle.innerHTML = '<i class="fas fa-stop mr-2"></i>Stop Camera';
                this.cameraActive = true;
                
                // Start real-time emotion detection
                this.startRealTimeEmotionDetection();
                
                this.showNotification('Camera started successfully', 'success');
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showNotification('Failed to access camera', 'error');
        }
    }

    stopCamera() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        // Stop real-time emotion detection
        this.stopRealTimeEmotionDetection();
        
        const video = document.getElementById('cameraFeed');
        const placeholder = document.getElementById('cameraPlaceholder');
        const toggle = document.getElementById('cameraToggle');
        
        if (video) {
            video.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
        
        if (toggle) {
            toggle.innerHTML = '<i class="fas fa-video mr-2"></i>Start Camera';
        }
        
        this.cameraActive = false;
        this.showNotification('Camera stopped', 'info');
    }

    startRealTimeEmotionDetection() {
        if (this.emotionDetectionInterval) {
            clearInterval(this.emotionDetectionInterval);
        }
        
        // Analyze emotions every 3 seconds
        this.emotionDetectionInterval = setInterval(() => {
            if (this.cameraActive && !this.isAnalyzing) {
                this.analyzeCurrentFrame();
            }
        }, 3000);
        
        console.log('Real-time emotion detection started');
    }

    stopRealTimeEmotionDetection() {
        if (this.emotionDetectionInterval) {
            clearInterval(this.emotionDetectionInterval);
            this.emotionDetectionInterval = null;
        }
        this.isAnalyzing = false;
        console.log('Real-time emotion detection stopped');
    }

    async analyzeCurrentFrame() {
        if (!this.cameraActive || this.isAnalyzing) return;

        this.isAnalyzing = true;
        
        try {
            const video = document.getElementById('cameraFeed');
            if (!video || video.readyState !== 4) {
                this.isAnalyzing = false;
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            
            const response = await fetch('/emotions/analyze-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: imageData })
            });
            
            const data = await response.json();
            
            if (response.ok && data.emotions && data.emotions.length > 0) {
                this.displayEmotionResults(data.emotions);
                
                // Add visual indicator for real-time detection
                this.showRealTimeIndicator();
            }
        } catch (error) {
            console.error('Error in real-time emotion analysis:', error);
        } finally {
            this.isAnalyzing = false;
        }
    }

    showRealTimeIndicator() {
        const container = document.getElementById('emotionResults');
        if (!container) return;
        
        // Add a small indicator that shows real-time detection is active
        const indicator = container.querySelector('.realtime-indicator');
        if (!indicator) {
            const indicatorEl = document.createElement('div');
            indicatorEl.className = 'realtime-indicator text-xs text-green-400 mb-2 flex items-center';
            indicatorEl.innerHTML = '<i class="fas fa-circle animate-pulse mr-2"></i>Real-time detection active';
            container.insertBefore(indicatorEl, container.firstChild);
        }
    }

    async captureEmotion() {
        if (!this.cameraActive) {
            this.showNotification('Please start the camera first', 'warning');
            return;
        }

        try {
            const video = document.getElementById('cameraFeed');
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            const imageData = canvas.toDataURL('image/jpeg');
            
            const response = await fetch('/emotions/analyze-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: imageData })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.displayEmotionResults(data.emotions);
                this.showNotification('Emotion detected successfully', 'success');
            } else {
                this.showNotification(data.error || 'Failed to analyze emotion', 'error');
            }
        } catch (error) {
            console.error('Error capturing emotion:', error);
            this.showNotification('Failed to capture emotion', 'error');
        }
    }

    displayEmotionResults(emotions) {
        const container = document.getElementById('emotionResults');
        if (!container || !emotions) return;

        const emotionIcons = {
            joy: 'fa-smile',
            happy: 'fa-smile',
            happiness: 'fa-smile',
            sadness: 'fa-frown',
            sad: 'fa-frown',
            anger: 'fa-angry',
            angry: 'fa-angry',
            fear: 'fa-surprise',
            surprise: 'fa-grin-beam',
            surprised: 'fa-grin-beam',
            neutral: 'fa-meh',
            disgust: 'fa-grimace'
        };

        container.innerHTML = emotions.map(emotion => {
            // Handle both 'emotion' and 'label' keys from API response
            const emotionName = emotion.emotion || emotion.label || 'neutral';
            const confidence = emotion.confidence || emotion.score || 0;
            
            return `
                <div class="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg mb-2">
                    <div class="flex items-center space-x-3">
                        <i class="fas ${emotionIcons[emotionName.toLowerCase()] || 'fa-meh'} text-2xl text-purple-400"></i>
                        <div>
                            <span class="text-white font-medium capitalize">${emotionName}</span>
                            <div class="text-sm text-slate-400">${(confidence * 100).toFixed(1)}% confidence</div>
                        </div>
                    </div>
                    <div class="w-20 bg-slate-600 rounded-full h-2">
                        <div class="bg-gradient-primary h-2 rounded-full" style="width: ${confidence * 100}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Utility functions
    adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    }

    formatMessageContent(content) {
        return content.replace(/\n/g, '<br>');
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
        
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-black',
            info: 'bg-blue-500 text-white'
        };
        
        notification.className += ` ${colors[type]}`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-current opacity-70 hover:opacity-100">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.remove('translate-x-full'), 100);
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Global functions for onclick handlers
let dashboard;

function startNewChat() {
    dashboard.startNewChat();
}

function toggleCamera() {
    dashboard.toggleCamera();
}

function clearChat() {
    dashboard.clearChat();
}

function captureEmotion() {
    dashboard.captureEmotion();
}

function startCamera() {
    dashboard.startCamera();
}

function closeSidebar() {
    dashboard.closeSidebar();
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new ModernDashboard();
});
