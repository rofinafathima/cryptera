// Authentication data for Autoscribe platform

// Teacher login credentials
const demoTeachers = [
    {
        id: 'T001',
        email: 'teacher1@autoscribe.edu',
        password: 'teacher123',
        name: 'Demo Teacher',
        department: 'Demo Department'
    }
];

// Student login credentials
const demoStudents = [
    {
        id: 'STU001',
        password: 'student123',
        name: 'Demo Student',
        email: 'student@autoscribe.edu',
        class: 'Demo Class'
    }
];

// Demo questions for Automated Flow
const automatedFlowExam = {
    id: 'AUTO-001',
    name: 'Computer Science - Automated Flow Demo',
    description: 'A voice-controlled exam demo including MCQ and Descriptive parts.',
    duration: 60,
    status: 'available',
    questions: [
        {
            id: 'q1',
            type: 'mcq',
            text: 'What is the full form of RAM?',
            options: ['Read Access Memory', 'Random Access Memory', 'Rapid Access Memory', 'Real Access Memory'],
            correctAnswer: 1,
            marks: 1
        },
        {
            id: 'q2',
            type: 'descriptive',
            text: 'Explain the importance of cybersecurity in modern digital banking.',
            marks: 5
        }
    ]
};

const demoExams = [automatedFlowExam];

// Automatically place in sessionStorage for the automated-flow script if not present
if (!sessionStorage.getItem('currentExam')) {
    sessionStorage.setItem('currentExam', JSON.stringify(automatedFlowExam));
}
const demoAttendance = {};
const demoResults = {};

// Utility functions for demo data
function getTeacherByEmail(email) {
    return demoTeachers.find(teacher => teacher.email === email);
}

function getStudentById(id) {
    return demoStudents.find(student => student.id === id);
}

function getExamsByTeacher(teacherId) {
    return [];
}

function getAvailableExams() {
    return [];
}

function getScheduledExams() {
    return [];
}

function getCompletedExams() {
    return [];
}

function getExamById(examId) {
    return null;
}

function getAttendanceByExam(examId) {
    return null;
}

function getStudentResults(studentId) {
    return {};
}

// Make functions globally available
window.getTeacherByEmail = getTeacherByEmail;
window.getStudentById = getStudentById;
window.getExamsByTeacher = getExamsByTeacher;
window.getAvailableExams = getAvailableExams;
window.getScheduledExams = getScheduledExams;
window.getCompletedExams = getCompletedExams;
window.getExamById = getExamById;
window.getAttendanceByExam = getAttendanceByExam;
window.getStudentResults = getStudentResults;
