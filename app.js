// Mobile menu
const mobileMenuBtn = document.getElementById('mobileMenu');
const navLinks = document.getElementById('navLinks');
if(mobileMenuBtn){
  mobileMenuBtn.addEventListener('click', ()=> navLinks.classList.toggle('active'));
}

// Scroll to top
const scrollBtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', () => {
  if (window.scrollY > 200) scrollBtn.classList.add('visible');
  else scrollBtn.classList.remove('visible');
});
scrollBtn.addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}));

// Dark mode toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', ()=>{
  const root=document.documentElement;
  const isDark=root.getAttribute('data-theme')==='dark';
  root.setAttribute('data-theme', isDark?'':'dark');
});

// Quiz submit
function submitQuiz(){
  const ans=document.querySelector('input[name="q1"]:checked');
  const result=document.getElementById('quizResult');
  if(!ans){ result.textContent="Hãy chọn đáp án."; return; }
  if(ans.value==="B") result.textContent="✅ Chính xác! Đồ thị là Parabol.";
  else result.textContent="❌ Sai, đáp án đúng là Parabol.";
}

// Live LaTeX preview
const latexInput=document.getElementById('latexInput');
const latexPreview=document.getElementById('latexPreview');
latexInput.addEventListener('input', ()=>{
  latexPreview.textContent="$$"+latexInput.value+"$$";
  MathJax.typesetPromise([latexPreview]);
});
