// Teacher Dashboard JavaScript

let currentSection = 'dashboard';
let exams = [];
let scheduledExams = [];
let attendanceData = {};
let questionCounter = 0;
let createdExam = {
    name: '',
    duration: 60,
    description: '',
    difficulty: 'Medium',
    type: 'Multiple Choice',
    questions: []
};

// Initialize teacher dashboard
document.addEventListener('DOMContentLoaded', function () {
    loadDashboardData();
    setupEventListeners();
    loadExams();
    loadScheduledExams();
    setupFileUpload();
    setupTTSControls();

    // Configure PDF.js worker if available
    if (window['pdfjsLib']) {
        try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.7.107/pdf.worker.min.js';
        } catch (e) { }
    }
});
// OCR fallback: rasterize each PDF page and run Tesseract
async function ocrExtractTextFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport }).promise;
            const dataUrl = canvas.toDataURL('image/png');
            const result = await Tesseract.recognize(dataUrl, 'eng', { logger: m => (m.status === 'recognizing text' ? console.log(`OCR ${p}/${pdf.numPages}: ${Math.round((m.progress || 0) * 100)}%`) : null) });
            fullText += '\n' + (result.data && result.data.text ? result.data.text : '');
        }
        return fullText;
    } catch (err) {
        console.error('OCR fallback failed:', err);
        return '';
    }
}

// Load parsed questions into the Create Exam builder for manual edits
function loadParsedIntoBuilder(meta, parsedQuestions) {
    // Switch to Create section
    showSection('create');
    // Reset current created exam
    createdExam = {
        name: meta.name || '',
        duration: parseInt(meta.duration) || 60,
        description: meta.description || '',
        difficulty: meta.difficulty || 'Medium',
        type: 'Mixed',
        questions: []
    };
    questionCounter = 0;

    // Map parsed questions into builder format
    createdExam.questions = parsedQuestions.map((pq, idx) => ({
        id: `question_${idx + 1}`,
        text: pq.text || '',
        options: Array.isArray(pq.options) && pq.options.length ? pq.options.slice(0, 4).concat(Array(4).fill('')).slice(0, 4) : [],
        correct: (typeof pq.correct === 'number' ? pq.correct : 0)
    }));

    // Render into UI
    loadCreateExam();
}

// Show preview modal for parsed questions before saving
function showParsedPreview(meta, parsedQuestions) {
    // Build modal elements
    const overlay = document.createElement('div');
    overlay.id = 'preview-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.55)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';

    const modal = document.createElement('div');
    modal.style.background = '#fff';
    modal.style.width = 'min(900px, 92vw)';
    modal.style.maxHeight = '84vh';
    modal.style.borderRadius = '10px';
    modal.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.color = '#1f2937';

    const header = document.createElement('div');
    header.style.padding = '16px 20px';
    header.style.borderBottom = '1px solid #e5e7eb';
    header.innerHTML = `<h3 style="margin:0">Preview Parsed Questions (${parsedQuestions.length})</h3>
        <p style="margin:6px 0 0;color:#6b7280;font-size:14px">${escapeHtml(meta.name)} • ${escapeHtml(meta.subject)} • ${escapeHtml(meta.duration)} mins</p>`;

    const body = document.createElement('div');
    body.style.padding = '12px 20px';
    body.style.overflow = 'auto';
    body.style.flex = '1';

    const list = document.createElement('div');
    parsedQuestions.forEach((q, idx) => {
        const item = document.createElement('div');
        item.style.border = '1px solid #e5e7eb';
        item.style.borderRadius = '8px';
        item.style.padding = '12px';
        item.style.marginBottom = '10px';
        const title = `Q${idx + 1}. ${escapeHtml(q.text)}`;
        let html = `<div style="font-weight:600;margin-bottom:6px">${title}</div>`;
        if (q.options && q.options.length) {
            html += '<ol type="A" style="margin:0 0 4px 18px">' + q.options.map(o => `<li>${escapeHtml(o)}</li>`).join('') + '</ol>';
        }
        html += `<div style="color:#6b7280;font-size:12px">marks: ${q.marks || 2}${typeof q.correct === 'number' ? ' • correct stored' : ''}</div>`;
        item.innerHTML = html;
        list.appendChild(item);
    });
    body.appendChild(list);

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.gap = '10px';
    footer.style.padding = '12px 20px';
    footer.style.borderTop = '1px solid #e5e7eb';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn btn-outline';
    cancelBtn.onclick = () => document.body.removeChild(overlay);

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirm & Save';
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.onclick = () => {
        // Build and save exam
        const exam = {
            id: 'EXAM' + Date.now(),
            name: meta.name,
            teacherId: getUserData().id,
            date: meta.date,
            duration: parseInt(meta.duration),
            subject: meta.subject,
            description: meta.description,
            difficulty: meta.difficulty,
            status: 'available',
            questions: parsedQuestions.map((q, idx) => ({
                id: idx + 1,
                text: q.text,
                options: q.options && q.options.length ? q.options : undefined,
                correct: (typeof q.correct === 'number' ? q.correct : undefined),
                marks: q.marks || 2
            })),
            createdAt: new Date(),
            scheduledStart: null,
            scheduledEnd: null
        };
        if (saveExamToStorage(exam)) {
            document.body.removeChild(overlay);
            alert('Exam parsed and saved successfully!');
            resetUploadForm();
            loadExams();
            updateExamSelects();
        } else {
            alert('Error saving exam. Please try again.');
        }
    };

    footer.appendChild(cancelBtn);
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit in Builder';
    editBtn.className = 'btn btn-secondary';
    editBtn.onclick = () => {
        document.body.removeChild(overlay);
        loadParsedIntoBuilder(meta, parsedQuestions);
    };
    footer.appendChild(editBtn);
    footer.appendChild(confirmBtn);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function escapeHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Setup event listeners
function setupEventListeners() {
    // Speech rate and pitch controls
    document.getElementById('speech-rate').addEventListener('input', function () {
        document.getElementById('rate-value').textContent = this.value;
    });

    document.getElementById('speech-pitch').addEventListener('input', function () {
        document.getElementById('pitch-value').textContent = this.value;
    });

    // Auto-refresh dashboard every 30 seconds
    setInterval(loadDashboardData, 30000);
}

// Show different sections
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.add('active');

    // Add active class to clicked nav button (guard if called programmatically)
    if (typeof event !== 'undefined' && event && event.target) {
        event.target.classList.add('active');
    } else {
        const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.textContent.toLowerCase().includes(sectionName));
        if (btn) btn.classList.add('active');
    }

    currentSection = sectionName;

    // Load section-specific data
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'upload':
            loadExams();
            break;
        case 'schedule':
            loadScheduledExams();
            populateScheduleExamSelect();
            break;
        case 'attendance':
            loadAttendanceExams();
            break;
        case 'create':
            loadCreateExam();
            break;
    }
}

