const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const usersFile = path.join(__dirname, '../data/users.json');

// Signup page route
router.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

// Login page route
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Signup POST route
router.post('/signup', (req, res) => {
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
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  fs.readFile(usersFile, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading user data');

    const users = JSON.parse(data);
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) return res.status(400).send('Invalid email or password!');

    res.redirect('/');
  });
});

module.exports = router;
