// Exam Connector - Links teacher-created exams to student access

// Storage keys
const STORAGE_KEYS = {
    EXAMS: 'autoscribe_exams',
    CURRENT_USER: 'currentUser',
    SUBMISSIONS: 'autoscribe_submissions'
};

// Save exam to localStorage
function saveExamToStorage(exam) {
    try {
        let exams = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAMS)) || [];

        // Check if exam already exists
        const existingIndex = exams.findIndex(e => e.id === exam.id);
        if (existingIndex >= 0) {
            exams[existingIndex] = exam;
        } else {
            exams.push(exam);
        }

        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
        console.log('Exam saved:', exam.name);
        return true;
    } catch (error) {
        console.error('Error saving exam:', error);
        return false;
    }
}

// Get all exams from storage
function getAllExamsFromStorage() {
    try {
        const storedExams = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAMS)) || [];
        return storedExams;
    } catch (error) {
        console.error('Error loading exams:', error);
        return [];
    }
}

// Get available exams for students
function getAvailableExamsForStudent() {
    const allExams = getAllExamsFromStorage();
    return allExams.filter(exam => exam.status === 'available' || exam.status === 'scheduled');
}

// Get exam by ID
function getExamByIdFromStorage(examId) {
    const allExams = getAllExamsFromStorage();
    return allExams.find(exam => exam.id === examId);
}

// Save student submission
function saveStudentSubmission(examId, studentId, answers, score) {
    try {
        let submissions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) || {};

        if (!submissions[studentId]) {
            submissions[studentId] = {};
        }

        submissions[studentId][examId] = {
            answers: answers,
            score: score,
            submittedAt: new Date().toISOString(),
            timeSpent: 0
        };

        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
        console.log('Submission saved for student:', studentId, 'exam:', examId);
        return true;
    } catch (error) {
        console.error('Error saving submission:', error);
        return false;
    }
}

// Get student submissions
function getStudentSubmissions(studentId) {
    try {
        const submissions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) || {};
        return submissions[studentId] || {};
    } catch (error) {
        console.error('Error loading submissions:', error);
        return {};
    }
}

// Check if student has submitted exam
function hasStudentSubmittedExam(studentId, examId) {
    const submissions = getStudentSubmissions(studentId);
    return !!submissions[examId];
}

// Initialize storage with demo data if empty
function initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) {
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify({}));
    }
    console.log('Storage initialized');
}

// Load exams into student dashboard
function loadStudentExams() {
    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
    if (!currentUser || currentUser.role !== 'student') return;

    const availableExams = getAvailableExamsForStudent();
    const submissions = getStudentSubmissions(currentUser.id);

    // Update current exams list
    const currentExamsList = document.getElementById('current-exams-list');
    if (currentExamsList) {
        const currentExams = availableExams.filter(exam => {
            return exam.status === 'available' && !submissions[exam.id];
        });

        if (currentExams.length === 0) {
            currentExamsList.innerHTML = '<div class="no-exams"><i class="fas fa-clock"></i><p>No exams in progress</p></div>';
        } else {
            currentExamsList.innerHTML = currentExams.map(exam => `
                <div class="exam-item">
                    <h4>${exam.name}</h4>
                    <p><i class="fas fa-book"></i> ${exam.description || 'No description'}</p>
                    <p><i class="fas fa-clock"></i> Duration: ${exam.duration} minutes</p>
                    <p><i class="fas fa-signal"></i> Difficulty: ${exam.difficulty}</p>
                    <button class="action-btn" onclick="startExamById('${exam.id}')">
                        <i class="fas fa-play"></i> Start Exam
                    </button>
                </div>
            `).join('');
        }
    }

    // Update upcoming exams list
    const upcomingExamsList = document.getElementById('upcoming-exams-list');
    if (upcomingExamsList) {
        const upcomingExams = availableExams.filter(exam => exam.status === 'scheduled');

        if (upcomingExams.length === 0) {
            upcomingExamsList.innerHTML = '<div class="no-exams"><i class="far fa-calendar"></i><p>No upcoming exams</p></div>';
        } else {
            upcomingExamsList.innerHTML = upcomingExams.map(exam => `
                <div class="exam-item">
                    <h4>${exam.name}</h4>
                    <p><i class="fas fa-calendar-alt"></i> ${exam.date}</p>
                    <p><i class="fas fa-clock"></i> Duration: ${exam.duration} minutes</p>
                    <span class="status upcoming">Upcoming</span>
                </div>
            `).join('');
        }
    }

    // Update completed exams list
    const completedExamsList = document.getElementById('completed-exams-list');
    if (completedExamsList) {
        const completedExamIds = Object.keys(submissions);
        const completedExams = completedExamIds.map(examId => {
            const exam = getExamByIdFromStorage(examId);
            const submission = submissions[examId];
            return { ...exam, submission };
        }).filter(exam => exam.id);

        if (completedExams.length === 0) {
            completedExamsList.innerHTML = '<div class="no-exams"><i class="far fa-check-circle"></i><p>No completed exams yet</p></div>';
        } else {
            completedExamsList.innerHTML = completedExams.map(exam => `
                <div class="exam-item">
                    <h4>${exam.name}</h4>
                    <p><i class="fas fa-check-circle"></i> Completed</p>
                    <p><i class="fas fa-star"></i> Score: ${exam.submission.score || 'Pending'}</p>
                    <span class="status completed">Completed</span>
                </div>
            `).join('');
        }
    }
}

