require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autoscribe', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Running in offline mode (static files only)');
});

// Models
const User = require('./models/User');
const Exam = require('./models/Exam');
const ScheduledExam = require('./models/ScheduledExam');

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, role, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            email,
            password: hashedPassword,
            role,
            name
        });
        
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        
        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Exam Routes
app.post('/api/exams', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { name, description, duration, difficulty, type } = req.body;
        const exam = new Exam({
            name,
            description,
            duration,
            difficulty,
            type,
            teacher: req.user.id,
            fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
            questions: JSON.parse(req.body.questions || '[]')
        });
        
        await exam.save();
        res.status(201).json(exam);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/exams', authenticateToken, async (req, res) => {
    try {
        const exams = await Exam.find({
            $or: [
                { teacher: req.user.id },
                { status: 'published' }
            ]
        });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Scheduled Exams
app.post('/api/scheduled-exams', authenticateToken, async (req, res) => {
    try {
        const { examId, startTime, endTime, allowedStudents } = req.body;
        const scheduledExam = new ScheduledExam({
            exam: examId,
            teacher: req.user.id,
            startTime,
            endTime,
            allowedStudents,
            status: 'scheduled'
        });
        
        await scheduledExam.save();
        res.status(201).json(scheduledExam);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