// Schedule exam
function scheduleExam() {
    const examId = document.getElementById('schedule-exam-select').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const autoActivate = document.getElementById('auto-activate').checked;

    if (!examId || !startTime || !endTime) {
        alert('Please fill in all fields.');
        return;
    }

    const exam = exams.find(e => e.id === examId);
    if (!exam) {
        alert('Exam not found.');
        return;
    }

    const scheduledExam = {
        id: Date.now().toString(),
        examId: examId,
        name: exam.name,
        startTime: startTime,
        endTime: endTime,
        status: autoActivate ? 'scheduled' : 'active',
        autoActivate: autoActivate
    };

    scheduledExams.push(scheduledExam);

    // Clear form
    document.getElementById('schedule-exam-select').value = '';
    document.getElementById('start-time').value = '';
    document.getElementById('end-time').value = '';
    document.getElementById('auto-activate').checked = true;

    // Set up auto-activation if enabled
    if (autoActivate) {
        setupAutoActivation(scheduledExam);
    }

    loadScheduledExams();
    alert('Exam scheduled successfully!');
}

// Setup auto-activation
function setupAutoActivation(scheduledExam) {
    const startTime = new Date(scheduledExam.startTime);
    const endTime = new Date(scheduledExam.endTime);
    const now = new Date();

    // Activate exam at start time
    if (startTime > now) {
        const timeToStart = startTime.getTime() - now.getTime();
        setTimeout(() => {
            activateExam(scheduledExam.id);
        }, timeToStart);
    }

    // Deactivate exam at end time
    if (endTime > now) {
        const timeToEnd = endTime.getTime() - now.getTime();
        setTimeout(() => {
            deactivateExam(scheduledExam.id);
        }, timeToEnd);
    }
}

// Activate exam
function activateExam(scheduledExamId) {
    const exam = scheduledExams.find(e => e.id === scheduledExamId);
    if (exam) {
        exam.status = 'active';
        loadScheduledExams();
        console.log(`Exam "${exam.name}" activated automatically`);
    }
}

// Deactivate exam
function deactivateExam(scheduledExamId) {
    const exam = scheduledExams.find(e => e.id === scheduledExamId);
    if (exam) {
        exam.status = 'completed';
        loadScheduledExams();
        console.log(`Exam "${exam.name}" deactivated automatically`);
    }
}