// Start exam by ID
function startExamById(examId) {
    const exam = getExamByIdFromStorage(examId);
    if (!exam) {
        alert('Exam not found');
        return;
    }

    // Store current exam in session
    sessionStorage.setItem('currentExam', JSON.stringify(exam));

    // Navigate to exam page or show exam section
    const examSection = document.getElementById('exam-section');
    const dashboardSection = document.getElementById('dashboard-section');

    if (examSection && dashboardSection) {
        dashboardSection.classList.remove('active');
        examSection.classList.add('active');
        loadExamQuestions(exam);
    }
}

// Load exam questions
function loadExamQuestions(exam) {
    // Set exam title and metadata
    if (document.getElementById('examTitle')) document.getElementById('examTitle').textContent = exam.name;
    if (document.getElementById('examSubject')) document.getElementById('examSubject').textContent = exam.description || '';
    if (document.getElementById('examDuration')) document.getElementById('examDuration').textContent = `${exam.duration} minutes`;
    if (document.getElementById('totalQuestions')) document.getElementById('totalQuestions').textContent = exam.questions.length;

    // Initialize exam state
    // Shuffle questions for random order while preserving original object
    const shuffledQuestions = (exam.questions || []).slice().sort(() => Math.random() - 0.5);
    window.currentExamState = {
        exam: { ...exam, questions: shuffledQuestions },
        currentQuestionIndex: 0,
        answers: {}, // keyed by question.id for backward compatibility
        answersArray: new Array(shuffledQuestions.length).fill(null), // index-aligned answers array
        startTime: new Date(),
        timeLimit: exam.duration * 60 // Convert to seconds
    };

    // Load first question - handover to automated-flow if active
    if (window.initFlow) {
        window.initFlow();
    } else {
        loadExamQuestion(0);
        startExamTimer(exam.duration * 60);
    }

    // Speak exam instructions using multilingual system
    if (window.voiceReadingActive) {
        if (window.formatMessage) {
            const welcomeMsg = window.formatMessage('welcome', {
                duration: exam.duration,
                questions: exam.questions.length
            });
            if (window.speak) { window.speak(welcomeMsg); }
        } else if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(
                `Starting exam: ${exam.name}. You have ${exam.duration} minutes to complete ${exam.questions.length} questions. Good luck!`
            );
            window.speechSynthesis.speak(utterance);
        }
    }
}

