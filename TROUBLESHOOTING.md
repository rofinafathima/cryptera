# Troubleshooting Guide

## Mock Exam Not Starting - FIXED ✅

### Problem
Clicking "Start Mock Exam" button didn't start the exam.

### Root Cause
Duplicate HTML element IDs between the regular exam section and mock exam interface were causing JavaScript conflicts.

### Solution Applied
1. **Renamed all mock exam element IDs** to be unique:
   - `question-text` → `mock-question-text`
   - `options-container` → `mock-options-container`
   - `voice-btn` → `mock-voice-btn`
   - `prev-btn` → `mock-prev-btn`
   - `next-btn` → `mock-next-btn`
   - And all other elements with `mock-` prefix

2. **Updated JavaScript** to use new IDs:
   - Modified `enhanced-mock-exam.js`
   - Updated all `getElementById()` calls
   - Fixed event listeners

3. **Added Debug Logging**:
   - Console logs to track execution
   - Helps identify any remaining issues

### How to Test
1. Open `student-dashboard.html` in browser
2. Open browser console (F12)
3. Click "Start Mock Exam" button
4. Check console for messages:
   ```
   Starting mock exam...
   Dashboard section: [object]
   Mock exam interface: [object]
   Dashboard hidden
   Mock exam interface shown
   Speech recognition initialized: true
   Timer started
   First question loaded
   ```

### If Still Not Working

#### Check 1: JavaScript Files Loaded
Open browser console and check for errors. Ensure all scripts are loaded:
```html
<script src="demo-data.js"></script>
<script src="exam-connector.js"></script>
<script src="script.js"></script>
<script src="student-script.js"></script>
<script src="mock-exam.js"></script>
<script src="enhanced-mock-exam.js"></script>
```

#### Check 2: Button Click Event
In console, type:
```javascript
window.startMockExam
```
Should show: `ƒ startMockExam() { ... }`

If undefined, the script isn't loaded properly.

#### Check 3: Element IDs
In console, type:
```javascript
document.getElementById('mock-exam-interface')
document.getElementById('dashboard-section')
```
Both should return HTML elements, not null.

#### Check 4: Browser Compatibility
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ⚠️ Safari: Limited voice recognition
- ❌ IE: Not supported

### Common Issues & Solutions

#### Issue: "startMockExam is not defined"
**Solution**: Check that `enhanced-mock-exam.js` is loaded after the HTML elements exist.

#### Issue: Dashboard doesn't hide
**Solution**: Check CSS for conflicting `!important` rules on display property.

#### Issue: Questions don't appear
**Solution**: Check console for errors in `loadMockQuestion()` function.

#### Issue: Voice input doesn't work
**Solution**: 
- Allow microphone permissions
- Use HTTPS (required for production)
- Check browser supports Web Speech API

#### Issue: Timer doesn't start
**Solution**: Check `mock-exam-timer` element exists in HTML.

### Quick Fix Commands

If exam is stuck, run in console:
```javascript
// Reset mock exam
endMockExam();

// Show dashboard
document.getElementById('dashboard-section').style.display = 'block';
document.getElementById('mock-exam-interface').style.display = 'none';

// Restart
startMockExam();
```

### Files Modified (for reference)
1. `student-dashboard.html` - Updated element IDs
2. `enhanced-mock-exam.js` - Updated JavaScript to match new IDs
3. `student-styles.css` - Mock exam styling (no changes needed)

### Testing Checklist
- [x] Fixed duplicate IDs
- [x] Updated JavaScript references
- [x] Added debug logging
- [x] Tested button click
- [x] Verified dashboard hides
- [x] Verified exam interface shows
- [x] Checked questions load
- [x] Verified timer works
- [x] Tested voice input
- [x] Tested navigation buttons

## Other Common Issues

### Teacher Exam Not Showing for Students
**Check**: Exam status must be "available" or "scheduled"
**Solution**: In teacher dashboard, ensure exam is saved with correct status.

### Voice Recognition Not Working
**Check**: Microphone permissions
**Solution**: Click allow when browser asks for microphone access.

### Text-to-Speech Not Working
**Check**: Browser audio settings
**Solution**: Ensure volume is up and speakers/headphones connected.

### Light Colors Too Bright
**Solution**: Use the high contrast toggle button in accessibility controls.

### Exam Timer Not Counting Down
**Check**: JavaScript errors in console
**Solution**: Refresh page and try again.

## Browser Console Commands

### Check if mock exam is loaded:
```javascript
console.log(typeof startMockExam);
// Should output: "function"
```

### Manually start mock exam:
```javascript
startMockExam();
```

### Check current exam state:
```javascript
console.log(currentMockExam);
```

### Force end exam:
```javascript
endMockExam();
```

### Check speech synthesis:
```javascript
window.speechSynthesis.speak(new SpeechSynthesisUtterance('Test'));
```

## Support

If issues persist:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try incognito/private mode
3. Try different browser
4. Check console for specific error messages
5. Verify all files are in correct location

---

**Status**: Mock Exam Issue RESOLVED ✅
**Date**: October 15, 2025
**Version**: 2.1
