fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@platform.com', password: 'admin123' })
}).then(res => res.text()).then(text => console.log('Response:', text)).catch(console.error);