// Load individual exam question
function loadExamQuestion(index) {
    const exam = window.currentExamState.exam;
    const question = exam.questions[index];

    if (!question) return;

    window.currentExamState.currentQuestionIndex = index;

    // Update question display
    if (document.getElementById('question-number')) document.getElementById('question-number').textContent = index + 1;
    if (document.getElementById('questionNumber')) document.getElementById('questionNumber').textContent = index + 1;
    if (document.getElementById('current-question')) document.getElementById('current-question').textContent = index + 1;
    if (document.getElementById('currentQuestion')) document.getElementById('currentQuestion').textContent = index + 1;

    if (document.getElementById('question-text')) document.getElementById('question-text').textContent = question.text;
    if (document.getElementById('questionText')) document.getElementById('questionText').textContent = question.text;

    if (document.getElementById('question-marks')) document.getElementById('question-marks').textContent = question.marks || 2;
    if (document.getElementById('questionMarks')) document.getElementById('questionMarks').textContent = question.marks || 2;

    // Update progress bar
    const progress = ((index + 1) / exam.questions.length) * 100;
    if (document.getElementById('exam-progress')) document.getElementById('exam-progress').style.width = `${progress}%`;
    if (document.getElementById('examProgress')) document.getElementById('examProgress').style.width = `${progress}%`;

    // Load options or free-text input
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    if (question.options && question.options.length) {
        question.options.forEach((option, idx) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            optionDiv.innerHTML = `
                <div class="option-content">
                    <div class="option-letter">${String.fromCharCode(65 + idx)}</div>
                    <div class="option-text">${option}</div>
                </div>
            `;
            optionDiv.onclick = () => selectExamOption(idx);

            // Highlight if already selected
            if (window.currentExamState.answers[question.id] === idx || window.currentExamState.answersArray[index] === idx) {
                optionDiv.classList.add('selected');
            }

            optionsContainer.appendChild(optionDiv);
        });
    } else {
        const ta = document.createElement('textarea');
        ta.id = 'free-text-answer';
        ta.rows = 4;
        ta.placeholder = 'Type your answer here...';
        ta.style.width = '100%';
        ta.value = (window.currentExamState.answers[question.id] || '');
        ta.addEventListener('input', () => {
            window.currentExamState.answers[question.id] = ta.value;
        });
        optionsContainer.appendChild(ta);
    }

    // Update navigation buttons (handle potential duplicate IDs on page)
    document.querySelectorAll('#prev-btn, #prevBtn').forEach(btn => { btn.disabled = index === 0; });
    document.querySelectorAll('#next-btn, #nextBtn').forEach(btn => {
        if (index === exam.questions.length - 1) {
            btn.innerHTML = '<i class="fas fa-check"></i> Submit';
        } else {
            btn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }
    });
    try { console.debug('[Exam] Loaded question index', index); } catch (e) { }

    if (window.voiceReadingActive) {
        if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) { } }
        if (window.speak && window.formatMessage) {
            let questionText = window.formatMessage('questionPrefix', {
                number: index + 1,
                total: exam.questions.length
            }) + ' ' + question.text + '. ';
            if (question.options && question.options.length) {
                questionText += window.formatMessage('optionsPrefix', {}) + ' ';
                question.options.forEach((option, idx) => {
                    questionText += window.formatMessage('optionFormat', {
                        letter: String.fromCharCode(65 + idx),
                        text: option
                    }) + ' ';
                });
            }
            window.speak(questionText);
        }
    }
}

// Select exam option
function selectExamOption(index) {
    const question = window.currentExamState.exam.questions[window.currentExamState.currentQuestionIndex];
    window.currentExamState.answers[question.id] = index;
    window.currentExamState.answersArray[window.currentExamState.currentQuestionIndex] = index;

    // Update UI
    document.querySelectorAll('.option').forEach((opt, idx) => {
        if (idx === index) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });


}