// Load scheduled exams
function loadScheduledExams() {
    const container = document.getElementById('scheduled-exams-list');

    container.innerHTML = scheduledExams.map(exam => `
        <div class="scheduled-item">
            <h4>${exam.name}</h4>
            <p>Start: ${new Date(exam.startTime).toLocaleString()}</p>
            <p>End: ${new Date(exam.endTime).toLocaleString()}</p>
            <p>Status: <span class="status ${exam.status}">${exam.status}</span></p>
            <div class="exam-actions">
                <button onclick="activateExam('${exam.id}')" ${exam.status === 'active' ? 'disabled' : ''}>
                    Activate
                </button>
                <button onclick="deactivateExam('${exam.id}')" ${exam.status === 'completed' ? 'disabled' : ''}>
                    Deactivate
                </button>
            </div>
        </div>
    `).join('');
}

// Load attendance exams
function loadAttendanceExams() {
    updateExamSelects();
}

// Load attendance data
function loadAttendance() {
    const examId = document.getElementById('attendance-exam-select').value;

    if (!examId) {
        alert('Please select an exam.');
        return;
    }

    // Simulate loading attendance data
    const mockAttendance = generateMockAttendance(examId);
    displayAttendance(mockAttendance);
}

// Generate mock attendance data
function generateMockAttendance(examId) {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return { attendees: [], total: 0, percentage: 0 };

    const totalStudents = 150;
    const attendees = Math.floor(Math.random() * totalStudents * 0.8) + 20; // 20-140 students
    const percentage = Math.round((attendees / totalStudents) * 100);

    const studentList = [];
    for (let i = 1; i <= totalStudents; i++) {
        studentList.push({
            id: `STU${i.toString().padStart(3, '0')}`,
            name: `Student ${i}`,
            present: i <= attendees
        });
    }

    return {
        attendees: studentList,
        total: attendees,
        percentage: percentage
    };
}

// Display attendance data
function displayAttendance(data) {
    document.getElementById('total-attendees').textContent = data.total;
    document.getElementById('attendance-percentage').textContent = data.percentage + '%';

    const container = document.getElementById('attendance-list');
    container.innerHTML = data.attendees.map(student => `
        <div class="attendance-item">
            <div class="student-info">
                <i class="fas fa-user"></i>
                <div>
                    <strong>${student.name}</strong>
                    <p>ID: ${student.id}</p>
                </div>
            </div>
            <span class="status-badge ${student.present ? 'present' : 'absent'}">
                ${student.present ? 'Present' : 'Absent'}
            </span>
        </div>
    `).join('');
}

// Setup TTS controls
function setupTTSControls() {
    // TTS controls are already set up in setupEventListeners
}

// Preview speech
function previewSpeech() {
    const examName = document.getElementById('preview-exam-name').textContent;
    const examDate = document.getElementById('preview-exam-date').textContent;
    const examDuration = document.getElementById('preview-exam-duration').textContent;
    const difficulty = document.getElementById('preview-difficulty').textContent;

    const rate = parseFloat(document.getElementById('speech-rate').value);
    const pitch = parseFloat(document.getElementById('speech-pitch').value);

    const text = `Exam: ${examName}. ${examDate}. ${examDuration}. ${difficulty}. This is a preview of how the exam will sound to students.`;

    if (window.AutoscribeUtils) {
        window.AutoscribeUtils.speak(text, rate, pitch);
    }
}

// Stop speech
function stopSpeech() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}

// Logout function
function logout() {
    if (window.AutoscribeUtils) {
        window.AutoscribeUtils.clearUserData();
    }
    window.location.href = 'index.html';
}

// Initialize with demo data
function initializeSampleData() {
    // Load user data
    const userData = getUserData();
    if (userData && userData.type === 'teacher') {
        document.getElementById('teacher-name').textContent = `Welcome, ${userData.name}`;

        // Load teacher's exams
        const teacherExams = getExamsByTeacher(userData.id);
        exams = teacherExams.map(exam => ({
            id: exam.id,
            name: exam.name,
            date: exam.date,
            duration: exam.duration.toString(),
            description: exam.description,
            difficulty: exam.difficulty
        }));

        // Load scheduled exams
        scheduledExams = teacherExams
            .filter(exam => exam.scheduledStart)
            .map(exam => ({
                id: 's' + exam.id,
                examId: exam.id,
                name: exam.name,
                startTime: exam.scheduledStart.toISOString().slice(0, 16),
                endTime: exam.scheduledEnd.toISOString().slice(0, 16),
                status: exam.status,
                autoActivate: true
            }));
    }
}

