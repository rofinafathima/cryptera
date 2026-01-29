// Accessibility Features for Visually Challenged Students
class AccessibilityManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.voices = [];
        this.voice = null;
        this.rate = 1.0;
        this.pitch = 1.0;
        this.volume = 1.0;
        this.isSpeaking = false;
        this.recognition = null;
        this.initialize();
    }

    async initialize() {
        await this.loadVoices();
        this.initializeSpeechRecognition();
    }

    loadVoices() {
        return new Promise((resolve) => {
            // Chrome loads voices asynchronously.
            let voices = this.synth.getVoices();
            if (voices.length) {
                this.voices = voices;
                this.setVoice('Google UK English Female');
                resolve();
                return;
            }

            this.synth.onvoiceschanged = () => {
                this.voices = this.synth.getVoices();
                this.setVoice('Google UK English Female');
                resolve();
            };
        });
    }

    setVoice(voiceName) {
        const voice = this.voices.find(v => v.name === voiceName) || this.voices[0];
        this.voice = voice;
    }

    speak(text, onEnd = null) {
        if (this.isSpeaking) {
            this.stopSpeaking();
        }

        if (!text) return;

        this.utterance = new SpeechSynthesisUtterance(text);
        this.utterance.voice = this.voice;
        this.utterance.rate = this.rate;
        this.utterance.pitch = this.pitch;
        this.utterance.volume = this.volume;
        
        if (onEnd) {
            this.utterance.onend = onEnd;
        }

        this.isSpeaking = true;
        this.synth.speak(this.utterance);
    }

    stopSpeaking() {
        if (this.isSpeaking) {
            this.synth.cancel();
            this.isSpeaking = false;
        }
    }

    initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
    }

    startListening(onResult, onError = null) {
        if (!this.recognition) {
            console.error('Speech recognition not initialized');
            return;
        }

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            if (onResult) onResult(transcript);
        };

        if (onError) {
            this.recognition.onerror = onError;
        }

        this.recognition.start();
    }

    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    // Accessibility helper functions
    static addAccessibilityAttributes() {
        // Add ARIA attributes to interactive elements
        document.querySelectorAll('button, a, [tabindex]').forEach(el => {
            if (!el.hasAttribute('aria-label')) {
                const label = el.textContent.trim() || el.getAttribute('title') || '';
                if (label) {
                    el.setAttribute('aria-label', label);
                }
            }
        });
    }

    static setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Skip if inside form elements
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                return;
            }

            switch(e.key) {
                case 'h':
                case 'H':
                    // Go to header
                    document.querySelector('header')?.focus();
                    break;
                case 'm':
                case 'M':
                    // Go to main content
                    document.querySelector('main')?.focus();
                    break;
                case 'f':
                case 'F':
                    // Go to footer
                    document.querySelector('footer')?.focus();
                    break;
                case '?':
                    // Show keyboard shortcuts help
                    this.showKeyboardHelp();
                    break;
            }
        });
    }

    static showKeyboardHelp() {
        // Implement keyboard help dialog
        console.log('Showing keyboard help');
    }
}

// Initialize accessibility features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
    AccessibilityManager.addAccessibilityAttributes();
    AccessibilityManager.setupKeyboardNavigation();
});