// Start exam timer
function startExamTimer(seconds) {
    let timeRemaining = seconds;
    const timerDisplay = document.getElementById('exam-time');

    window.examTimerInterval = setInterval(() => {
        timeRemaining--;
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const secs = timeRemaining % 60;

        timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Warnings with TTS
        if (timeRemaining === 300) { try { new SpeechSynthesisUtterance && window.speechSynthesis.speak(new SpeechSynthesisUtterance('Five minutes remaining')); } catch (e) { } }
        if (timeRemaining === 60) { try { new SpeechSynthesisUtterance && window.speechSynthesis.speak(new SpeechSynthesisUtterance('One minute remaining')); } catch (e) { } }

        // Time's up
        if (timeRemaining <= 0) {
            clearInterval(window.examTimerInterval);
            submitCurrentExam();
        }
    }, 1000);
}

// Submit current exam
function submitCurrentExam() {
    if (!window.currentExamState) return;

    clearInterval(window.examTimerInterval);

    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
    const exam = window.currentExamState.exam;
    const answers = window.currentExamState.answers;

    saveStudentSubmission(exam.id, currentUser.id, answers, '');
    try {
        generateAnswersPdf(exam, answers, currentUser);
        generateAnswersText(exam, answers, currentUser);
    } catch (e) { console.error('Export failed:', e); }
    alert('Exam submitted! Your answers have been saved as PDF and Text.');


    // Return to dashboard and logout automatically after reading result
    setTimeout(() => {
        try {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('autoscribe_user');
        } catch (e) { }
        // Navigate to login/home
        if (document.getElementById('exam-section') && document.getElementById('dashboard-section')) {
            document.getElementById('exam-section').classList.remove('active');
            document.getElementById('dashboard-section').classList.add('active');
        }
        loadStudentExams && loadStudentExams();
        window.location.href = 'index.html';
    }, 1200);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeStorage();

    // Load exams if on student dashboard
    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
    if (currentUser && currentUser.role === 'student') {
        loadStudentExams();
    }
    // Keyboard navigation bindings for the entire exam
    document.addEventListener('keydown', (e) => {
        // Ignore when typing in inputs or textareas
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                nextQuestion();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                previousQuestion();
                break;
            case '1':
            case '2':
            case '3':
            case '4': {
                const idx = parseInt(e.key, 10) - 1;
                if (window.currentExamState && window.currentExamState.exam && window.currentExamState.exam.questions) {
                    const q = window.currentExamState.exam.questions[window.currentExamState.currentQuestionIndex];
                    if (q && q.options && idx >= 0 && idx < q.options.length) {
                        e.preventDefault();
                        selectExamOption(idx);
                    }
                }
                break;
            }
            case 'r':
            case 'R':
                e.preventDefault();
                // Replay question + options
                loadExamQuestion(window.currentExamState.currentQuestionIndex);
                break;
            case 'q':
            case 'Q':
                e.preventDefault();
                speakQuestionOnly();
                break;
            case 'o':
            case 'O':
                e.preventDefault();
                speakOptionsOnly();
                break;
            case 's':
            case 'S':
                // Submit on last question or anytime if desired
                if (confirm('Do you want to submit your exam now?')) submitCurrentExam();
                break;
        }
    });
});

// TTS helpers
function speakQuestionOnly() {
    if (!window.currentExamState) return;
    const idx = window.currentExamState.currentQuestionIndex;
    const q = window.currentExamState.exam.questions[idx];
    if (!q) return;
    try {
        if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
        const u = new SpeechSynthesisUtterance(`Question ${idx + 1}. ${q.text}`);
        window.speechSynthesis.speak(u);
    } catch (e) { }
}

function speakOptionsOnly() {
    if (!window.currentExamState) return;
    const idx = window.currentExamState.currentQuestionIndex;
    const q = window.currentExamState.exam.questions[idx];
    if (!q || !q.options || !q.options.length) return;
    try {
        if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
        let txt = 'Options are: ';
        q.options.forEach((opt, i) => { txt += `Option ${String.fromCharCode(65 + i)}, ${opt}. `; });
        const u = new SpeechSynthesisUtterance(txt);
        window.speechSynthesis.speak(u);
    } catch (e) { }
}

