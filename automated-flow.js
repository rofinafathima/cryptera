/**
 * Automated Exam Flow for Autoscribe
 * Updated logic for premium UI and reliable voice capture.
 */

(function () {
    'use strict';

    // State Management
    const flowState = {
        currentPart: 'A',
        isListening: false,
        examQuestions: [],
        currentIndex: 0,
        tempTranscript: '',
        selectedOption: null,
        timerInterval: null,
        isLocked: false, // Task 3: Lock state
        isNavigating: false, // Guard to prevent double-firing commands
        isConfirming: false, // New state for review confirmation
        isConfirmingSubmit: false,
        userAnswers: {} // Task fixes: Store answers by index
    };

    const FILLER_WORDS = ['um', 'uh', 'ah', 'like', 'you know', 'basically', 'actually', 'sort of', 'kind of', 'i mean', 'right', 'so'];
    const COMMAND_PHRASES = [
        'next question', 'previous question', 'lock answer', 'submit exam', 
        'submit', 'next', 'previous', 'read my answer', 'review answer', 
        'verify answer', 'repeat my answer'
    ];

    // Dynamic element lookup
    const getElements = () => ({
        questionText: document.getElementById('questionText') || document.getElementById('question-text'),
        optionsContainer: document.getElementById('optionsContainer') || document.getElementById('options-container'),
        sentenceBoxContainer: document.getElementById('sentenceBoxContainer'),
        sentenceBox: document.getElementById('sentenceBox'),
        autoVoiceBtn: document.getElementById('autoVoiceBtn'),
        questionNumber: document.getElementById('questionNumber') || document.getElementById('question-number'),
        currentQuestionSpan: document.getElementById('currentQuestion') || document.getElementById('current-question'),
        totalQuestionsSpan: document.getElementById('totalQuestions') || document.getElementById('total-questions'),
        nextBtn: document.getElementById('nextBtn') || document.getElementById('next-btn'),
        prevBtn: document.getElementById('prevBtn') || document.getElementById('prev-btn'),
        statusIndicator: document.querySelector('.live-indicator'),
        progressBar: document.getElementById('examProgress') || document.getElementById('exam-progress'),
        timerDisplay: document.querySelector('#examTimerDisplay span') || document.querySelector('#exam-time'),
        questionMarks: document.getElementById('questionMarks') || document.getElementById('question-marks')
    });

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const synthesis = window.speechSynthesis;

    function speak(text, callback) {
        if (synthesis.speaking) synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        if (callback) utterance.onend = callback;
        synthesis.speak(utterance);
    }

    // Task 1 Refinement: Accurate real-time formatting
    function formatSpeech(text) {
        if (!text) return "";
        let formatted = text.toLowerCase();

        // Task fix: Aggressively scrub commands including standalone 'next' or 'previous'
        COMMAND_PHRASES.forEach(cmd => {
            const regex = new RegExp(`\\b${cmd}\\b`, 'gi');
            formatted = formatted.replace(regex, '');
        });

        // Remove fillers
        FILLER_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            formatted = formatted.replace(regex, '');
        });

        // Basic Grammar/Formatting
        formatted = formatted.replace(/\s+/g, ' ').trim();

        if (formatted.length > 0) {
            // Capitalize first letter
            formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

            // Add punctuation if missing
            if (!/[.!?]$/.test(formatted)) {
                formatted += '.';
            }

            // Fix standalone " i " to " I "
            formatted = formatted.replace(/\s+i\s+/g, ' I ');
        }

        return formatted;
    }

    async function saveToMySQL(data) {
        const els = getElements();
        console.log('--- DB SYNC: Saving Question Data ---', data);

        // Cache locally for navigation
        flowState.userAnswers[data.index] = data.answer;

        // Sync with main exam state for PDF generation
        if (window.currentExamState) {
            if (!window.currentExamState.answers) window.currentExamState.answers = {};
            const cleanAns = typeof data.answer === 'string' ? formatSpeech(data.answer) : data.answer;
            window.currentExamState.answers[data.id] = cleanAns;

            if (window.currentExamState.answersArray) {
                window.currentExamState.answersArray[data.index] = cleanAns;
            }
        }

        if (els.sentenceBox && data.answer) els.sentenceBox.classList.add('saved');
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    function initFlow() {
        const els = getElements();

        // Priority 1: Connector State (Teacher created exams)
        if (window.currentExamState && window.currentExamState.exam) {
            flowState.examQuestions = window.currentExamState.exam.questions;
            flowState.currentIndex = 0;
            if (els.totalQuestionsSpan) els.totalQuestionsSpan.textContent = flowState.examQuestions.length;
            loadItem(0);
            startTimer(window.currentExamState.timeLimit || 3600);
            return;
        }

        // Priority 2: Session Storage
        let currentExam = JSON.parse(sessionStorage.getItem('currentExam'));
        if (!currentExam && window.demoExams && window.demoExams.length > 0) {
            currentExam = window.demoExams[0];
            sessionStorage.setItem('currentExam', JSON.stringify(currentExam));
        }

        if (currentExam && currentExam.questions) {
            flowState.examQuestions = currentExam.questions;
            if (els.totalQuestionsSpan) els.totalQuestionsSpan.textContent = flowState.examQuestions.length;
            loadItem(0);
            startTimer(3600);
        } else {
            speak("Exam content not loaded.");
        }
    }

    function loadItem(index) {
        const els = getElements();
        if (index < 0 || index >= flowState.examQuestions.length) return;

        // Save current question before moving
        const currentQ = flowState.examQuestions[flowState.currentIndex];
        if (currentQ) {
            const val = flowState.currentPart === 'A' ? flowState.selectedOption : (els.sentenceBox ? els.sentenceBox.textContent : "");
            if (val) {
                flowState.userAnswers[flowState.currentIndex] = val;
            }
        }

        flowState.currentIndex = index;
        const q = flowState.examQuestions[index];

        if (window.currentExamState) {
            window.currentExamState.currentQuestionIndex = index; // SYNC with main portal
            if (q.marks) window.currentExamState.currentMarks = q.marks;
        }

        flowState.isLocked = false;
        flowState.isNavigating = false;

        if (els.questionNumber) els.questionNumber.textContent = index + 1;
        if (els.currentQuestionSpan) els.currentQuestionSpan.textContent = index + 1;
        if (els.questionText) els.questionText.textContent = q.text;
        if (els.questionMarks) els.questionMarks.textContent = q.marks || 2;

        if (els.progressBar) {
            const pct = ((index + 1) / flowState.examQuestions.length) * 100;
            els.progressBar.style.width = pct + '%';
        }

        // Restore saved answer or clear
        const savedAnswer = flowState.userAnswers[index];

        if (q.type === 'mcq' || (q.options && q.options.length > 0)) {
            flowState.currentPart = 'A';
            renderPartA(q, els);
            if (savedAnswer !== undefined && savedAnswer !== null) {
                flowState.selectedOption = savedAnswer;
                const optDiv = document.getElementById(`option-${savedAnswer}`);
                if (optDiv) optDiv.classList.add('selected');
            } else {
                flowState.selectedOption = null;
            }
        } else {
            flowState.currentPart = 'B';
            renderPartB(els);
            if (savedAnswer) {
                flowState.tempTranscript = savedAnswer;
                if (els.sentenceBox) {
                    els.sentenceBox.textContent = savedAnswer;
                    els.sentenceBox.classList.add('saved');
                }
            } else {
                flowState.tempTranscript = '';
                if (els.sentenceBox) els.sentenceBox.textContent = '';
            }
        }

        readQuestionFlow(q);
    }

    function startTimer(duration) {
        const els = getElements();
        if (flowState.timerInterval) clearInterval(flowState.timerInterval);
        let timer = duration;

        flowState.timerInterval = setInterval(() => {
            let minutes = Math.floor(timer / 60);
            let seconds = timer % 60;
            if (els.timerDisplay) els.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            if (--timer < 0) {
                clearInterval(flowState.timerInterval);
                finishExam();
            }
        }, 1000);
    }

    function readQuestionFlow(q) {
        const marks = q.marks || 2;
        let msg = `Question ${flowState.currentIndex + 1}. ${marks} marks.  ${q.text}. `;

        if (flowState.currentPart === 'A' && q.options) {
            msg += "The options are: ";
            q.options.forEach((opt, idx) => {
                msg += `Option ${String.fromCharCode(65 + idx)}: ${opt}. `;
            });
            msg += "Select your option.";
        } else {
            msg += "Please speak your answer.";
        }
        speak(msg, startListening);
    }

    function renderPartA(q, els) {
        if (els.optionsContainer) {
            els.optionsContainer.style.display = 'grid';
            els.optionsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
            els.optionsContainer.style.gap = '15px';
            els.optionsContainer.innerHTML = '';

            q.options.forEach((opt, idx) => {
                const div = document.createElement('div');
                div.className = 'option-premium';
                div.id = `option-${idx}`;
                div.innerHTML = `
                    <div class="option-letter-premium">${String.fromCharCode(65 + idx)}</div>
                    <div class="option-text">${opt}</div>
                `;
                els.optionsContainer.appendChild(div);
            });
        }
        if (els.sentenceBoxContainer) els.sentenceBoxContainer.style.display = 'none';
        if (els.prevBtn) els.prevBtn.disabled = flowState.currentIndex === 0;
    }

    function renderPartB(els) {
        if (els.optionsContainer) els.optionsContainer.style.display = 'none';
        if (els.sentenceBoxContainer) els.sentenceBoxContainer.style.display = 'block';
        if (els.sentenceBox) {
            els.sentenceBox.classList.remove('saved');
            els.sentenceBox.style.opacity = '1';
        }
        if (els.prevBtn) els.prevBtn.disabled = flowState.currentIndex === 0;
    }

    function startListening() {
        const els = getElements();
        if (flowState.isListening) return;
        try {
            recognition.start();
            flowState.isListening = true;
            if (els.statusIndicator) els.statusIndicator.style.display = 'flex';
        } catch (e) { }
    }

    function stopListening() {
        const els = getElements();
        flowState.isListening = false; // Mark intent to stop
        try {
            recognition.stop();
        } catch (e) { }
        if (els.statusIndicator) els.statusIndicator.style.display = 'none';
    }

    recognition.onresult = (event) => {
        const els = getElements();

        let interim = '', final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript;
            else interim += event.results[i][0].transcript;
        }

        const raw = (final || interim).toLowerCase().trim();
        console.log("Voice Input Captured:", raw);

        if (flowState.isNavigating) return; // Ignore input while moving

        const isNext = raw.includes('next question');
        const isPrev = raw.includes('previous question');
        const isLock = raw.includes('lock answer') || raw === 'lock';
        const isSubmit = raw.includes('submit exam') || raw === 'submit';
        const isReview = raw.includes('read my answer') || raw.includes('review answer') || 
                         raw.includes('verify answer') || raw.includes('repeat my answer') ||
                         raw.includes('read answer');
        
        const isDeleteWord = raw.includes('delete last word') || raw.includes('remove last word');
        const isClear = raw.includes('clear answer') || raw.includes('delete answer') || raw.includes('erase answer');
        const isReplace = raw.includes('replace') && raw.includes('with');

        const isYes = raw === 'yes' || raw.includes('correct') || raw.includes('proceed');
        const isNo = raw === 'no' || raw.includes('edit') || raw.includes('change');

        if (flowState.isConfirming) {
            if (isYes) {
                flowState.isConfirming = false;
                proceedToNext();
                return;
            }
            if (isNo) {
                flowState.isConfirming = false;
                speak("Okay, you can continue speaking to edit your answer.", startListening);
                return;
            }
        }

        if (flowState.isConfirmingSubmit) {
            if (isYes) {
                flowState.isConfirmingSubmit = false;
                proceedToSubmit();
                return;
            }
            if (isNo) {
                flowState.isConfirmingSubmit = false;
                speak("Okay, continuing the exam. You are on question " + (flowState.currentIndex + 1), startListening);
                return;
            }
        }

        if (isReview) {
            handleReviewAnswer();
            return;
        }

        if (flowState.currentPart === 'B') {
            if (isClear) {
                flowState.tempTranscript = '';
                if (els.sentenceBox) els.sentenceBox.textContent = '';
                speak("Answer cleared.");
                return;
            }

            if (isDeleteWord) {
                let words = (flowState.tempTranscript || "").trim().split(/\s+/);
                if (words.length > 0) {
                    const removed = words.pop();
                    flowState.tempTranscript = words.join(' ');
                    if (els.sentenceBox) els.sentenceBox.textContent = formatSpeech(flowState.tempTranscript);
                    speak(`Removed ${removed}.`);
                } else {
                    speak("Nothing to delete.");
                }
                return;
            }

            if (isReplace) {
                const match = raw.match(/replace\s+(.+)\s+with\s+(.+)/i);
                if (match) {
                    const target = match[1].trim();
                    const replacement = match[2].trim();
                    const currentText = flowState.tempTranscript || "";
                    
                    if (currentText.toLowerCase().includes(target.toLowerCase())) {
                        const regex = new RegExp(target, 'gi');
                        flowState.tempTranscript = currentText.replace(regex, replacement);
                        if (els.sentenceBox) els.sentenceBox.textContent = formatSpeech(flowState.tempTranscript);
                        speak(`Replaced ${target} with ${replacement}.`);
                    } else {
                        speak(`I couldn't find the word ${target} in your answer.`);
                    }
                    return;
                }
            }
        }

        if (isNext) {
            console.log("Command: Next Question");
            handleNavigationNext();
            return;
        }
        if (isPrev) {
            console.log("Command: Previous Question");
            handleNavigationPrev();
            return;
        }
        if (isSubmit) {
            console.log("Command: Submit Exam");
            finishExam();
            return;
        }
        if (isLock && !flowState.isLocked) {
            console.log("Command: Lock Answer");
            flowState.isLocked = true;
            if (els.sentenceBox) {
                els.sentenceBox.classList.add('saved');
                els.sentenceBox.style.opacity = '0.7';
            }
            speak("Answer locked. Say next to proceed.");
            return;
        }

        // 2. Transcription Block: Stop if locked
        if (flowState.isLocked) return;

        // 3. Normal Transcription Logic
        if (flowState.currentPart === 'A') {
            const match = raw.match(/(?:option|choice|answer)\s*([a-d])\b/i) || raw.match(/\b([a-d])\b/i);
            if (match) {
                const letter = match[1].toUpperCase();
                const idx = letter.charCodeAt(0) - 65;
                if (els.optionsContainer) {
                    const options = els.optionsContainer.querySelectorAll('.option-premium');
                    options.forEach(o => o.classList.remove('selected'));
                    const selected = document.getElementById(`option-${idx}`);
                    if (selected) {
                        selected.classList.add('selected');
                        flowState.selectedOption = idx;
                        speak(`Selected ${letter}.`);
                    }
                }
            }
        } else {
            // Descriptive answer display
            if (final) {
                const cleanFinal = formatSpeech(final);
                if (cleanFinal) flowState.tempTranscript += ' ' + cleanFinal;
            }

            const currentDisplay = formatSpeech(flowState.tempTranscript + ' ' + interim);

            if (els.sentenceBox) {
                els.sentenceBox.textContent = currentDisplay;
            }
        }
    };

    recognition.onend = () => {
        // MICROPHONE MUST ALWAYS RESTART - even if locked - to hear "Next"
        if (flowState.isListening && !synthesis.speaking) {
            try { recognition.start(); } catch (e) { }
        }
    };

    async function handleReviewAnswer() {
        const els = getElements();
        const currentAnswer = els.sentenceBox ? els.sentenceBox.textContent : "";
        
        if (!currentAnswer || currentAnswer.trim() === "" || currentAnswer.includes("listening")) {
            speak("You haven't provided an answer yet. Please speak your answer first.");
            return;
        }

        stopListening();
        speak("Your current answer is: " + currentAnswer + ". You can say 'next' to proceed, or continue speaking to edit your answer.", () => {
            startListening();
        });
    }

    async function handleNavigationNext() {
        if (flowState.isNavigating) return;

        const els = getElements();
        const q = flowState.examQuestions[flowState.currentIndex];
        let answerText = "";
        
        if (flowState.currentPart === 'A') {
            if (flowState.selectedOption !== null && q.options && q.options[flowState.selectedOption]) {
                answerText = `Option ${String.fromCharCode(65 + flowState.selectedOption)}, ${q.options[flowState.selectedOption]}`;
            } else {
                answerText = "No option selected";
            }
        } else {
            answerText = els.sentenceBox ? els.sentenceBox.textContent : "";
        }

        if (!answerText || answerText === "" || answerText === "No option selected") {
            speak("You haven't provided an answer. Are you sure you want to move to the next question?", () => {
                flowState.isConfirming = true;
                startListening();
            });
            return;
        }

        // Proactively ask for review as requested by user
        stopListening();
        speak(`Your answer is: ${answerText}. Say yes to proceed or no to edit.`, () => {
            flowState.isConfirming = true;
            startListening();
        });
    }

    async function proceedToNext() {
        if (flowState.isNavigating) return;
        flowState.isNavigating = true;

        const els = getElements();
        stopListening();

        const q = flowState.examQuestions[flowState.currentIndex];
        const answer = flowState.currentPart === 'A' ? flowState.selectedOption : (els.sentenceBox ? els.sentenceBox.textContent : "");

        await saveToMySQL({ index: flowState.currentIndex, id: q.id, answer });

        if (flowState.currentIndex < flowState.examQuestions.length - 1) {
            loadItem(flowState.currentIndex + 1);
        } else {
            finishExam();
        }
    }

    async function handleNavigationPrev() {
        if (flowState.currentIndex <= 0 || flowState.isNavigating) return;
        flowState.isNavigating = true;

        const els = getElements();
        stopListening();
        const q = flowState.examQuestions[flowState.currentIndex];
        const answer = flowState.currentPart === 'A' ? flowState.selectedOption : (els.sentenceBox ? els.sentenceBox.textContent : "");
        await saveToMySQL({ index: flowState.currentIndex, id: q.id, answer });
        loadItem(flowState.currentIndex - 1);
    }

    async function finishExam() {
        if (flowState.isNavigating) return;

        const els = getElements();
        stopListening();

        speak("Are you sure you want to submit the exam? Say yes to confirm or no to continue working.", () => {
            flowState.isConfirmingSubmit = true;
            startListening();
        });
    }

    async function proceedToSubmit() {
        if (flowState.isNavigating) return;
        flowState.isNavigating = true;

        const els = getElements();
        stopListening();

        // Save final question before submit
        const q = flowState.examQuestions[flowState.currentIndex];
        const answer = flowState.currentPart === 'A' ? flowState.selectedOption : (els.sentenceBox ? els.sentenceBox.textContent : "");
        await saveToMySQL({ index: flowState.currentIndex, id: q.id, answer });

        speak("Exam submitted successfully. Your answers have been saved and the PDF is in your Downloads.");

        // Final sync before submit
        if (window.currentExamState) {
            window.currentExamState.answers = flowState.userAnswers;
        }

        // Trigger the main submission logic
        const btn = document.getElementById('submitExamBtn');
        if (btn) btn.click();
        else if (window.submitCurrentExam) window.submitCurrentExam();
    }

    // Exports
    window.initFlow = initFlow;
    window.stopListening = stopListening;
    window.startExamFlow = initFlow;

    // Delayed Event listeners setup
    const setupListeners = () => {
        const els = getElements();
        if (els.nextBtn) els.nextBtn.addEventListener('click', handleNavigationNext);
        if (els.prevBtn) els.prevBtn.addEventListener('click', handleNavigationPrev);
        if (els.autoVoiceBtn) els.autoVoiceBtn.addEventListener('click', () => {
            if (!flowState.isListening) initFlow();
            else stopListening();
        });
    };

    // Initial listener setup
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupListeners);
    } else {
        setupListeners();
    }

})();
