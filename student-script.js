// Student Exam Script
let currentExam = null;
let currentQuestionIndex = 0;
let answers = {};
let timerInterval = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize sample data
    // initializeSampleData(); // Commented out - not needed

    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }

    // Initialize UI
    document.getElementById('student-name').textContent = currentUser.name;

    // Load data and set up event listeners
    loadAvailableExams();
    loadSubmissions();
    setupEventListeners();
    loadMockExams();
});

// Set up event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('startExamBtn')?.addEventListener('click', startExam);
    document.getElementById('prevBtn')?.addEventListener('click', showPreviousQuestion);
    document.getElementById('nextBtn')?.addEventListener('click', showNextQuestion);
    document.getElementById('submitExamBtn')?.addEventListener('click', showSubmitConfirm);
    document.getElementById('confirmSubmitBtn')?.addEventListener('click', submitExam);
    document.getElementById('cancelSubmitBtn')?.addEventListener('click', () => {
        document.getElementById('submitConfirmModal').style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('submissionDetailsModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Close modal with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('submissionDetailsModal').style.display = 'none';
            document.getElementById('submitConfirmModal').style.display = 'none';
        }
    });
}

// Load mock exams dynamically
function loadMockExams() {
    const mockExamList = document.getElementById('mockExamList');
    if (!mockExamList) return;

    // Always initialize with empty array
    window.MOCK_EXAMS = [];

    // Show empty state since we're not loading any default exams
    mockExamList.innerHTML = `
        <div class="no-mock-exams">
            <i class="fas fa-book-open"></i>
            <h3>No Mock Exams Available</h3>
            <p>Please upload mock exam question papers to get started with practice tests.</p>
            <button class="btn btn-primary" onclick="alert('Upload functionality will be implemented here')">
                <i class="fas fa-upload"></i> Upload Mock Exam
            </button>
        </div>
    `;
}

// Start mock exam
function startMockExamFromList(examId) {
    // No default exams available
    alert('No mock exams available. Please upload exam content first.');
    return;

    // Update exam title and meta
    document.getElementById('exam-title').textContent = exam.title + ' (Practice)';
    document.getElementById('exam-subject').textContent = exam.subject;
    document.getElementById('exam-duration').textContent = `${exam.duration} min`;

    // Load first question
    showQuestion(currentQuestionIndex);

    // Start timer
    startExamTimer(exam.duration * 60); // Convert minutes to seconds
}

// Show question
function showQuestion(index) {
    if (!currentExam || !currentExam.questions[index]) return;
    const question = currentExam.questions[index];
    currentQuestionIndex = index;

    document.getElementById('question-number').textContent = index + 1;
    document.getElementById('question-text').textContent = question.text;
    document.getElementById('question-marks').textContent = question.marks;
    document.getElementById('total-questions').textContent = currentExam.questions.length;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    question.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = `${String.fromCharCode(65 + i)}) ${opt}`;
        btn.onclick = () => selectOption(i);
        optionsContainer.appendChild(btn);
    });
}

// Select option
function selectOption(index) {
    if (!currentExam) return;
    const question = currentExam.questions[currentQuestionIndex];
    answers[question.id] = { answer: String.fromCharCode(65 + index) };
    alert(`You selected option ${String.fromCharCode(65 + index)}`);
}

// Start exam timer
function startExamTimer(seconds) {
    const timerElem = document.getElementById('exam-time');
    let remaining = seconds;

    timerInterval = setInterval(() => {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerElem.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        remaining--;
        if (remaining < 0) {
            clearInterval(timerInterval);
            submitExam();
        }
    }, 1000);
}

// Save answer
function saveAnswer() {
    // Already handled in selectOption
}

// Show submit confirmation modal
function showSubmitConfirm() {
    const modal = document.getElementById('submitConfirmModal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        // Fallback to native confirm if modal element is missing
        if (confirm("Are you sure you want to submit your exam?")) {
            submitExam();
        }
    }
}

// Submit exam
function submitExam() {
    saveAnswer();

    if (currentExam && currentExam.isMock) {
        let score = 0;
        let totalMarks = 0;

        currentExam.questions.forEach(q => {
            totalMarks += q.marks;
            const answer = answers[q.id];
            if (answer && answer.answer === q.correctAnswer) score += q.marks;
        });

        const percentage = Math.round((score / totalMarks) * 100);
        alert(`Practice exam completed! Score: ${score}/${totalMarks} (${percentage}%)`);

        // Return to dashboard
        document.getElementById('exam-section').classList.remove('active');
        document.getElementById('dashboard-section').classList.add('active');

        if (timerInterval) clearInterval(timerInterval);
        currentExam = null;
        answers = {};
    } else {
        // Original exam submission logic here...
    }
}