// Navigation functions for regular exams
function nextQuestion() {
    // If our enhanced flow is active
    if (window.currentExamState && window.currentExamState.exam) {
        try {
            const currentIndex = window.currentExamState.currentQuestionIndex;
            const totalQuestions = (window.currentExamState.exam.questions || []).length;
            if (currentIndex < totalQuestions - 1) {
                try { console.debug('[Exam] nextQuestion -> enhanced flow, from', currentIndex, 'to', currentIndex + 1); } catch (e) { }
                loadExamQuestion(currentIndex + 1);
            } else {
                if (confirm('This is the last question. Do you want to submit your exam?')) {
                    submitCurrentExam();
                }
            }
            // Re-assert button states after move
            const idx = window.currentExamState.currentQuestionIndex;
            document.querySelectorAll('#prev-btn').forEach(btn => { btn.disabled = idx === 0; });
            return;
        } catch (e) {
            // Fall through to legacy if anything goes wrong
            try { console.warn('[Exam] nextQuestion enhanced flow error -> fallback', e); } catch (_) { }
        }
    }
    // Bridge: fall back to legacy student-script.js flow
    if (typeof window.showNextQuestion === 'function') {
        try { console.debug('[Exam] nextQuestion -> legacy flow'); } catch (e) { }
        return window.showNextQuestion();
    }
}

function previousQuestion() {
    // If our enhanced flow is active
    if (window.currentExamState && window.currentExamState.exam) {
        try {
            const currentIndex = window.currentExamState.currentQuestionIndex;
            if (currentIndex > 0) {
                try { console.debug('[Exam] previousQuestion -> enhanced flow, from', currentIndex, 'to', currentIndex - 1); } catch (e) { }
                loadExamQuestion(currentIndex - 1);
            }
            const idx = window.currentExamState.currentQuestionIndex;
            document.querySelectorAll('#prev-btn').forEach(btn => { btn.disabled = idx === 0; });
            return;
        } catch (e) {
            // Fall through to legacy if anything goes wrong
            try { console.warn('[Exam] previousQuestion enhanced flow error -> fallback', e); } catch (_) { }
        }
    }
    // Bridge: fall back to legacy student-script.js flow
    if (typeof window.showPreviousQuestion === 'function') {
        try { console.debug('[Exam] previousQuestion -> legacy flow'); } catch (e) { }
        return window.showPreviousQuestion();
    }
}

// Mark for review
function markForReview() {
    if (!window.currentExamState) return;

    const currentIndex = window.currentExamState.currentQuestionIndex;
    const question = window.currentExamState.exam.questions[currentIndex];

    if (!window.currentExamState.markedForReview) {
        window.currentExamState.markedForReview = [];
    }

    const isMarked = window.currentExamState.markedForReview.includes(question.id);

    if (isMarked) {
        window.currentExamState.markedForReview = window.currentExamState.markedForReview.filter(id => id !== question.id);
        alert('Question unmarked for review');
    } else {
        window.currentExamState.markedForReview.push(question.id);
        alert('Question marked for review');
    }
}

// Export functions
window.saveExamToStorage = saveExamToStorage;
window.getAllExamsFromStorage = getAllExamsFromStorage;
window.getAvailableExamsForStudent = getAvailableExamsForStudent;
window.startExamById = startExamById;
window.submitCurrentExam = submitCurrentExam;
window.loadStudentExams = loadStudentExams;
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.markForReview = markForReview;
window.selectExamOption = selectExamOption;