// Initialize teacher dashboard when the page loads
document.addEventListener('DOMContentLoaded', function () {
    // Load any existing exams from localStorage
    loadExams();

    // Initialize the dashboard
    loadDashboardData();
    loadRecentExams();
    loadUpcomingExams();
    loadScheduledExams();
    loadAttendanceExams();
    loadAttendance();
    setupTTSControls();

    // Show dashboard by default
    showSection('dashboard');

    console.log('Teacher dashboard initialized');
});

// Exam Creation Functions
function loadCreateExam() {
    // Initialize the create exam form
    document.getElementById('create-exam-name').value = createdExam.name;
    document.getElementById('create-exam-duration').value = createdExam.duration;
    document.getElementById('create-exam-description').value = createdExam.description;
    document.getElementById('create-exam-difficulty').value = createdExam.difficulty;
    document.getElementById('create-exam-type').value = createdExam.type;

    // Load existing questions
    loadQuestions();
}

function addQuestion() {
    questionCounter++;
    const questionId = `question_${questionCounter}`;

    const questionHTML = `
        <div class="question-item" id="${questionId}">
            <div class="question-header">
                <div class="question-number">${questionCounter}</div>
                <button class="delete-question-btn" onclick="deleteQuestion('${questionId}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            <input type="text" class="question-text-input" placeholder="Enter your question here..." 
                   onchange="updateQuestion('${questionId}', 'text', this.value)">
            <div class="options-container">
                <div class="option-item">
                    <div class="option-letter">A</div>
                    <input type="text" class="option-input" placeholder="Option A" 
                           onchange="updateQuestion('${questionId}', 'optionA', this.value)">
                </div>
                <div class="option-item">
                    <div class="option-letter">B</div>
                    <input type="text" class="option-input" placeholder="Option B" 
                           onchange="updateQuestion('${questionId}', 'optionB', this.value)">
                </div>
                <div class="option-item">
                    <div class="option-letter">C</div>
                    <input type="text" class="option-input" placeholder="Option C" 
                           onchange="updateQuestion('${questionId}', 'optionC', this.value)">
                </div>
                <div class="option-item">
                    <div class="option-letter">D</div>
                    <input type="text" class="option-input" placeholder="Option D" 
                           onchange="updateQuestion('${questionId}', 'optionD', this.value)">
                </div>
            </div>
            <div class="correct-option">
                <label>Correct Answer:</label>
                <select onchange="updateQuestion('${questionId}', 'correct', this.value)">
                    <option value="0">A</option>
                    <option value="1">B</option>
                    <option value="2">C</option>
                    <option value="3">D</option>
                </select>
            </div>
        </div>
    `;

    document.getElementById('questions-list').insertAdjacentHTML('beforeend', questionHTML);

    // Add to created exam
    createdExam.questions.push({
        id: questionId,
        text: '',
        options: ['', '', '', ''],
        correct: 0
    });
}

function deleteQuestion(questionId) {
    const questionElement = document.getElementById(questionId);
    if (questionElement) {
        questionElement.remove();

        // Remove from created exam
        createdExam.questions = createdExam.questions.filter(q => q.id !== questionId);

        // Update question numbers
        updateQuestionNumbers();
    }
}

function updateQuestionNumbers() {
    const questions = document.querySelectorAll('.question-item');
    questions.forEach((question, index) => {
        const numberElement = question.querySelector('.question-number');
        if (numberElement) {
            numberElement.textContent = index + 1;
        }
    });
}

function updateQuestion(questionId, field, value) {
    const question = createdExam.questions.find(q => q.id === questionId);
    if (question) {
        if (field === 'text') {
            question.text = value;
        } else if (field.startsWith('option')) {
            const optionIndex = field.charAt(field.length - 1);
            const optionMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
            question.options[optionMap[optionIndex]] = value;
        } else if (field === 'correct') {
            question.correct = parseInt(value);
        }
    }
}

