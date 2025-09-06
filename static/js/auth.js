/**
 * Modern Authentication JavaScript
 * Handles login, register, and social authentication
 */

class ModernAuth {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.initAnimations();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Password strength checker
        const passwordInput = document.getElementById('password');
        if (passwordInput && document.getElementById('passwordStrength')) {
            passwordInput.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
        }
    }

    initAnimations() {
        // Add entrance animations to form elements
        const formElements = document.querySelectorAll('.form-modern');
        formElements.forEach((element, index) => {
            element.style.animationDelay = `${index * 0.1}s`;
            element.classList.add('fade-in');
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const username = form.username.value.trim();
        const password = form.password.value;

        if (!username || !password) {
            this.showAlert('Please fill in all fields', 'error');
            return;
        }

        this.setLoading(submitBtn, true);
        this.clearAlerts();

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                this.showAlert(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const username = form.username.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value;

        if (!username || !email || !password) {
            this.showAlert('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showAlert('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            this.showAlert('Password must be at least 6 characters long', 'error');
            return;
        }

        this.setLoading(submitBtn, true);
        this.clearAlerts();

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert('Account created successfully! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                this.showAlert(result.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showAlert('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    checkPasswordStrength(password) {
        const strengthBar = document.getElementById('passwordStrength');
        const strengthText = document.getElementById('passwordStrengthText');
        
        if (!strengthBar || !strengthText) return;

        let strength = 0;
        let text = '';
        let color = '';

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        switch (strength) {
            case 0:
            case 1:
                text = 'Very Weak';
                color = 'bg-red-500';
                break;
            case 2:
                text = 'Weak';
                color = 'bg-orange-500';
                break;
            case 3:
                text = 'Fair';
                color = 'bg-yellow-500';
                break;
            case 4:
                text = 'Good';
                color = 'bg-blue-500';
                break;
            case 5:
                text = 'Strong';
                color = 'bg-green-500';
                break;
        }

        strengthBar.className = `h-2 rounded-full transition-all duration-300 ${color}`;
        strengthBar.style.width = `${(strength / 5) * 100}%`;
        strengthText.textContent = text;
        strengthText.className = `text-sm mt-1 ${color.replace('bg-', 'text-')}`;
    }

    setLoading(button, loading) {
        const btnText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.loading-spinner');

        if (loading) {
            button.disabled = true;
            button.classList.add('opacity-75', 'cursor-not-allowed');
            btnText.classList.add('opacity-0');
            spinner.classList.remove('hidden');
        } else {
            button.disabled = false;
            button.classList.remove('opacity-75', 'cursor-not-allowed');
            btnText.classList.remove('opacity-0');
            spinner.classList.add('hidden');
        }
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        const alertColors = {
            success: 'alert-success',
            error: 'alert-error',
            warning: 'alert-warning',
            info: 'alert-info'
        };

        const alertIcons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const alert = document.createElement('div');
        alert.className = `alert-modern ${alertColors[type]} fade-in`;
        alert.innerHTML = `
            <div class="flex items-center">
                <i class="${alertIcons[type]} mr-3"></i>
                <span>${message}</span>
                <button class="ml-auto text-current opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        alertContainer.appendChild(alert);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.classList.add('opacity-0', 'transform', 'scale-95');
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }

    clearAlerts() {
        const alertContainer = document.getElementById('alertContainer');
        if (alertContainer) {
            alertContainer.innerHTML = '';
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Social Login Functions
async function loginWithProvider(provider) {
    const button = document.querySelector(`.btn-${provider}`);
    if (button) {
        button.classList.add('opacity-75', 'cursor-not-allowed');
        button.innerHTML = `
            <div class="loading-spinner"></div>
            <span>Connecting...</span>
        `;
    }
    
    // Show loading notification
    showNotification(`Redirecting to ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`, 'info');
    
    // Redirect to OAuth endpoint
    window.location.href = `/auth/${provider}`;
}

// Guest Login Function
async function loginAsGuest() {
    const button = document.querySelector('.btn-guest');
    if (button) {
        button.classList.add('opacity-75', 'cursor-not-allowed');
        button.innerHTML = `
            <div class="loading-spinner"></div>
            <span>Creating guest session...</span>
        `;
    }
    
    try {
        const response = await fetch('/auth/guest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Guest session created successfully!', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            showNotification(data.error || 'Failed to create guest session', 'error');
            resetGuestButton();
        }
    } catch (error) {
        console.error('Guest login error:', error);
        showNotification('Failed to create guest session. Please try again.', 'error');
        resetGuestButton();
    }
}

function resetGuestButton() {
    const button = document.querySelector('.btn-guest');
    if (button) {
        button.classList.remove('opacity-75', 'cursor-not-allowed');
        button.innerHTML = `
            <i class="fas fa-user-secret"></i>
            <span>Continue as Guest</span>
        `;
    }
}

// Password Toggle Function
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById('passwordToggle');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.classList.remove('fa-eye');
        toggle.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
    }
}

// Notification Function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
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
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ModernAuth();
    
    // Add smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add focus effects to inputs
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('scale-105');
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('scale-105');
        });
    });
});
