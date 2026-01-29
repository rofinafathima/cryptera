const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to handle API requests
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || 'Something went wrong');
        }

        return responseData;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API
export const authAPI = {
    register: (userData) => apiRequest('/register', 'POST', userData),
    login: (credentials) => apiRequest('/login', 'POST', credentials),
    getCurrentUser: (token) => apiRequest('/me', 'GET', null, token)
};

// Exams API
export const examsAPI = {
    getAllExams: (token) => apiRequest('/exams', 'GET', null, token),
    getExam: (examId, token) => apiRequest(`/exams/${examId}`, 'GET', null, token),
    createExam: (examData, token) => apiRequest('/exams', 'POST', examData, token),
    updateExam: (examId, examData, token) => apiRequest(`/exams/${examId}`, 'PUT', examData, token),
    deleteExam: (examId, token) => apiRequest(`/exams/${examId}`, 'DELETE', null, token)
};

// Scheduled Exams API
export const scheduledExamsAPI = {
    scheduleExam: (examData, token) => apiRequest('/scheduled-exams', 'POST', examData, token),
    getScheduledExams: (token) => apiRequest('/scheduled-exams', 'GET', null, token),
    getScheduledExam: (scheduledExamId, token) => 
        apiRequest(`/scheduled-exams/${scheduledExamId}`, 'GET', null, token),
    updateScheduledExam: (scheduledExamId, examData, token) => 
        apiRequest(`/scheduled-exams/${scheduledExamId}`, 'PUT', examData, token),
    deleteScheduledExam: (scheduledExamId, token) => 
        apiRequest(`/scheduled-exams/${scheduledExamId}`, 'DELETE', null, token)
};

// Auth helper functions
export const authHelper = {
    // Save token to localStorage
    setAuthToken: (token) => {
        localStorage.setItem('authToken', token);
    },
    
    // Get token from localStorage
    getAuthToken: () => {
        return localStorage.getItem('authToken');
    },
    
    // Remove token from localStorage
    removeAuthToken: () => {
        localStorage.removeItem('authToken');
    },
    
    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('authToken');
    },
    
    // Get user role from token
    getUserRole: () => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }
};