// Navigation functions
function showNextQuestion() {
    if (!currentExam) return;
    if (currentQuestionIndex < currentExam.questions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
}

function showPreviousQuestion() {
    if (!currentExam) return;
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

// Language selection function
function selectLanguage(languageCode) {
    if (window.changeExamLanguage) {
        window.changeExamLanguage(languageCode);

        // Update display
        const languageNames = {
            'en': 'English',
            'hi': 'हिन्दी',
            'ta': 'தமிழ்'
        };

        const displayElement = document.getElementById('current-language-display');
        if (displayElement) {
            displayElement.textContent = languageNames[languageCode] || 'English';
        }

        // Show confirmation
        alert(`Language changed to ${languageNames[languageCode]}. Voice commands will now work in this language.`);

        // Return to dashboard
        const languageSection = document.getElementById('language-section');
        const dashboardSection = document.getElementById('dashboard-section');
        if (languageSection && dashboardSection) {
            languageSection.classList.remove('active');
            dashboardSection.classList.add('active');
        }
    }
}

// Change language function
function changeLanguage() {
    const dashboardSection = document.getElementById('dashboard-section');
    const languageSection = document.getElementById('language-section');

    if (dashboardSection && languageSection) {
        dashboardSection.classList.remove('active');
        languageSection.classList.add('active');
    }
}

// Refresh exams
function refreshExams() {
    if (window.loadStudentExams) {
        window.loadStudentExams();
        alert('Exams refreshed!');
    } else {
        loadAvailableExams();
        alert('Exams refreshed!');
    }
}

// Test microphone
function testMicrophone() {
    if (window.speak) {
        window.speak('Microphone test. If you can hear this, your microphone is working correctly.');
    } else {
        alert('Testing microphone... Please check your browser console.');
    }
}

// Show help
function showHelp() {
    const dashboardSection = document.getElementById('dashboard-section');
    const helpSection = document.getElementById('help-section');

    if (dashboardSection && helpSection) {
        dashboardSection.classList.remove('active');
        helpSection.classList.add('active');
    }
}

// Load available exams
function loadAvailableExams() {
    const examsList = document.getElementById('current-exams-list');
    if (!examsList) return;

    // Pull exams via exam-connector (teacher saved under autoscribe_exams)
    let exams = [];
    try {
        exams = (typeof window.getAvailableExamsForStudent === 'function')
            ? window.getAvailableExamsForStudent()
            : (JSON.parse(localStorage.getItem('autoscribe_exams')) || []);
    } catch (_) {
        exams = JSON.parse(localStorage.getItem('autoscribe_exams')) || [];
    }

    if (!exams.length) {
        examsList.innerHTML = '<div class="no-exams">No exams available at the moment.</div>';
        return;
    }

    // If teacher did not set time window, fall back to status filter
    const now = new Date();
    const availableExams = exams.filter(exam => {
        if (exam.startTime && exam.endTime) {
            const start = new Date(exam.startTime);
            const end = new Date(exam.endTime);
            return now >= start && now <= end;
        }
        return exam.status === 'available' || exam.status === 'scheduled';
    });

    if (!availableExams.length) {
        examsList.innerHTML = '<div class="no-exams">No active exams at the moment. Please check back later.</div>';
        return;
    }

    examsList.innerHTML = availableExams.map(exam => `
        <div class="exam-card">
            <div class="exam-header">
                <h3>${exam.name}</h3>
                <span class="exam-subject">${exam.subject || 'General'}</span>
            </div>
            <div class="exam-details">
                <p><i class="far fa-clock"></i> Duration: ${exam.duration} minutes</p>
                ${exam.endTime ? `<p><i class=\"far fa-calendar-alt\"></i> Available until: ${new Date(exam.endTime).toLocaleString()}</p>` : ''}
            </div>
            <div class="exam-actions">
                <button class="btn btn-primary" onclick="startExamById('${exam.id}')">
                    <i class="fas fa-play"></i> Start Exam
                </button>
            </div>
        </div>
    `).join('');
}

// Load submissions
function loadSubmissions() {
    // This will be handled by exam-connector.js
    console.log('Loading student submissions...');
}

// Start exam
function startExam(examId) {
    // Get the exam from localStorage
    const exams = JSON.parse(localStorage.getItem('exams')) || [];
    const exam = exams.find(e => e.id === examId);

    if (!exam) {
        alert('Exam not found. Please try again.');
        return;
    }

    // Set current exam
    currentExam = {
        ...exam,
        isMock: false,
        startTime: new Date().toISOString()
    };

    // Initialize answers
    answers = {};
    currentQuestionIndex = 0;
    // Bridge: also initialize enhanced state so global nextQuestion()/previousQuestion() work
    try {
        window.currentExamState = {
            exam: { ...currentExam },
            currentQuestionIndex: 0,
            answers: {},
            answersArray: new Array((currentExam.questions || []).length).fill(null),
            startTime: new Date(),
            timeLimit: (currentExam.duration || 0) * 60
        };
    } catch (e) { /* no-op */ }

    // Show exam section
    document.getElementById('dashboard-section').classList.remove('active');
    document.getElementById('exam-section').classList.add('active');

    // Update exam info
    document.getElementById('exam-title').textContent = exam.name;
    document.getElementById('exam-subject').textContent = exam.subject || 'General';
    document.getElementById('exam-duration').textContent = `${exam.duration} minutes`;

    // Show first question
    showQuestion(0);

    // Start timer
    startExamTimer(exam.duration * 60); // Convert minutes to seconds
}

// Export functions globally
window.startMockExamFromList = startMockExamFromList;
window.startExam = startExam;
window.showNextQuestion = showNextQuestion;
window.showPreviousQuestion = showPreviousQuestion;
window.submitExam = submitExam;
window.selectOption = selectOption;
window.selectLanguage = selectLanguage;
window.changeLanguage = changeLanguage;
window.refreshExams = refreshExams;
window.testMicrophone = testMicrophone;
window.showHelp = showHelp;
window.loadAvailableExams = loadAvailableExams;
window.loadSubmissions = loadSubmissions;
