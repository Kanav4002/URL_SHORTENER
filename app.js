const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const session = require('express-session');

const app = express();
const PORT = 3000;

const usersFile = './data/users.json';
const urlsFile = './data/urls.json';

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Application-level middleware: Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Session middleware
app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: true,
}));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Importing routers
const authRoutes = require('./routes/auth');
const urlRoutes = require('./routes/url');

// Using router-level middleware
app.use('/', urlRoutes);
app.use('/', authRoutes);

// Router-level middleware: Protect home route
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// Home route
app.get('/', requireLogin, (req, res) => {
    fs.readFile(urlsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading URL data');

        const urls = JSON.parse(data);
        const recentUrls = urls.slice(-4); // 2x2 grid (last 4 links)

        res.render('index', { shortUrl: null, recentUrls, username: req.session.user });
    });
});

// Signup page route
app.get('/signup', (req, res) => {
    res.render('signup', { error: null });
});

// Login page route
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Signup POST route
app.post('/signup', (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).send('All fields are required!');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Invalid email format!');
    }

    if (password.length < 6) {
        return res.status(400).send('Password must be at least 6 characters long!');
    }

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match!');
    }

    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading user data');

        const users = JSON.parse(data);

        if (users.some(user => user.email === email)) {
            return res.status(400).send('Email already registered!');
        }

        const newUser = { name, email, password };
        users.push(newUser);

        fs.writeFile(usersFile, JSON.stringify(users, null, 2), (err) => {
            if (err) return res.status(500).send('Error saving user data');
            res.redirect('/login');
        });
    });
});

// Login POST route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading user data');

        const users = JSON.parse(data);
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) return res.status(400).send('Invalid email or password!');

        req.session.user = user.name; // Storing username in session
        res.redirect('/');
    });
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Shorten URL POST route
let recentUrls = [];

app.post('/shorten', (req, res) => {
    const { originalUrl } = req.body;

    if (!originalUrl) return res.status(400).send('URL is required!');

    const shortCode = crypto.randomBytes(4).toString('hex');
    const shortUrl = `http://localhost:3000/${shortCode}`;

    const newUrl = { shortCode, shortUrl };

    fs.readFile(urlsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading URL data');

        const urls = JSON.parse(data);
        urls.push(newUrl);

        fs.writeFile(urlsFile, JSON.stringify(urls, null, 2), (err) => {
            if (err) return res.status(500).send('Error saving URL data');

            // Add to recent URLs (only keep the last 4 for 2x2 grid)
            recentUrls.unshift(newUrl);
            if (recentUrls.length > 4) recentUrls.pop();

            res.render('index', { shortUrl, recentUrls, username: req.session.user });
        });
    });
});

// Redirect shortened URL route
app.get('/:shortCode', (req, res) => {
    const { shortCode } = req.params;

    fs.readFile(urlsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading URL data');

        const urls = JSON.parse(data);
        const foundUrl = urls.find(url => url.shortCode === shortCode);

        if (!foundUrl) return res.status(404).send('URL not found');

        res.redirect(foundUrl.originalUrl);
    });
});

// Error-handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong! Please try again later.');
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
