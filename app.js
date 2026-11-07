// Global Helper Logic
document.addEventListener('DOMContentLoaded', () => {
  // Update Live Date on Admin Pages
  const dateElement = document.getElementById('currentDate');
  if (dateElement) {
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
});

function checkAuth() {
  if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
  }
}

function logout() {
  sessionStorage.removeItem('isLoggedIn');
  window.location.href = 'login.html';
}
