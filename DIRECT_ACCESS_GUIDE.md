# Direct Access to Student Dashboard

## What Was Changed

Added an auto-login script to student-dashboard.html that automatically creates a test student user, bypassing the login requirement.

## How to Use

Simply open student-dashboard.html in your browser - it will load automatically!

## The Auto-Login Script

The script creates a test student user in localStorage:
- ID: STU001
- Name: Test Student
- Role: student

## What You Can Do Now

1. Open student-dashboard.html directly
2. Dashboard loads automatically
3. Click "Start Mock Exam" to test
4. All features work normally

## To Clear Auto-Login

In browser console:
localStorage.removeItem('currentUser');
location.reload();

---

Status: WORKING - Dashboard now accessible directly!
