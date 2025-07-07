let questions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

const quizEl = document.getElementById('quiz');
const nextBtn = document.getElementById('next-btn');
const resultEl = document.getElementById('result');

// Carreguem el JSON de preguntes
fetch('questions.json')
    .then(res => res.json())
    .then(data => {
        questions = data;
        startQuiz();
    });

function startQuiz() {
    currentQuestions = shuffle([...questions]).slice(0, 10);
    currentIndex = 0;
    score = 0;
    showQuestion();
}

function showQuestion() {
    nextBtn.disabled = true;
    resultEl.classList.add('hidden');
    const q = currentQuestions[currentIndex];
    quizEl.innerHTML = `
    <div class="question">${q.question}</div>
    <ul class="options">
      ${['A', 'B', 'C', 'D'].map(letter =>
        `<li><button data-letter="${letter}">${letter}. ${q.options[letter]}</button></li>`
    ).join('')}
    </ul>
  `;
    document.querySelectorAll('.options button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.options button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            nextBtn.disabled = false;
        });
    });
}

nextBtn.addEventListener('click', () => {
    const selectedBtn = document.querySelector('.options button.selected');
    const answer = selectedBtn.getAttribute('data-letter');
    if (answer === currentQuestions[currentIndex].answer) score++;
    currentIndex++;
    if (currentIndex < currentQuestions.length) showQuestion();
    else showResult();
});

function showResult() {
    quizEl.innerHTML = '';
    nextBtn.classList.add('hidden');
    resultEl.textContent = `Has encertat ${score} de ${currentQuestions.length}`;
    resultEl.classList.remove('hidden');
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}