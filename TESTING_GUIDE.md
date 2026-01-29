# Autoscribe Testing Guide

## 🧪 Complete Testing Instructions

### Prerequisites
- Modern web browser (Chrome, Edge, Firefox recommended)
- Microphone access for voice commands
- Run on localhost or HTTPS (required for Web Speech API)

---

## Test 1: Teacher Panel - All Tabs

### 1.1 Dashboard Tab
1. Open `teacher-dashboard.html` in browser
2. **Verify:**
   - ✅ Dashboard shows statistics (Total Exams, Active Exams, etc.)
   - ✅ Recent exams list appears
   - ✅ Upcoming exams list appears
   - ✅ All navigation buttons are visible

### 1.2 Upload Papers Tab
1. Click "Upload Papers" tab
2. **Test file upload:**
   - Click upload area or drag a PDF file
   - Fill in exam details:
     - Name: "Test Upload Exam"
     - Date: Select any future date
     - Duration: 60 minutes
     - Subject: "Mathematics"
     - Description: "Test exam upload"
     - Difficulty: Medium
   - Click "Upload & Create Exam"
3. **Verify:**
   - ✅ Success message appears
   - ✅ Exam appears in "Recent Uploads" section
   - ✅ Form resets after upload

### 1.3 Create Exam Tab ⭐ (Main Feature)
1. Click "Create Exam" tab
2. **Fill exam information:**
   - Exam Name: "My First Created Exam"
   - Duration: 30 minutes
   - Description: "This is a test exam"
   - Difficulty: Medium
   - Type: Multiple Choice

3. **Add Question 1:**
   - Click "Add Question" button
   - Question text: "What is 2 + 2?"
   - Option A: "3"
   - Option B: "4"
   - Option C: "5"
   - Option D: "6"
   - Correct Answer: B

4. **Add Question 2:**
   - Click "Add Question" again
   - Question text: "What is the capital of France?"
   - Option A: "London"
   - Option B: "Berlin"
   - Option C: "Paris"
   - Option D: "Madrid"
   - Correct Answer: C

5. **Add Question 3:**
   - Click "Add Question" again
   - Question text: "Who wrote Romeo and Juliet?"
   - Option A: "Charles Dickens"
   - Option B: "William Shakespeare"
   - Option C: "Jane Austen"
   - Option D: "Mark Twain"
   - Correct Answer: B

6. **Preview Exam:**
   - Click "Preview Exam" button
   - **Verify:** New window opens showing all questions with correct answers highlighted

7. **Save Exam:**
   - Click "Save Exam" button
   - **Verify:**
     - ✅ Success message: "Exam created and saved successfully! It will now appear in the student panel."
     - ✅ Redirected to Dashboard
     - ✅ New exam appears in Recent Exams

### 1.4 Schedule Exams Tab
1. Click "Schedule Exams" tab
2. **Schedule an exam:**
   - Select exam: Choose "My First Created Exam"
   - Start Time: Select current date/time + 5 minutes
   - End Time: Select current date/time + 35 minutes
   - Check "Auto-activate exam at scheduled time"
   - Click "Schedule Exam"
3. **Verify:**
   - ✅ Success message appears
   - ✅ Exam appears in "Scheduled Exams" list
   - ✅ Status shows "scheduled"

### 1.5 Attendance Tab
1. Click "Attendance" tab
2. **Load attendance:**
   - Select an exam from dropdown
   - Click "Load Attendance"
3. **Verify:**
   - ✅ Attendance summary shows (Total Attendees, Attendance Rate)
   - ✅ Student list appears with Present/Absent status

---

## Test 2: Student Panel - Exam Reflection

### 2.1 Check Exam Appears
1. Open `student-dashboard.html` in browser
2. **Verify:**
   - ✅ "My First Created Exam" appears in "Current Exams" section
   - ✅ Exam details show (duration, difficulty, description)
   - ✅ "Start Exam" button is visible

### 2.2 Start Regular Exam
1. Click "Start Exam" on "My First Created Exam"
2. **Verify:**
   - ✅ Exam section loads
   - ✅ First question appears: "What is 2 + 2?"
   - ✅ Four options (A, B, C, D) are visible
   - ✅ Timer starts counting down
   - ✅ Question counter shows "1 of 3"
   - ✅ Voice announcement: "Starting exam..." (if voice enabled)

### 2.3 Navigate Through Exam
1. **Select Option B (4)**
   - Click on option B
   - **Verify:** Option B is highlighted
   
