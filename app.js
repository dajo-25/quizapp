const DATA_KEY = 'quiz_questions';
const RESULTS_KEY = 'quiz_results';
const TOTAL_QUESTIONS = 20;

let questions = [];
let selectedQs = [];
let currentIdx = 0;
let score = { correct: 0, incorrect: 0, blank: 0 };

const els = {
    quizScreen: document.getElementById('quiz-screen'),
    resultScreen: document.getElementById('result-screen'),
    question: document.getElementById('question'),
    options: document.getElementById('options'),
    nextBtn: document.getElementById('next-btn'),
    progress: {
        current: document.getElementById('current-num'),
        total: document.getElementById('total-num')
    },
    scoreboard: {
        correct: document.getElementById('score-correct'),
        incorrect: document.getElementById('score-incorrect'),
        blank: document.getElementById('score-blank')
    },
    result: {
        correct: document.getElementById('final-correct'),
        incorrect: document.getElementById('final-incorrect'),
        blank: document.getElementById('final-blank'),
        score: document.getElementById('final-score'),
        avg: document.getElementById('avg-score')
    },
    retryBtn: document.getElementById('retry-btn'),
};

els.progress.total.textContent = TOTAL_QUESTIONS;

document.addEventListener('DOMContentLoaded', async () => {
    questions = await loadQuestions();
    if (questions.length < TOTAL_QUESTIONS) {
        alert(`⚠️ Cal almenys ${TOTAL_QUESTIONS} preguntes; n'hi ha ${questions.length}.`);
        return;
    }
    startQuiz();
});

els.nextBtn.addEventListener('click', handleNext);
els.retryBtn.addEventListener('click', () => startQuiz());

async function loadQuestions() {
    const stored = localStorage.getItem(DATA_KEY);
    if (stored) {
        const all = JSON.parse(stored);
        return all.filter(q => Array.isArray(q.options) && q.options.length === 4);
    }
    const res = await fetch('questions.json');
    const data = await res.json();
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return data.filter(q => Array.isArray(q.options) && q.options.length === 4);
}

function saveQuestions(qs) {
    localStorage.setItem(DATA_KEY, JSON.stringify(qs));
}

function weightedSample(questions, n) {
    const maxAsked = Math.max(...questions.map(q => q.times_asked)) + 1;
    const weighted = questions.map(q => ({ q, weight: maxAsked - q.times_asked }));
    const selected = [];
    const available = [...weighted];

    while (selected.length < n && available.length) {
        const total = available.reduce((sum, el) => sum + el.weight, 0);
        let pick = Math.random() * total;
        for (let i = 0; i < available.length; i++) {
            pick -= available[i].weight;
            if (pick <= 0) {
                selected.push(available[i].q);
                available.splice(i, 1);
                break;
            }
        }
    }
    return selected;
}

function saveResult(encerts, errors, enBlank, nota) {
    const stored = localStorage.getItem(RESULTS_KEY);
    const results = stored ? JSON.parse(stored).filter(r => !r._nota_mitjana) : [];
    results.push({ encerts, errors, en_blanc: enBlank, nota: Math.round(nota * 100) / 100 });
    const sum = results.reduce((s, r) => s + r.nota, 0);
    const mitjana = Math.round((sum / results.length) * 100) / 100;
    results.push({ _nota_mitjana: mitjana });
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    return mitjana;
}

function startQuiz() {
    selectedQs = weightedSample(questions, TOTAL_QUESTIONS);
    currentIdx = 0;
    score = { correct: 0, incorrect: 0, blank: 0 };
    els.quizScreen.classList.remove('hidden');
    els.resultScreen.classList.add('hidden');
    updateScoreboard();
    showQuestion();
}

function showQuestion() {
    els.nextBtn.disabled = true;
    const q = selectedQs[currentIdx];
    els.progress.current.textContent = currentIdx + 1;
    els.question.textContent = q.question;
    const opts = shuffle([...q.options]);
    els.options.innerHTML = '';

    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.dataset.option = opt.trim();  // assegurem correspondència neta
        btn.addEventListener('click', () => selectOption(btn, q));
        const li = document.createElement('li');
        li.appendChild(btn);
        els.options.appendChild(li);
    });
}

function selectOption(btn, q) {
    const allButtons = Array.from(els.options.querySelectorAll('button'));
    allButtons.forEach(b => b.disabled = true);

    const selected = btn.dataset.option;
    const correctAnswer = q.answer.trim();

    if (selected === correctAnswer) {
        btn.classList.add('correct');
        score.correct++;
    } else {
        btn.classList.add('incorrect');
        score.incorrect++;
        // ara cerquem per data-option
        const correctBtn = allButtons.find(b => b.dataset.option === correctAnswer);
        if (correctBtn) {
            correctBtn.classList.add('correct');
        } else {
            console.warn('No s\'ha trobat el botó correcte:', correctAnswer);
        }
    }

    els.nextBtn.disabled = false;
    updateScoreboard();

    const orig = questions.find(item => item.question === q.question);
    if (orig) orig.times_asked++;
}

function handleNext() {
    currentIdx++;
    if (currentIdx < selectedQs.length) showQuestion();
    else finishQuiz();
}

function finishQuiz() {
    els.quizScreen.classList.add('hidden');
    els.resultScreen.classList.remove('hidden');
    const nota = Math.max(0, Math.min(5, score.correct * 0.25 - score.incorrect * 0.083));
    const avg = saveResult(score.correct, score.incorrect, score.blank, nota);

    els.result.correct.textContent = score.correct;
    els.result.incorrect.textContent = score.incorrect;
    els.result.blank.textContent = score.blank;
    els.result.score.textContent = nota.toFixed(2);
    els.result.avg.textContent = avg.toFixed(2);

    saveQuestions(questions);
}

function updateScoreboard() {
    els.scoreboard.correct.textContent = score.correct;
    els.scoreboard.incorrect.textContent = score.incorrect;
    els.scoreboard.blank.textContent = score.blank;
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}