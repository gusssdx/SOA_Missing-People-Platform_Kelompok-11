const form = document.getElementById('loginForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (res.ok) {
    // Simpan token dan nama ke localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('name', data.user.name);

    // Redirect ke halaman MissingPersons.html
    window.location.href = 'MissingPersons.html';
  } else {
    alert(data.error || 'Login gagal');
  }
});

document.getElementById("googleLogin").addEventListener("click", () => {
  window.location.href = "/auth/google";
});