2. **Click "Next" button**
   - **Verify:** Question 2 appears: "What is the capital of France?"
   
3. **Select Option C (Paris)**
   - Click on option C
   
4. **Click "Next" button**
   - **Verify:** Question 3 appears: "Who wrote Romeo and Juliet?"
   
5. **Click "Previous" button**
   - **Verify:** Returns to Question 2
   
6. **Click "Next" twice to reach Question 3**
   
7. **Select Option B (William Shakespeare)**

8. **Click "Next" or "Submit"**
   - Confirm submission
   - **Verify:**
     - ✅ Score displayed: "3/6 marks (100%)"
     - ✅ Returned to dashboard
     - ✅ Exam moves to "Completed Exams" section

---

## Test 3: Multilingual Voice Commands

### 3.1 Change Language
1. In student dashboard, click "Change Language" button
2. **Test each language:**

#### English Test:
1. Select English 🇺🇸
2. **Verify:** "Language changed to English" message
3. Enable voice mode (click microphone icon)
4. **Verify:** "Voice mode enabled" announcement

#### Spanish Test:
1. Select Español 🇪🇸
2. **Verify:** "Language changed to Español" message
3. Enable voice mode
4. **Verify:** Voice status shows "On"

#### French Test:
1. Select Français 🇫🇷
2. **Verify:** Language confirmation in French

#### German Test:
1. Select Deutsch 🇩🇪
2. **Verify:** Language confirmation in German

#### Hindi Test:
1. Select हिन्दी 🇮🇳
2. **Verify:** Language confirmation in Hindi

### 3.2 Test Voice Commands in English
1. Select English language
2. Start Mock Exam
3. Enable voice mode
4. **Say these commands and verify:**

| Command | Expected Result |
|---------|----------------|
| "Next" | Moves to next question |
| "Previous" | Goes back to previous question |
| "Read question" | Question is read aloud |
| "Read options" | All options are read aloud |
| "Answer A" | Option A is selected |
| "Answer B" | Option B is selected |
| "Help" | Available commands are announced |

### 3.3 Test Voice Commands in Spanish
1. Select Spanish language
2. Start Mock Exam
3. Enable voice mode
4. **Say these commands:**

| Comando | Resultado Esperado |
|---------|-------------------|
| "Siguiente" | Moves to next question |
| "Anterior" | Goes back |
| "Leer pregunta" | Question is read |
| "Respuesta A" | Option A selected |
| "Ayuda" | Commands announced in Spanish |

### 3.4 Test Voice Commands in Other Languages
Repeat similar tests for French, German, and Hindi using their respective commands from the implementation guide.

---

## Test 4: Mock Exam with Voice

### 4.1 Start Mock Exam
1. In student dashboard, click "Start Mock Exam"
2. **Verify:**
   - ✅ Mock exam interface appears
   - ✅ Timer shows 10:00
   - ✅ Question 1 of 5 appears
   - ✅ Voice announcement: "Mock exam started..."

### 4.2 Test Voice Navigation
1. Enable voice mode (click microphone button)
2. **Test commands:**
   - Say "Next" → Question 2 appears
   - Say "Previous" → Question 1 appears
   - Say "Read question" → Question is read aloud
   - Say "Answer C" → Option C is selected
   - Say "Next" → Question 2 appears

### 4.3 Complete Mock Exam
1. Answer all 5 questions using voice or clicks
2. Say "Submit" or click Submit button
3. **Verify:**
   - ✅ Score is calculated and displayed
   - ✅ Score announcement in selected language
   - ✅ Returned to dashboard

---

## Test 5: Text-to-Speech (TTS) in Multiple Languages

### 5.1 English TTS
1. Select English language
2. Start any exam
3. **Verify TTS speaks:**
   - ✅ Welcome message in English
   - ✅ Questions in English
   - ✅ Options with "Option A, [text]" format
   - ✅ Confirmation messages in English

### 5.2 Spanish TTS
1. Select Spanish language
2. Start exam
3. **Verify TTS speaks:**
   - ✅ Welcome message in Spanish
   - ✅ "Pregunta 1 de 5" format
   - ✅ "Opción A, [texto]" format

### 5.3 Other Languages
Test TTS for French, German, and Hindi similarly.

---

## Test 6: Integration Test (Full Workflow)

### Complete Teacher-to-Student Flow:
1. **Teacher creates exam:**
   - Open teacher-dashboard.html
   - Create exam with 5 questions
   - Save exam
   - Note exam name

