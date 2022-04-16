// Set theme before render to avoid FOUC
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
  localStorage.theme = 'dark';
} else {
  document.documentElement.classList.remove('dark');
  localStorage.theme = 'light';
}
