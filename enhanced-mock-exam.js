// Enhanced Mock Exam with Voice Input and Text-to-Speech for Blind Students
console.log('Loading enhanced-mock-exam.js...');

(function () {
    'use strict';

    // Mock Exam Questions
    const mockExamQuestions = [
        {
            id: 'mock-q1',
            type: 'mcq',
            text: 'What is the full form of RAM?',
            options: ['Read Access Memory', 'Random Access Memory', 'Rapid Access Memory', 'Real Access Memory'],
            correctAnswer: 1,
            marks: 2
        },
        {
            id: 'mock-q2',
            type: 'mcq',
            text: 'Which of the following is an input device?',
            options: ['Monitor', 'Printer', 'Keyboard', 'Speaker'],
            correctAnswer: 2,
            marks: 2
        },
        {
            id: 'mock-q3',
            type: 'mcq',
            text: 'What is the main function of the CPU?',
            options: ['Store data', 'Display graphics', 'Process instructions', 'Print documents'],
            correctAnswer: 2,
            marks: 2
        },
        {
            id: 'mock-q4',
            type: 'text',
            text: 'Briefly explain what an Operating System does.',
            correctAnswer: 'An operating system manages computer hardware and software resources.',
            marks: 2
        },
        {
            id: 'mock-q5',
            type: 'text',
            text: 'What is the importance of a password in digital security?',
            correctAnswer: 'A password protects against unauthorized access to data.',
            marks: 2
        }
    ];

    // Mock Exam State
    let currentMockExam = {
        questions: [], // Empty array by default
        currentQuestionIndex: 0,
        answers: {},
        startTime: null,
        timeLimit: 600, // 10 minutes in seconds
        timerInterval: null,
        isActive: false
    };

    // Speech Recognition Setup
    let recognition = null;
    let synthesis = window.speechSynthesis;
    let isListening = false;

    // Initialize Speech Recognition
    function initSpeechRecognition() {
        // Use multilingual voice system if available
        if (window.initMultilingualVoice) {
            const currentLang = localStorage.getItem('preferredLanguage') || 'en';
            return window.initMultilingualVoice(currentLang);
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            // Get current language
            const currentLang = localStorage.getItem('preferredLanguage') || 'en';
            const langCodes = {
                'en': 'en-US',
                'hi': 'hi-IN',
                'ta': 'ta-IN'
            };
            recognition.lang = langCodes[currentLang] || 'en-US';

            recognition.onresult = function (event) {
                const transcript = event.results[0][0].transcript;
                handleVoiceInput(transcript);
            };

            recognition.onerror = function (event) {
                console.error('Speech recognition error:', event.error);
                isListening = false;
                updateVoiceButton();
            };

            recognition.onend = function () {
                isListening = false;
                updateVoiceButton();
            };

            return true;
        }
        return false;
    }

    // Text-to-Speech Function
    function speak(text, callback) {
        // Use multilingual speak if available
        if (window.speak && typeof window.speak === 'function') {
            window.speak(text, callback);
            return;
        }

        if (synthesis.speaking) {
            synthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Get current language from multilingual system
        const currentLang = localStorage.getItem('preferredLanguage') || 'en';
        const langCodes = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'ta': 'ta-IN'
        };
        utterance.lang = langCodes[currentLang] || 'en-US';

        if (callback) {
            utterance.onend = callback;
        }

        synthesis.speak(utterance);
    }

    // Start Mock Exam
    function startMockExam() {
        console.log('Starting mock exam...');

        currentMockExam.isActive = true;
        currentMockExam.startTime = new Date();
        currentMockExam.currentQuestionIndex = 0;
        currentMockExam.answers = {};

        // Hide dashboard and show mock exam interface
        const dashboardSection = document.getElementById('dashboard-section');
        const mockExamInterface = document.getElementById('mock-exam-interface');

        console.log('Dashboard section:', dashboardSection);
        console.log('Mock exam interface:', mockExamInterface);

        if (dashboardSection) {
            dashboardSection.classList.remove('active');
            dashboardSection.style.display = 'none';
            console.log('Dashboard hidden');
        }

        if (mockExamInterface) {
            mockExamInterface.style.display = 'block';
            mockExamInterface.classList.add('active');
            console.log('Mock exam interface shown');
        }

        // Initialize speech recognition
        const speechInitialized = initSpeechRecognition();
        console.log('Speech recognition initialized:', speechInitialized);
        try {
            const indicator = document.querySelector('#voice-status .voice-indicator');
            const isOn = indicator && indicator.textContent && indicator.textContent.toLowerCase().includes('on');
            if (window.toggleVoiceMode && !isOn) {
                window.toggleVoiceMode();
            }
        } catch (e) { }

        // Start timer
        startMockExamTimer();
        console.log('Timer started');

        // Load first question
        loadMockQuestion(0);
        console.log('First question loaded');

        // Speak welcome only if user enabled voice reading
        const currentLang = localStorage.getItem('preferredLanguage') || 'en';
        if (window.voiceReadingActive) {
            if (window.formatMessage) {
                const welcomeMsg = window.formatMessage('welcome', {
                    duration: '10',
                    questions: '5'
                });
                speak(welcomeMsg);
            } else {
                speak('Mock exam started. You have 10 minutes to complete 5 questions. Each question is worth 2 marks.');
            }
        }
    }

    // Start Timer
    function startMockExamTimer() {
        let timeRemaining = currentMockExam.timeLimit;
        const timerDisplay = document.getElementById('mock-exam-timer');

        currentMockExam.timerInterval = setInterval(() => {
            timeRemaining--;
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            if (timeRemaining <= 0) {
                clearInterval(currentMockExam.timerInterval);
                submitMockExam();
            }
        }, 1000);
    }

    // Load Mock Question
    function loadMockQuestion(index) {
        if (index < 0 || index >= mockExamQuestions.length) return;

        const question = mockExamQuestions[index];
        currentMockExam.currentQuestionIndex = index;

        // Update question display
        document.getElementById('mock-current-q').textContent = index + 1;
        document.getElementById('mock-total-questions').textContent = mockExamQuestions.length;
        document.getElementById('mock-question-text').textContent = question.text;

        // Update navigation buttons
        document.getElementById('mock-prev-btn').disabled = index === 0;
        const nextBtn = document.getElementById('mock-next-btn');
        if (index === mockExamQuestions.length - 1) {
            nextBtn.textContent = 'Finish';
            nextBtn.innerHTML = '<i class="fas fa-check"></i> Finish';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }

        // Load options or text input based on question type
        const optionsContainer = document.getElementById('mock-options-container');
        optionsContainer.innerHTML = '';

        if (question.type === 'mcq') {
            question.options.forEach((option, idx) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option';
                optionDiv.innerHTML = `
                <div class="option-content">
                    <div class="option-letter">${String.fromCharCode(65 + idx)}</div>
                    <div class="option-text">${option}</div>
                </div>
            `;
                optionDiv.onclick = () => selectOption(idx);

                // Highlight if already selected
                if (currentMockExam.answers[question.id] === idx) {
                    optionDiv.classList.add('selected');
                }

                optionsContainer.appendChild(optionDiv);
            });
        } else {
            // Text input for 2-mark questions
            const textInput = document.createElement('textarea');
            textInput.id = 'mock-text-answer-input';
            textInput.className = 'text-answer-input';
            textInput.placeholder = 'Type your answer here or use voice input...';
            textInput.rows = 3;
            textInput.value = currentMockExam.answers[question.id] || '';
            textInput.oninput = (e) => {
                currentMockExam.answers[question.id] = e.target.value;
            };
            optionsContainer.appendChild(textInput);
        }

        // Speak the question only when voice reading is active
        if (window.voiceReadingActive) {
            speakQuestion(question);
        }
    }

    // Speak Question
    function speakQuestion(question) {
        let questionText = `Question ${currentMockExam.currentQuestionIndex + 1} of ${mockExamQuestions.length}. ${question.text}`;

        if (question.type === 'mcq') {
            questionText += ' The options are: ';
            question.options.forEach((option, idx) => {
                questionText += `Option ${String.fromCharCode(65 + idx)}, ${option}. `;
            });
            questionText += ' Say the option letter to select your answer, or click on an option.';
        } else {
            questionText += ' This is a text answer question. Use the voice input button to speak your answer.';
        }

        speak(questionText);
    }

    // Select Option
    function selectOption(index) {
        const question = mockExamQuestions[currentMockExam.currentQuestionIndex];
        currentMockExam.answers[question.id] = index;

        // Update UI
        document.querySelectorAll('.option').forEach((opt, idx) => {
            if (idx === index) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });

        // Speak confirmation (keep generic)
        const optionLetter = String.fromCharCode(65 + index);
        speak(`Option ${optionLetter} selected.`);
    }

    // Handle Voice Input
    function handleVoiceInput(transcript) {
        const question = mockExamQuestions[currentMockExam.currentQuestionIndex];
        const lowerTranscript = transcript.toLowerCase().trim();

        console.log('Voice input received:', transcript);

        if (question.type === 'mcq') {
            // Handle MCQ voice selection
            const optionMatch = lowerTranscript.match(/option\s*([a-d])|([a-d])/i);
            if (optionMatch) {
                const letter = (optionMatch[1] || optionMatch[2]).toUpperCase();
                const index = letter.charCodeAt(0) - 65;
                if (index >= 0 && index < question.options.length) {
                    selectOption(index);
                }
            }
        } else {
            // Handle text answer
            const textInput = document.getElementById('mock-text-answer-input');
            if (textInput) {
                textInput.value = transcript;
                currentMockExam.answers[question.id] = transcript;
                speak(`Your answer has been recorded: ${transcript}`);
            }
        }

        // Handle navigation commands
        if (lowerTranscript.includes('next')) {
            nextQuestion();
        } else if (lowerTranscript.includes('previous') || lowerTranscript.includes('back')) {
            previousQuestion();
        } else if (lowerTranscript.includes('repeat') || lowerTranscript.includes('read again')) {
            speakQuestion(question);
        }
    }

    // Voice Input Button
    function toggleVoiceInput() {
        if (!recognition) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }

        if (isListening) {
            recognition.stop();
            isListening = false;
        } else {
            recognition.start();
            isListening = true;
            speak('Listening...');
        }

        updateVoiceButton();
    }

    // Update Voice Button
    function updateVoiceButton() {
        const voiceBtn = document.getElementById('mock-voice-btn');
        if (voiceBtn) {
            if (isListening) {
                voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Stop Listening';
                voiceBtn.style.background = '#fca5a5';
            } else {
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Speak Answer';
                voiceBtn.style.background = 'linear-gradient(135deg, #93c5fd 0%, #bfdbfe 100%)';
            }
        }
    }

    // Previous Question
    function previousQuestion() {
        if (currentMockExam.currentQuestionIndex > 0) {
            loadMockQuestion(currentMockExam.currentQuestionIndex - 1);
        }
    }

    // Next Question
    function nextQuestion() {
        if (currentMockExam.currentQuestionIndex < mockExamQuestions.length - 1) {
            loadMockQuestion(currentMockExam.currentQuestionIndex + 1);
        } else {
            // Last question - confirm then submit
            if (confirm('Are you sure you want to submit your exam?')) {
                submitMockExam();
            }
        }
    }

    // Submit Mock Exam
    function submitMockExam() {
        clearInterval(currentMockExam.timerInterval);
        currentMockExam.isActive = false;

        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
            const exam = { name: 'Mock Exam', questions: mockExamQuestions };
            if (window.generateAnswersPdf) {
                window.generateAnswersPdf(exam, currentMockExam.answers, currentUser);
            }
        } catch (e) { console.error('Mock PDF generation failed', e); }

        alert('Exam submitted!');

        // Return to dashboard
        endMockExam();
    }

    // End Mock Exam
    function endMockExam() {
        clearInterval(currentMockExam.timerInterval);
        currentMockExam.isActive = false;

        // Hide mock exam interface and show dashboard
        const mockExamInterface = document.getElementById('mock-exam-interface');
        const dashboardSection = document.getElementById('dashboard-section');

        if (mockExamInterface) {
            mockExamInterface.style.display = 'none';
            mockExamInterface.classList.remove('active');
        }

        if (dashboardSection) {
            dashboardSection.style.display = 'block';
            dashboardSection.classList.add('active');
        }
    }

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function () {
        // Set up voice button if it exists
        const voiceBtn = document.getElementById('mock-voice-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', function () {
                try { toggleVoiceMode(); } catch (e) { try { toggleVoiceInput(); } catch (_) { } }
            });
        }

        // Set up navigation buttons
        const prevBtn = document.getElementById('mock-prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', previousQuestion);
        }

        const nextBtn = document.getElementById('mock-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', nextQuestion);
        }

        console.log('Enhanced mock exam initialized');
    });

    // Export functions for global use
    window.startMockExam = startMockExam;
    window.endMockExam = endMockExam;
    // Use distinct names so we don't override main exam navigation
    window.mockPreviousQuestion = previousQuestion;
    window.mockNextQuestion = nextQuestion;
    window.toggleVoiceInput = toggleVoiceInput;
    window.submitMockExam = submitMockExam;

    console.log('Enhanced mock exam functions exported to window');
    console.log('window.startMockExam:', typeof window.startMockExam);
    console.log('Enhanced-mock-exam.js loaded successfully!');

})(); // End of IIFE