function loadQuestions() {
    const questionsList = document.getElementById('questions-list');
    questionsList.innerHTML = '';

    createdExam.questions.forEach((question, index) => {
        questionCounter = Math.max(questionCounter, index + 1);

        const questionHTML = `
            <div class="question-item" id="${question.id}">
                <div class="question-header">
                    <div class="question-number">${index + 1}</div>
                    <button class="delete-question-btn" onclick="deleteQuestion('${question.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                <input type="text" class="question-text-input" placeholder="Enter your question here..." 
                       value="${question.text}" onchange="updateQuestion('${question.id}', 'text', this.value)">
                <div class="options-container">
                    <div class="option-item">
                        <div class="option-letter">A</div>
                        <input type="text" class="option-input" placeholder="Option A" 
                               value="${question.options[0]}" onchange="updateQuestion('${question.id}', 'optionA', this.value)">
                    </div>
                    <div class="option-item">
                        <div class="option-letter">B</div>
                        <input type="text" class="option-input" placeholder="Option B" 
                               value="${question.options[1]}" onchange="updateQuestion('${question.id}', 'optionB', this.value)">
                    </div>
                    <div class="option-item">
                        <div class="option-letter">C</div>
                        <input type="text" class="option-input" placeholder="Option C" 
                               value="${question.options[2]}" onchange="updateQuestion('${question.id}', 'optionC', this.value)">
                    </div>
                    <div class="option-item">
                        <div class="option-letter">D</div>
                        <input type="text" class="option-input" placeholder="Option D" 
                               value="${question.options[3]}" onchange="updateQuestion('${question.id}', 'optionD', this.value)">
                    </div>
                </div>
                <div class="correct-option">
                    <label>Correct Answer:</label>
                    <select onchange="updateQuestion('${question.id}', 'correct', this.value)">
                        <option value="0" ${question.correct === 0 ? 'selected' : ''}>A</option>
                        <option value="1" ${question.correct === 1 ? 'selected' : ''}>B</option>
                        <option value="2" ${question.correct === 2 ? 'selected' : ''}>C</option>
                        <option value="3" ${question.correct === 3 ? 'selected' : ''}>D</option>
                    </select>
                </div>
            </div>
        `;

        questionsList.insertAdjacentHTML('beforeend', questionHTML);
    });
}

function saveCreatedExam() {
    // Get exam information
    createdExam.name = document.getElementById('create-exam-name').value;
    createdExam.duration = parseInt(document.getElementById('create-exam-duration').value);
    createdExam.description = document.getElementById('create-exam-description').value;
    createdExam.difficulty = document.getElementById('create-exam-difficulty').value;
    createdExam.type = document.getElementById('create-exam-type').value;

    // Validate
    if (!createdExam.name.trim()) {
        alert('Please enter an exam name.');
        return;
    }

    if (createdExam.questions.length === 0) {
        alert('Please add at least one question.');
        return;
    }

    // Validate questions
    for (let i = 0; i < createdExam.questions.length; i++) {
        const question = createdExam.questions[i];
        if (!question.text.trim()) {
            alert(`Please enter text for question ${i + 1}.`);
            return;
        }
        // Allow short-answer questions without options
        const hasAnyOption = Array.isArray(question.options) && question.options.some(option => (option || '').trim() !== '');
        if (!hasAnyOption) {
            // normalize to empty array for short-answer
            question.options = [];
        }
    }

    // Create new exam object
    const newExam = {
        id: 'EXAM' + Date.now(),
        name: createdExam.name,
        teacherId: getUserData().id,
        date: new Date().toISOString().split('T')[0],
        duration: createdExam.duration,
        description: createdExam.description,
        difficulty: createdExam.difficulty,
        status: 'available',
        questions: createdExam.questions.map((q, idx) => ({
            id: idx + 1,
            text: q.text,
            options: q.options,
            correct: q.correct,
            marks: 2
        })),
        createdAt: new Date(),
        scheduledStart: null,
        scheduledEnd: null
    };

    // Save to storage using exam-connector
    if (saveExamToStorage(newExam)) {
        alert('Exam created and saved successfully! It will now appear in the student panel.');

        // Add to local exams array
        exams.push(newExam);

        // Update exam select dropdowns
        updateExamSelects();

        // Clear the form
        clearExam();

        // Switch to dashboard to see the new exam
        showSection('dashboard');
        loadDashboardData();
    } else {
        alert('Error saving exam. Please try again.');
    }
}

