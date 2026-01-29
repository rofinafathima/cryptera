import { authAPI, authHelper } from './api.js';

// DOM Elements
const teacherForm = document.getElementById('teacher-form');
const studentForm = document.getElementById('student-form');
const teacherLoginBtn = document.querySelector('.teacher-card .login-btn');
const studentLoginBtn = document.querySelector('.student-card .login-btn');

// Event Listeners
if (teacherForm) {
    teacherForm.addEventListener('submit', handleTeacherLogin);
}

if (studentForm) {
    studentForm.addEventListener('submit', handleStudentLogin);
}

if (teacherLoginBtn) {
    teacherLoginBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showLogin('teacher');
    });
}

if (studentLoginBtn) {
    studentLoginBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showLogin('student');
    });
}

// Show login form based on user type
function showLogin(userType) {
    // Hide all login forms first
    document.querySelectorAll('.login-form').forEach(form => {
        form.classList.add('hidden');
    });
    
    // Hide login options
    document.querySelector('.login-options').classList.add('hidden');
    
    // Show the selected login form
    document.getElementById(`${userType}-login`).classList.remove('hidden');
}

// Hide login form and show login options
function hideLogin() {
    // Hide all login forms
    document.querySelectorAll('.login-form').forEach(form => {
        form.classList.add('hidden');
    });
    
    // Show login options
    document.querySelector('.login-options').classList.remove('hidden');
}

// Handle teacher login
async function handleTeacherLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('teacher-email').value;
    const password = document.getElementById('teacher-password').value;
    
    try {
        const response = await authAPI.login({ email, password, role: 'teacher' });
        
        if (response.token) {
            // Save token to localStorage
            authHelper.setAuthToken(response.token);
            
            // Redirect to teacher dashboard
            window.location.href = 'teacher-dashboard.html';
        }
    } catch (error) {
        alert('Login failed. Please check your credentials.');
        console.error('Login error:', error);
    }
}

// Handle student login
async function handleStudentLogin(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('student-id').value;
    const password = document.getElementById('student-password').value;
    const language = document.getElementById('language-select').value;
    
    try {
        const response = await authAPI.login({ 
            email: studentId, 
            password,
            role: 'student',
            language
        });
        
        if (response.token) {
            // Save token and language preference to localStorage
            authHelper.setAuthToken(response.token);
            localStorage.setItem('userLanguage', language);
            
            // Redirect to student dashboard
            window.location.href = 'student-dashboard.html';
        }
    } catch (error) {
        alert('Login failed. Please check your credentials.');
        console.error('Login error:', error);
    }
}

// Check if user is already logged in
function checkAuth() {
    const token = authHelper.getAuthToken();
    if (token) {
        const role = authHelper.getUserRole();
        if (role === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        } else if (role === 'student') {
            window.location.href = 'student-dashboard.html';
        }
    }
}

// Initialize auth module
checkAuth();
