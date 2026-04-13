(function () {
  "use strict";

  var QUESTIONS = [
    {
      statement: "When a credit card company sets limits on how much can be charged on a card, it's based on your ability to handle debt.",
      answer: "Fact",
      feedback: "This refers to your credit limit. Beginner cards often have lower limits, and limits may increase over time with responsible credit use."
    },
    {
      statement: "Late fees, if you don't pay your bill on time, can be as high as $35.",
      answer: "Fact",
      feedback: "Late fees can be costly. Automatic payments or reminders can help avoid them."
    },
    {
      statement: "Usually, the lower your credit score, the higher your credit card interest rates will be.",
      answer: "Fact",
      feedback: "Lower scores usually mean lenders see you as higher risk, so rates tend to be higher."
    },
    {
      statement: "The grace period for credit cards is usually about 30 days.",
      answer: "Fiction",
      feedback: "The grace period is usually about 25 days, not 30."
    },
    {
      statement: "Secured credit cards can be a good option for someone with poor credit or no credit.",
      answer: "Fact",
      feedback: "Secured cards are backed by a cash deposit, so they can be easier to qualify for while building credit."
    },
    {
      statement: "If you charge over your limit on a secured credit card, the bank can take the balance from your account.",
      answer: "Fact",
      feedback: "The deposit acts as collateral for the bank or card company."
    },
    {
      statement: "Making the minimum payments saves you money.",
      answer: "Fiction",
      feedback: "Minimum payments may reduce short-term pressure, but they usually cost more over time because interest keeps building."
    },
    {
      statement: "If you pay less than the minimum payment, your card will be deactivated.",
      answer: "Fact",
      feedback: "The minimum payment is the least amount needed to keep the card active."
    },
    {
      statement: "If your credit card is lost or stolen, or has been used without your permission, you will be responsible for only the first $100 of unauthorized charges if you report it right away.",
      answer: "Fiction",
      feedback: "You are responsible for only the first $50 if you report it right away."
    },
    {
      statement: "If you pay your bill in full during the grace period, you won't have to pay a finance charge on purchases for that bill.",
      answer: "Fact",
      feedback: "Paying in full during the grace period avoids finance charges on those purchases."
    }
  ];

  var PASSING_PERCENT = 80;
  var STORAGE_KEY = "workshop6-credit-card-fact-fiction";

  var state = {
    phase: "intro",
    currentPool: buildFullPool(),
    poolPosition: 0,
    answers: createEmptyAnswers(),
    roundSubmitted: false,
    showDetails: false
  };

  var ui = {
    introScreen: document.getElementById("intro-screen"),
    quizScreen: document.getElementById("quiz-screen"),
    resultsScreen: document.getElementById("results-screen"),
    startBtn: document.getElementById("start-btn"),
    answerForm: document.getElementById("answer-form"),
    submitBtn: document.getElementById("submit-btn"),
    nextBtn: document.getElementById("next-btn"),
    factInput: document.getElementById("choice-fact"),
    fictionInput: document.getElementById("choice-fiction"),
    progressText: document.getElementById("progress-text"),
    scoreText: document.getElementById("score-text"),
    questionHeading: document.getElementById("question-heading"),
    statementText: document.getElementById("statement-text"),
    feedbackPanel: document.getElementById("feedback-panel"),
    feedbackTitle: document.getElementById("feedback-title"),
    feedbackBody: document.getElementById("feedback-body"),
    resultTag: document.getElementById("result-tag"),
    resultsSummary: document.getElementById("results-summary"),
    tryAgainBtn: document.getElementById("try-again-btn"),
    viewResultsBtn: document.getElementById("view-results-btn"),
    restartBtn: document.getElementById("restart-btn"),
    resultsDetails: document.getElementById("results-details"),
    resultsTbody: document.getElementById("results-tbody")
  };

  init();

  function init() {
    Scorm12.init();
    loadPersistedState();
    ensureLessonInProgress();

    bindEvents();
    render();
  }

  function bindEvents() {
    ui.startBtn.addEventListener("click", function () {
      startFullRound();
    });

    ui.answerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      submitAnswer();
    });

    ui.nextBtn.addEventListener("click", function () {
      goToNextQuestion();
    });

    ui.tryAgainBtn.addEventListener("click", function () {
      retryIncorrectItems();
    });

    ui.viewResultsBtn.addEventListener("click", function () {
      state.showDetails = !state.showDetails;
      persistState();
      renderResultsDetails();
    });

    ui.restartBtn.addEventListener("click", function () {
      restartEverything();
    });

    window.addEventListener("beforeunload", finalizeScorm);
    window.addEventListener("pagehide", finalizeScorm);
  }

  function startFullRound() {
    state.phase = "quiz";
    state.currentPool = buildFullPool();
    state.poolPosition = 0;
    state.roundSubmitted = false;
    state.showDetails = false;
    state.answers = createEmptyAnswers();

    markInProgress();
    persistState();
    render();
  }

  function submitAnswer() {
    if (state.phase !== "quiz") {
      return;
    }

    if (state.roundSubmitted) {
      return;
    }

    var selected = getSelectedAnswer();

    if (!selected) {
      showFeedback("Please choose an answer.", "Select Fact or Fiction, then submit your answer.", "info");
      return;
    }

    var qIndex = getCurrentQuestionIndex();
    var question = QUESTIONS[qIndex];
    state.answers[qIndex] = selected;
    state.roundSubmitted = true;

    var isCorrect = selected === question.answer;
    if (isCorrect) {
      showFeedback("Correct", question.feedback, "correct");
    } else {
      showFeedback("Not quite", question.feedback, "incorrect");
    }

    updateScormScoreAndStatus(false);
    persistState();
    renderQuizControls();
  }

  function goToNextQuestion() {
    if (!state.roundSubmitted) {
      return;
    }

    if (state.poolPosition < state.currentPool.length - 1) {
      state.poolPosition += 1;
      state.roundSubmitted = false;
      hideFeedback();
      persistState();
      render();
      return;
    }

    state.phase = "results";
    state.roundSubmitted = false;
    state.showDetails = false;

    updateScormScoreAndStatus(true);
    persistState();
    render();
  }

  function retryIncorrectItems() {
    var incorrect = getIncorrectIndices();

    if (incorrect.length === 0) {
      return;
    }

    for (var i = 0; i < incorrect.length; i += 1) {
      state.answers[incorrect[i]] = null;
    }

    state.phase = "quiz";
    state.currentPool = incorrect;
    state.poolPosition = 0;
    state.roundSubmitted = false;
    state.showDetails = false;

    markInProgress();
    persistState();
    render();
  }

  function restartEverything() {
    state.phase = "intro";
    state.currentPool = buildFullPool();
    state.poolPosition = 0;
    state.answers = createEmptyAnswers();
    state.roundSubmitted = false;
    state.showDetails = false;

    markInProgress();
    persistState();
    render();
  }

  function render() {
    ui.introScreen.hidden = state.phase !== "intro";
    ui.quizScreen.hidden = state.phase !== "quiz";
    ui.resultsScreen.hidden = state.phase !== "results";

    if (state.phase === "quiz") {
      renderQuiz();
    }

    if (state.phase === "results") {
      renderResults();
    }
  }

  function renderQuiz() {
    var qIndex = getCurrentQuestionIndex();
    var question = QUESTIONS[qIndex];

    ui.questionHeading.textContent = "Question " + (state.poolPosition + 1) + " of " + state.currentPool.length;
    ui.statementText.textContent = question.statement;
    ui.progressText.textContent = "Round progress: " + (state.poolPosition + 1) + " / " + state.currentPool.length;
    ui.scoreText.textContent = "Current score: " + getScore() + " / " + QUESTIONS.length;

    var savedAnswer = state.answers[qIndex];
    ui.factInput.checked = savedAnswer === "Fact";
    ui.fictionInput.checked = savedAnswer === "Fiction";

    if (state.roundSubmitted && savedAnswer) {
      var isCorrect = savedAnswer === question.answer;
      showFeedback(isCorrect ? "Correct" : "Not quite", question.feedback, isCorrect ? "correct" : "incorrect");
    } else {
      hideFeedback();
    }

    renderQuizControls();
  }

  function renderQuizControls() {
    var canAdvance = state.roundSubmitted;

    ui.submitBtn.hidden = canAdvance;
    ui.nextBtn.hidden = !canAdvance;

    ui.factInput.disabled = canAdvance;
    ui.fictionInput.disabled = canAdvance;

    if (canAdvance) {
      ui.nextBtn.textContent = state.poolPosition === state.currentPool.length - 1 ? "View Results" : "Next Question";
      ui.nextBtn.focus();
    } else {
      ui.submitBtn.focus();
    }
  }

  function renderResults() {
    var score = getScore();
    var total = QUESTIONS.length;
    var percent = getPercent();
    var passed = percent >= PASSING_PERCENT;
    var incorrectCount = getIncorrectIndices().length;

    ui.resultTag.textContent = passed ? "Pass" : "Keep Practicing";
    ui.resultTag.className = "result-tag " + (passed ? "result-pass" : "result-review");

    ui.resultsSummary.textContent =
      "You scored " + score + " out of " + total + " (" + percent + "%). " +
      (passed
        ? "You met the passing score of 80%."
        : "You have not reached 80% yet. Use Try Again to review just the items you missed.");

    ui.tryAgainBtn.hidden = incorrectCount === 0;
    ui.tryAgainBtn.textContent = "Try Again" + (incorrectCount > 0 ? " (" + incorrectCount + " items)" : "");

    renderResultsDetails();
  }

  function renderResultsDetails() {
    ui.resultsDetails.hidden = !state.showDetails;
    ui.viewResultsBtn.textContent = state.showDetails ? "Hide Results" : "View Results";

    if (!state.showDetails) {
      return;
    }

    var rows = [];

    for (var i = 0; i < QUESTIONS.length; i += 1) {
      var userAnswer = state.answers[i] || "Not answered";
      var isCorrect = userAnswer === QUESTIONS[i].answer;
      var statusLabel = isCorrect ? "Correct" : "Review Needed";

      rows.push(
        "<tr>" +
          "<td>" + (i + 1) + "</td>" +
          "<td>" + escapeHtml(QUESTIONS[i].statement) + "</td>" +
          "<td>" + escapeHtml(userAnswer) + "</td>" +
          "<td>" + escapeHtml(QUESTIONS[i].answer) + "</td>" +
          "<td>" + statusLabel + "</td>" +
        "</tr>"
      );
    }

    ui.resultsTbody.innerHTML = rows.join("");
  }

  function showFeedback(title, body, type) {
    ui.feedbackPanel.hidden = false;
    ui.feedbackPanel.className = "feedback " + (type || "info");
    ui.feedbackTitle.textContent = title;
    ui.feedbackBody.textContent = body;
  }

  function hideFeedback() {
    ui.feedbackPanel.hidden = true;
    ui.feedbackPanel.className = "feedback info";
    ui.feedbackTitle.textContent = "";
    ui.feedbackBody.textContent = "";
  }

  function createEmptyAnswers() {
    return Array(QUESTIONS.length).fill(null);
  }

  function buildFullPool() {
    return QUESTIONS.map(function (_, index) {
      return index;
    });
  }

  function getCurrentQuestionIndex() {
    if (!state.currentPool.length) {
      return 0;
    }

    return state.currentPool[state.poolPosition];
  }

  function getSelectedAnswer() {
    if (ui.factInput.checked) {
      return "Fact";
    }

    if (ui.fictionInput.checked) {
      return "Fiction";
    }

    return null;
  }

  function getScore() {
    var score = 0;

    for (var i = 0; i < QUESTIONS.length; i += 1) {
      if (state.answers[i] === QUESTIONS[i].answer) {
        score += 1;
      }
    }

    return score;
  }

  function getPercent() {
    return Math.round((getScore() / QUESTIONS.length) * 100);
  }

  function getIncorrectIndices() {
    var result = [];

    for (var i = 0; i < QUESTIONS.length; i += 1) {
      if (state.answers[i] !== QUESTIONS[i].answer) {
        result.push(i);
      }
    }

    return result;
  }

  function getLessonLocation() {
    if (state.phase === "quiz") {
      return "Q" + (getCurrentQuestionIndex() + 1);
    }

    if (state.phase === "results") {
      return "Results";
    }

    return "Intro";
  }

  function markInProgress() {
    Scorm12.set("cmi.core.lesson_status", "incomplete");
    Scorm12.set("cmi.core.exit", "suspend");
    Scorm12.commit();
  }

  function ensureLessonInProgress() {
    var status = Scorm12.get("cmi.core.lesson_status");
    if (!status || status === "not attempted") {
      markInProgress();
    }
  }

  function updateScormScoreAndStatus(isCompletedRound) {
    var score = getScore();
    var percent = getPercent();

    Scorm12.set("cmi.core.score.min", "0");
    Scorm12.set("cmi.core.score.max", String(QUESTIONS.length));
    Scorm12.set("cmi.core.score.raw", String(score));

    if (isCompletedRound) {
      Scorm12.set("cmi.core.lesson_status", percent >= PASSING_PERCENT ? "passed" : "failed");
      Scorm12.set("cmi.core.exit", "");
    } else {
      Scorm12.set("cmi.core.lesson_status", "incomplete");
      Scorm12.set("cmi.core.exit", "suspend");
    }

    Scorm12.commit();
  }

  function persistState() {
    var saved = {
      phase: state.phase,
      currentPool: state.currentPool,
      poolPosition: state.poolPosition,
      answers: state.answers,
      roundSubmitted: state.roundSubmitted,
      showDetails: state.showDetails
    };

    var payload = JSON.stringify(saved);
    Scorm12.set("cmi.suspend_data", payload);
    Scorm12.set("cmi.core.lesson_location", getLessonLocation());
    Scorm12.commit();

    try {
      localStorage.setItem(STORAGE_KEY, payload);
    } catch (error) {
      // Ignore storage failures in preview mode.
    }
  }

  function loadPersistedState() {
    var raw = Scorm12.get("cmi.suspend_data");

    if (!raw) {
      try {
        raw = localStorage.getItem(STORAGE_KEY);
      } catch (error) {
        raw = null;
      }
    }

    if (!raw) {
      return;
    }

    try {
      var parsed = JSON.parse(raw);
      if (!isValidSavedState(parsed)) {
        return;
      }

      state.phase = parsed.phase;
      state.currentPool = parsed.currentPool;
      state.poolPosition = parsed.poolPosition;
      state.answers = parsed.answers;
      state.roundSubmitted = parsed.roundSubmitted;
      state.showDetails = parsed.showDetails;
    } catch (error) {
      // Ignore invalid data and continue with defaults.
    }
  }

  function isValidSavedState(saved) {
    if (!saved || typeof saved !== "object") {
      return false;
    }

    if (["intro", "quiz", "results"].indexOf(saved.phase) === -1) {
      return false;
    }

    if (!Array.isArray(saved.currentPool) || !Array.isArray(saved.answers)) {
      return false;
    }

    if (saved.answers.length !== QUESTIONS.length) {
      return false;
    }

    if (typeof saved.poolPosition !== "number" || saved.poolPosition < 0) {
      return false;
    }

    if (saved.currentPool.length === 0 && saved.phase === "quiz") {
      return false;
    }

    if (saved.currentPool.length > 0 && saved.poolPosition >= saved.currentPool.length) {
      return false;
    }

    return true;
  }

  function finalizeScorm() {
    var status = Scorm12.get("cmi.core.lesson_status");
    var shouldSuspend = state.phase !== "results" || status === "failed" || status === "incomplete";

    Scorm12.set("cmi.core.exit", shouldSuspend ? "suspend" : "");
    Scorm12.commit();
    Scorm12.finish();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
