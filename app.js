const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

const usersFile = './data/users.json';
const urlsFile = './data/urls.json';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    fs.readFile(urlsFile, 'utf8', (err, data) => {
            if (err) return res.status(500).send('Error reading URL data');

            const urls = JSON.parse(data);
            const recentUrls = urls.slice(-5);

            res.render('index', { shortUrl: null, recentUrls });
    });
});

app.get('/signup', (req, res) => {
        res.render('signup', { error: null });
});

app.get('/login', (req, res) => {
        res.render('login', { error: null });
});

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

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    fs.readFile(usersFile, 'utf8', (err, data) => {
            if (err) return res.status(500).send('Error reading user data');

            const users = JSON.parse(data);
            const user = users.find(u => u.email === email && u.password === password);

            if (!user) return res.status(400).send('Invalid email or password!');

            res.redirect('/');
    });
});

let recentUrls = [];

app.post('/shorten', (req, res) => {
        const { originalUrl } = req.body;

        const shortCode = crypto.randomBytes(4).toString('hex');
        const shortUrl = `http://localhost:3000/${shortCode}`;

        const newUrl = { shortCode, originalUrl, shortUrl };

        fs.readFile(urlsFile, 'utf8', (err, data) => {
                if (err) return res.status(500).send('Error reading URL data');

                const urls = JSON.parse(data);
                urls.push(newUrl);

                fs.writeFile(urlsFile, JSON.stringify(urls, null, 2), (err) => {
                        if (err) return res.status(500).send('Error saving URL data');
                        
                        recentUrls.unshift(newUrl);
                        if (recentUrls.length > 5) recentUrls.pop();

                        res.render('index', { shortUrl, recentUrls });
                });
        });
});

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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