2. **Student sees exam:**
   - Open student-dashboard.html
   - Verify exam appears in Current Exams
   - Click "Start Exam"

3. **Student takes exam with voice:**
   - Select Spanish language
   - Enable voice mode
   - Use Spanish voice commands to navigate
   - Complete exam
   - Submit

4. **Verify results:**
   - Score is displayed
   - Exam moves to Completed section
   - Can view score

---

## Test 7: Accessibility Features

### 7.1 Voice Mode Toggle
1. Click microphone icon
2. **Verify:**
   - ✅ Status changes to "Voice Mode: On"
   - ✅ Continuous listening active
   - ✅ Commands are recognized

### 7.2 Font Size Adjustment
1. Click + button (increase font)
2. **Verify:** Text size increases
3. Click - button (decrease font)
4. **Verify:** Text size decreases

### 7.3 High Contrast Mode
1. Click contrast button
2. **Verify:** Colors change to high contrast

---

## Test 8: Edge Cases

### 8.1 Empty Exam Creation
1. Try to save exam without questions
2. **Verify:** Error message: "Please add at least one question"

### 8.2 Incomplete Question
1. Add question without options
2. Try to save
3. **Verify:** Error message about missing options

### 8.3 Timer Expiry
1. Start exam
2. Wait for timer to reach 0
3. **Verify:** Exam auto-submits

### 8.4 Voice Recognition Error
1. Enable voice mode
2. Say gibberish
3. **Verify:** "Sorry, I did not understand" message

---

## Test 9: Data Persistence

### 9.1 Exam Storage
1. Create exam in teacher panel
2. Close browser
3. Reopen teacher-dashboard.html
4. **Verify:** Exam still appears in dashboard

### 9.2 Language Preference
1. Select Spanish language
2. Close browser
3. Reopen student-dashboard.html
4. **Verify:** Spanish is still selected

### 9.3 Completed Exams
1. Complete an exam
2. Close browser
3. Reopen student-dashboard.html
4. **Verify:** Exam appears in Completed section with score

---

## ✅ Success Criteria Checklist

- [ ] All 5 teacher tabs work correctly
- [ ] Exam creation saves to storage
- [ ] Created exams appear in student panel
- [ ] Voice commands work in English
- [ ] Voice commands work in Spanish
- [ ] Voice commands work in French
- [ ] Voice commands work in German
- [ ] Voice commands work in Hindi
- [ ] TTS speaks in all 5 languages
- [ ] Mock exam has voice support
- [ ] Regular exams have voice support
- [ ] Language selection persists
- [ ] Exams can be completed and scored
- [ ] Navigation (next/previous) works
- [ ] Timer functions correctly
- [ ] Data persists across sessions

---

## 🐛 Known Issues / Limitations

1. **Browser Compatibility:** Web Speech API works best in Chrome/Edge
2. **HTTPS Required:** Voice recognition requires HTTPS or localhost
3. **Microphone Permission:** User must grant microphone access
4. **Language Accuracy:** Voice recognition accuracy varies by language
5. **PDF Parsing:** Upload tab doesn't actually parse PDF (demo only)

---

## 📊 Expected Results Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Teacher Dashboard | ✅ Working | All tabs functional |
| Exam Creation | ✅ Working | Saves to localStorage |
| Student Reflection | ✅ Working | Shows teacher exams |
| English Voice | ✅ Working | Full command support |
| Spanish Voice | ✅ Working | Full command support |
| French Voice | ✅ Working | Full command support |
| German Voice | ✅ Working | Full command support |
| Hindi Voice | ✅ Working | Full command support |
| Mock Exam Voice | ✅ Working | Multilingual support |
| Regular Exam Voice | ✅ Working | Multilingual support |
| TTS Multilingual | ✅ Working | 5 languages supported |

---

## 🎯 Quick Test (5 Minutes)

If you have limited time, test these critical features:

1. **Create exam in teacher panel** (2 min)
   - Go to Create Exam tab
   - Add 2 questions
   - Save exam

2. **Verify in student panel** (1 min)
   - Open student dashboard
   - Check exam appears
   - Start exam

3. **Test voice commands** (2 min)
   - Enable voice mode
   - Say "Next", "Answer A", "Submit"
   - Verify commands work

---

**Testing Complete!** 🎉

If all tests pass, the implementation is successful and ready for use!
