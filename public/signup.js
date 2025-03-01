document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');

  form.addEventListener('submit', (e) => {
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (!name || !email || !password || !confirmPassword) {
          alert('All fields are required!');
          e.preventDefault();
          return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
          alert('Please enter a valid email address!');
          e.preventDefault();
          return;
      }

      if (password.length < 6) {
          alert('Password must be at least 6 characters!');
          e.preventDefault();
          return;
      }

      if (password !== confirmPassword) {
          alert('Passwords do not match!');
          e.preventDefault();
      }
  });
});