function previewCreatedExam() {
    // Get exam information
    createdExam.name = document.getElementById('create-exam-name').value;
    createdExam.duration = parseInt(document.getElementById('create-exam-duration').value);
    createdExam.description = document.getElementById('create-exam-description').value;
    createdExam.difficulty = document.getElementById('create-exam-difficulty').value;
    createdExam.type = document.getElementById('create-exam-type').value;

    if (!createdExam.name.trim()) {
        alert('Please enter an exam name to preview.');
        return;
    }

    // Create preview content
    let previewContent = `
        <h2>${createdExam.name}</h2>
        <p><strong>Duration:</strong> ${createdExam.duration} minutes</p>
        <p><strong>Difficulty:</strong> ${createdExam.difficulty}</p>
        <p><strong>Type:</strong> ${createdExam.type}</p>
        <p><strong>Description:</strong> ${createdExam.description}</p>
        <hr>
        <h3>Questions (${createdExam.questions.length})</h3>
    `;

    createdExam.questions.forEach((question, index) => {
        previewContent += `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <h4>Question ${index + 1}</h4>
                <p>${question.text || '[No question text]'}</p>
                <ul>
                    ${question.options.map((option, optIndex) => `
                        <li style="color: ${optIndex === question.correct ? 'green' : 'black'}; font-weight: ${optIndex === question.correct ? 'bold' : 'normal'}">
                            ${String.fromCharCode(65 + optIndex)}. ${option || '[No option text]'}
                            ${optIndex === question.correct ? ' ✓' : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    });

    // Show preview in a modal or new window
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    previewWindow.document.write(`
        <html>
            <head>
                <title>Exam Preview - ${createdExam.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h2 { color: #333; }
                    h3 { color: #666; }
                    h4 { color: #888; }
                </style>
            </head>
            <body>
                ${previewContent}
            </body>
        </html>
    `);
    previewWindow.document.close();
}

function clearExam() {
    // Reset form
    document.getElementById('create-exam-name').value = '';
    document.getElementById('create-exam-duration').value = '60';
    document.getElementById('create-exam-description').value = '';
    document.getElementById('create-exam-difficulty').value = 'Medium';
    document.getElementById('create-exam-type').value = 'Multiple Choice';

    // Clear questions
    document.getElementById('questions-list').innerHTML = '';
    createdExam.questions = [];
    questionCounter = 0;

    // Reset created exam object
    createdExam = {
        name: '',
        duration: 60,
        description: '',
        difficulty: 'Medium',
        type: 'Multiple Choice',
        questions: []
    };
}

// Load dashboard data
function loadDashboardData() {
    const allExams = getAllExamsFromStorage();
    const currentUser = getUserData();

    // Filter exams by current teacher if logged in
    const teacherExams = currentUser ? allExams.filter(e => e.teacherId === currentUser.id) : allExams;

    // Update stats
    document.getElementById('total-exams').textContent = teacherExams.length;
    document.getElementById('active-exams').textContent = teacherExams.filter(e => e.status === 'available').length;
    document.getElementById('total-students').textContent = '150'; // Mock data
    document.getElementById('completion-rate').textContent = '85%'; // Mock data

    loadRecentExams();
    loadUpcomingExams();
}

// Load recent exams
function loadRecentExams() {
    const allExams = getAllExamsFromStorage();
    const recentExams = allExams.slice(-5).reverse();

    const container = document.getElementById('recent-exams-list');
    if (!container) return;

    if (recentExams.length === 0) {
        container.innerHTML = '<p>No exams created yet.</p>';
        return;
    }

    container.innerHTML = recentExams.map(exam => `
        <div class="exam-item">
            <h4>${exam.name}</h4>
            <p><i class="fas fa-calendar"></i> ${exam.date}</p>
            <p><i class="fas fa-clock"></i> ${exam.duration} minutes</p>
            <span class="status ${exam.status}">${exam.status}</span>
        </div>
    `).join('');
}

// Load upcoming exams
function loadUpcomingExams() {
    const allExams = getAllExamsFromStorage();
    const upcomingExams = allExams.filter(e => e.status === 'scheduled' || e.status === 'available');

    const container = document.getElementById('upcoming-exams-list');
    if (!container) return;

    if (upcomingExams.length === 0) {
        container.innerHTML = '<p>No upcoming exams.</p>';
        return;
    }

    container.innerHTML = upcomingExams.map(exam => `
        <div class="exam-item">
            <h4>${exam.name}</h4>
            <p><i class="fas fa-calendar"></i> ${exam.date}</p>
            <p><i class="fas fa-clock"></i> ${exam.duration} minutes</p>
            <span class="status ${exam.status}">${exam.status}</span>
        </div>
    `).join('');
}

// Load exams
function loadExams() {
    const allExams = getAllExamsFromStorage();
    exams = allExams;

    const container = document.getElementById('uploads-list');
    if (!container) return;

    if (exams.length === 0) {
        container.innerHTML = '<p>No exams uploaded yet.</p>';
        return;
    }

    container.innerHTML = exams.map(exam => `
        <div class="upload-item">
            <div class="upload-info">
                <h4>${exam.name}</h4>
                <p><i class="fas fa-calendar"></i> ${exam.date}</p>
                <p><i class="fas fa-question-circle"></i> ${exam.questions ? exam.questions.length : 0} questions</p>
            </div>
            <div class="upload-actions">
                <button onclick="editExam('${exam.id}')" class="btn-edit">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deleteExam('${exam.id}')" class="btn-delete">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Update exam select dropdowns
function updateExamSelects() {
    const allExams = getAllExamsFromStorage();

    // Update schedule exam select
    const scheduleSelect = document.getElementById('schedule-exam-select');
    if (scheduleSelect) {
        scheduleSelect.innerHTML = '<option value="">Choose an exam to schedule</option>' +
            allExams.map(exam => `<option value="${exam.id}">${exam.name}</option>`).join('');
    }

    // Update attendance exam select
    const attendanceSelect = document.getElementById('attendance-exam-select');
    if (attendanceSelect) {
        attendanceSelect.innerHTML = '<option value="">Choose an exam</option>' +
            allExams.map(exam => `<option value="${exam.id}">${exam.name}</option>`).join('');
    }
}

// Populate schedule exam select
function populateScheduleExamSelect() {
    updateExamSelects();
}

// Get user data
function getUserData() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        return JSON.parse(userData);
    }
    // Return default teacher for demo
    return {
        id: 'T001',
        name: 'Dr. Sarah Johnson',
        email: 'teacher1@autoscribe.edu',
        role: 'teacher'
    };
}

// Setup file upload
function setupFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('exam-pdf');

    if (uploadArea && fileInput) {
        // Drag and drop handlers
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#4F46E5';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#D1D5DB';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#D1D5DB';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                updateFileName(fileInput);
            }
        });
    }
}

// Update file name display
function updateFileName(input) {
    const fileName = input.files[0]?.name;
    const fileNameDisplay = document.getElementById('file-name');
    if (fileNameDisplay && fileName) {
        fileNameDisplay.textContent = fileName;
    }
}

// Upload exam
function uploadExam() {
    const name = document.getElementById('exam-name').value;
    const date = document.getElementById('exam-date').value;
    const duration = document.getElementById('exam-duration').value;
    const subject = document.getElementById('exam-subject').value;
    const description = document.getElementById('exam-description').value;
    const difficulty = document.getElementById('exam-difficulty').value;
    const fileInput = document.getElementById('exam-pdf');

    if (!name || !date || !duration || !subject) {
        alert('Please fill in all required fields.');
        return;
    }

    if (!fileInput.files[0]) {
        alert('Please select a PDF file.');
        return;
    }

    // Parse PDF to questions then show preview before save
    const pdfFile = fileInput.files[0];
    parsePdfToQuestions(pdfFile).then((questions) => {
        if (!questions || questions.length === 0) {
            alert('Could not detect questions in the PDF. Please ensure they are numbered like 1), 2., 3 -');
            return;
        }
        try {
            if (typeof window.showParsedPreview === 'function') {
                window.showParsedPreview({ name, date, duration, subject, description, difficulty }, questions);
            } else if (typeof showParsedPreview === 'function') {
                showParsedPreview({ name, date, duration, subject, description, difficulty }, questions);
            } else {
                // Fallback: direct save
                const exam = {
                    id: 'EXAM' + Date.now(),
                    name,
                    teacherId: getUserData().id,
                    date,
                    duration: parseInt(duration),
                    subject,
                    description,
                    difficulty,
                    status: 'available',
                    questions: questions.map((q, idx) => ({
                        id: idx + 1,
                        text: q.text,
                        options: q.options && q.options.length ? q.options : undefined,
                        correct: (typeof q.correct === 'number' ? q.correct : undefined),
                        marks: q.marks || 2
                    })),
                    createdAt: new Date(),
                    scheduledStart: null,
                    scheduledEnd: null
                };
                if (saveExamToStorage(exam)) {
                    alert('Exam parsed and saved successfully!');
                    resetUploadForm();
                    loadExams();
                    updateExamSelects();
                } else {
                    alert('Error saving exam. Please try again.');
                }
            }
        } catch (err) {
            console.error('Error during preview/save:', err);
            alert('Failed to open preview. Please try again.');
        }
    }).catch((err) => {
        console.error('PDF parse error:', err);
        alert('Failed to read the PDF. Please try a different file.');
    });
}

// Ensure preview helpers exist in global scope
if (typeof window.showParsedPreview !== 'function' && typeof showParsedPreview === 'function') {
    window.showParsedPreview = showParsedPreview;
}
if (typeof window.loadParsedIntoBuilder !== 'function' && typeof loadParsedIntoBuilder === 'function') {
    window.loadParsedIntoBuilder = loadParsedIntoBuilder;
}
if (typeof window.escapeHtml !== 'function' && typeof escapeHtml === 'function') {
    window.escapeHtml = escapeHtml;
}

// Helpers: parse PDF to text and extract questions
async function parsePdfToQuestions(file) {
    if (!window['pdfjsLib']) {
        throw new Error('PDF.js not available');
    }
    try {
        const text = await extractTextFromPDF(file);
        if (!text || text.replace(/\s+/g, '').length < 20) {
            throw new Error('No selectable text found. This PDF may be scanned (image-based).');
        }
        return parseQuestionsFromText(text);
    } catch (e) {
        // Re-throw with clearer context
        if (e && /Password|encrypted/i.test(String(e.message))) {
            throw new Error('This PDF is password-protected. Please provide an unprotected PDF.');
        }
        // OCR fallback if available
        if (window.Tesseract) {
            console.warn('Falling back to OCR via Tesseract.js');
            const ocrText = await ocrExtractTextFromPDF(file);
            if (ocrText && ocrText.replace(/\s+/g, '').length >= 20) {
                return parseQuestionsFromText(ocrText);
            }
        }
        throw e;
    }
}

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, disableRange: true }).promise;
    let fullText = '';
    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent({ normalizeWhitespace: true });
        const strings = content.items.map(i => i.str);
        fullText += '\n' + strings.join(' ');
    }
    return fullText;
}

function parseQuestionsFromText(text) {
    const cleaned = text
        .replace(/\r/g, '')
        .replace(/\t/g, ' ')
        .replace(/\u00a0/g, ' ')
        .replace(/\s{2,}/g, ' ');

    const twoMarkHeaderRegex = /\b(\d+)\s*mark\b/i;
    const anchors = [...cleaned.matchAll(/(?:^|\s)(\d{1,3})\s*[\)\.\-]\s+/g)];
    const questionsList = [];

    if (anchors.length === 0) {
        return questionsList; // nothing detected
    }

    for (let i = 0; i < anchors.length; i++) {
        const startIdx = anchors[i].index + anchors[i][0].match(/\s*$/).index; // after leading spaces
        const endIdx = (i < anchors.length - 1) ? anchors[i + 1].index : cleaned.length;
        let chunk = cleaned.slice(startIdx, endIdx).trim();
        if (!chunk) continue;

        // Strip trailing answer fragments within chunk
        chunk = chunk.replace(/\b(?:answer|ans|correct)\s*[:\-]?\s*([A-Da-d]|[1-4])[^]*$/i, '').trim();

        // Determine marks based on nearest preceding header
        const headerWindowStart = Math.max(0, startIdx - 200);
        const headerWindow = cleaned.slice(headerWindowStart, startIdx);
        let inferredMarks = 0;
        const hdrMatch = headerWindow.match(twoMarkHeaderRegex);
        if (hdrMatch) {
            inferredMarks = parseInt(hdrMatch[1], 10);
        }

        // Extract options (A/a..D/d) inline
        let options = [];
        let questionText = chunk;
        const firstOpt = chunk.match(/[A-Da-d]\s*[\)\.-]\s+/);
        if (firstOpt && typeof firstOpt.index === 'number') {
            questionText = chunk.slice(0, firstOpt.index).trim();
            const optSegment = chunk.slice(firstOpt.index).trim();
            const optionRegex = /(?:^|\s)([A-Da-d])\s*[\)\.-]\s+(.+?)(?=(?:\s[A-Da-d]\s*[\)\.-]\s+)|$)/g;
            let m;
            while ((m = optionRegex.exec(optSegment)) !== null) {
                const textPart = (m[2] || '').trim();
                if (textPart) options.push(textPart);
            }
        }

        // Detect inline correct key earlier, but after option extraction also try again
        let correctIndex;
        const ansMatch = chunk.match(/\b(?:answer|ans|correct)\s*[:\-]?\s*([A-Da-d]|[1-4])\b/i);
        if (ansMatch) {
            const token = ansMatch[1].toUpperCase();
            if (/[A-D]/.test(token)) correctIndex = token.charCodeAt(0) - 65;
            if (/[1-4]/.test(token)) correctIndex = parseInt(token, 10) - 1;
        }

        if (questionText) {
            const isMcq = options.length >= 2;
            let marks = isMcq ? 1 : 2;
            if (inferredMarks > 0) marks = inferredMarks;
            const q = { text: questionText, marks };
            if (isMcq) q.options = options;
            if (typeof correctIndex === 'number') q.correct = correctIndex;
            questionsList.push(q);
        }
    }

    return questionsList;
}

// Reset upload form
function resetUploadForm() {
    document.getElementById('exam-upload-form').reset();
    const fileNameDisplay = document.getElementById('file-name');
    if (fileNameDisplay) {
        fileNameDisplay.textContent = 'Drop PDF files here or click to browse';
    }
}

// Edit exam
function editExam(examId) {
    alert('Edit functionality coming soon!');
}

// Delete exam
function deleteExam(examId) {
    if (confirm('Are you sure you want to delete this exam?')) {
        const allExams = getAllExamsFromStorage();
        const updatedExams = allExams.filter(e => e.id !== examId);
        localStorage.setItem('autoscribe_exams', JSON.stringify(updatedExams));
        loadExams();
        loadDashboardData();
        alert('Exam deleted successfully!');
    }
}
