// Diagnostic Script - Check Mock Exam Setup
// Add this to console or run as bookmarklet

console.log('=== MOCK EXAM DIAGNOSTIC ===\n');

// Check 1: Function exists
console.log('1. Checking if startMockExam exists...');
if (typeof startMockExam === 'function') {
    console.log('   ✅ startMockExam function EXISTS');
} else {
    console.log('   ❌ startMockExam function NOT FOUND');
    console.log('   Type:', typeof startMockExam);
}

// Check 2: Required HTML elements
console.log('\n2. Checking required HTML elements...');
const elements = {
    'dashboard-section': document.getElementById('dashboard-section'),
    'mock-exam-interface': document.getElementById('mock-exam-interface'),
    'mock-exam-timer': document.getElementById('mock-exam-timer'),
    'mock-question-text': document.getElementById('mock-question-text'),
    'mock-options-container': document.getElementById('mock-options-container'),
    'mock-voice-btn': document.getElementById('mock-voice-btn'),
    'mock-prev-btn': document.getElementById('mock-prev-btn'),
    'mock-next-btn': document.getElementById('mock-next-btn')
};

let allElementsFound = true;
for (const [id, element] of Object.entries(elements)) {
    if (element) {
        console.log(`   ✅ ${id} found`);
    } else {
        console.log(`   ❌ ${id} NOT FOUND`);
        allElementsFound = false;
    }
}

// Check 3: Other required functions
console.log('\n3. Checking other required functions...');
const functions = [
    'endMockExam',
    'previousQuestion',
    'nextQuestion',
    'submitMockExam'
];

functions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
        console.log(`   ✅ ${funcName} exists`);
    } else {
        console.log(`   ❌ ${funcName} NOT FOUND`);
    }
});

// Check 4: Speech APIs
console.log('\n4. Checking Speech APIs...');
if ('speechSynthesis' in window) {
    console.log('   ✅ Text-to-Speech (SpeechSynthesis) supported');
} else {
    console.log('   ❌ Text-to-Speech NOT supported');
}

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    console.log('   ✅ Voice Recognition supported');
} else {
    console.log('   ⚠️  Voice Recognition NOT supported (may need HTTPS)');
}

// Check 5: Mock exam questions
console.log('\n5. Checking mock exam data...');
if (typeof mockExamQuestions !== 'undefined') {
    console.log(`   ✅ Mock exam questions loaded (${mockExamQuestions.length} questions)`);
} else {
    console.log('   ❌ Mock exam questions NOT loaded');
}

// Summary
console.log('\n=== SUMMARY ===');
if (typeof startMockExam === 'function' && allElementsFound) {
    console.log('✅ ALL CHECKS PASSED - Mock exam should work!');
    console.log('\nTo start the exam, run: startMockExam()');
} else {
    console.log('❌ SOME CHECKS FAILED - See errors above');
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you\'re on student-dashboard.html');
    console.log('2. Check that all scripts are loaded (see Network tab)');
    console.log('3. Clear cache and refresh (Ctrl+Shift+R)');
    console.log('4. Check console for JavaScript errors');
}

console.log('\n=== END DIAGNOSTIC ===');