function generateAnswersPdf(exam, answers, user) {
    try {
        const lib = window.jspdf || window.jsPDF;
        const jsPDF = lib && lib.jsPDF ? lib.jsPDF : lib;
        if (!jsPDF) { alert('PDF export is not available.'); return; }
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        let y = 48;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(`Exam Answers - ${exam.name}`, 40, y);
        y += 22;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const studentLine = `Student: ${(user && (user.name || ''))} ${(user && user.id) ? '(' + user.id + ')' : ''}`.trim();
        if (studentLine) { doc.text(studentLine, 40, y); y += 16; }
        doc.text(`Date: ${new Date().toLocaleString()}`, 40, y);
        y += 24;
        const pageHeight = doc.internal.pageSize.getHeight();
        const maxWidth = 530;
        exam.questions.forEach((q, i) => {
            const qHeader = `Q${i + 1}. ${q.text}`;
            const qLines = doc.splitTextToSize(qHeader, maxWidth);
            if (y + qLines.length * 14 > pageHeight - 40) { doc.addPage(); y = 48; }
            doc.setFont('helvetica', 'bold');
            doc.text(qLines, 40, y);
            y += qLines.length * 14 + 6;
            doc.setFont('helvetica', 'normal');
            let ansText = '';
            let ans = (q && 'id' in q) ? answers[q.id] : undefined;
            if (ans === undefined && window.currentExamState && Array.isArray(window.currentExamState.answersArray)) {
                ans = window.currentExamState.answersArray[i];
            }
            if (q.options && Array.isArray(q.options)) {
                if (typeof ans === 'number') {
                    const letter = String.fromCharCode(65 + ans);
                    const opt = q.options[ans] || '';
                    ansText = `Answer: ${letter} - ${opt}`;
                } else if (typeof ans === 'string') {
                    ansText = `Answer: ${ans}`;
                } else {
                    ansText = 'Answer: (not answered)';
                }
            } else {
                ansText = `Answer: ${(ans !== undefined && ans !== null && String(ans).length) ? String(ans) : '(not answered)'}`;
            }
            const aLines = doc.splitTextToSize(ansText, maxWidth);
            if (y + aLines.length * 14 > pageHeight - 40) { doc.addPage(); y = 48; }
            doc.text(aLines, 60, y);
            y += aLines.length * 14 + 12;
        });
        const safeName = (exam.name || 'exam').replace(/[^a-z0-9_\-]+/gi, '_');
        const sid = user && user.id ? user.id : 'student';
        doc.save(`answers_${safeName}_${sid}.pdf`);
    } catch (e) {
        console.error('PDF generation failed', e);
    }
}

function generateAnswersText(exam, answers, user) {
    try {
        let textContent = `EXAM ANSWERS - ${exam.name}\n`;
        textContent += `====================================\n`;
        textContent += `Student: ${user && user.name ? user.name : 'N/A'} (${user && user.id ? user.id : 'N/A'})\n`;
        textContent += `Date: ${new Date().toLocaleString()}\n`;
        textContent += `------------------------------------\n\n`;

        exam.questions.forEach((q, i) => {
            textContent += `Q${i + 1}: ${q.text}\n`;

            let ans = (q && 'id' in q) ? answers[q.id] : undefined;
            if (ans === undefined && window.currentExamState && Array.isArray(window.currentExamState.answersArray)) {
                ans = window.currentExamState.answersArray[i];
            }

            let ansText = '';
            if (q.options && Array.isArray(q.options)) {
                if (typeof ans === 'number') {
                    const letter = String.fromCharCode(65 + ans);
                    const opt = q.options[ans] || '';
                    ansText = `${letter} - ${opt}`;
                } else if (typeof ans === 'string') {
                    ansText = ans;
                } else {
                    ansText = '(not answered)';
                }
            } else {
                ansText = (ans !== undefined && ans !== null && String(ans).length) ? String(ans) : '(not answered)';
            }

            textContent += `Answer: ${ansText}\n\n`;
        });

        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = (exam.name || 'exam').replace(/[^a-z0-9_\-]+/gi, '_');
        const sid = user && user.id ? user.id : 'student';

        a.href = url;
        a.download = `answers_${safeName}_${sid}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('Text generation failed', e);
    }
}

