(function () {
  "use strict";

  var COURSE_CONFIG = {
    title: "Workshop 6: Credit Card Fact or Fiction",
    passingPercent: 80,
    scoring: {
      pointsPerQuestion: 1,
      totalPoints: 10
    },
    messages: {
      pass: "You've completed the activity. Understanding these credit basics can help you make more informed choices and avoid costly mistakes.",
      retry: "You can try again. Reviewing the key terms first may help reinforce the ideas before your next attempt."
    },
    terms: [
      {
        term: "Credit limit",
        definition: "The maximum amount you can charge on a credit card."
      },
      {
        term: "Late fees",
        definition: "Extra fees you may be charged if you do not pay on time."
      },
      {
        term: "Secured credit card",
        definition: "A credit card backed by money you deposit upfront, often used to build or rebuild credit."
      },
      {
        term: "Grace period",
        definition: "The period of time after your bill is issued when you can pay in full and avoid finance charges on purchases."
      },
      {
        term: "Interest rate",
        definition: "The cost of borrowing money, usually shown as a percentage."
      }
    ],
    questions: [
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
    ]
  };

  var STORAGE_KEY = "workshop6-credit-card-fact-fiction-v2";

  var state = {
    phase: "welcome",
    questionIndex: 0,
    answers: emptyAnswers(),
    submittedCurrent: false,
    reviewVisible: false,
    termsReturnTarget: "quiz",
    termExpanded: initExpandedTerms()
  };

  var ui = {
    welcomeScreen: document.getElementById("welcome-screen"),
    teachingScreen: document.getElementById("teaching-screen"),
    termsScreen: document.getElementById("terms-screen"),
    quizScreen: document.getElementById("quiz-screen"),
    resultsScreen: document.getElementById("results-screen"),

    startBtn: document.getElementById("start-btn"),
    teachingContinueBtn: document.getElementById("teaching-continue-btn"),
    termsContinueBtn: document.getElementById("terms-continue-btn"),
    termList: document.getElementById("term-list"),

    quizForm: document.getElementById("quiz-form"),
    answerFact: document.getElementById("answer-fact"),
    answerFiction: document.getElementById("answer-fiction"),
    submitAnswerBtn: document.getElementById("submit-answer-btn"),
    nextBtn: document.getElementById("next-btn"),
    quizProgress: document.getElementById("quiz-progress"),
    quizScore: document.getElementById("quiz-score"),
    statementText: document.getElementById("statement-text"),
    feedbackPanel: document.getElementById("feedback-panel"),
    feedbackTitle: document.getElementById("feedback-title"),
    feedbackText: document.getElementById("feedback-text"),

    resultChip: document.getElementById("result-chip"),
    resultSummary: document.getElementById("result-summary"),
    resultMessage: document.getElementById("result-message"),
    tryAgainBtn: document.getElementById("try-again-btn"),
    reviewTermsBtn: document.getElementById("review-terms-btn"),
    viewResultsBtn: document.getElementById("view-results-btn"),
    restartBtn: document.getElementById("restart-btn"),
    resultsReview: document.getElementById("results-review"),
    resultsBody: document.getElementById("results-body")
  };

  init();

  function init() {
    Scorm12.init();
    renderTerms();
    restoreState();
    bindEvents();
    render();
    syncScormWithCurrentState();
  }

  function bindEvents() {
    ui.startBtn.addEventListener("click", startActivity);
    ui.teachingContinueBtn.addEventListener("click", goToTermsForQuiz);
    ui.termsContinueBtn.addEventListener("click", continueFromTerms);

    ui.quizForm.addEventListener("submit", function (event) {
      event.preventDefault();
      submitAnswer();
    });

    ui.nextBtn.addEventListener("click", goToNextStep);

    ui.tryAgainBtn.addEventListener("click", tryAgain);
    ui.reviewTermsBtn.addEventListener("click", reviewTermsFromResults);
    ui.viewResultsBtn.addEventListener("click", showResultsReview);
    ui.restartBtn.addEventListener("click", restartActivity);

    window.addEventListener("beforeunload", finalizeScorm);
    window.addEventListener("pagehide", finalizeScorm);
  }

  function startActivity() {
    resetAttemptState();
    state.phase = "teaching";
    state.termsReturnTarget = "quiz";
    markAttemptInProgress();
    persistState();
    render();
    ui.teachingContinueBtn.focus();
  }

  function goToTermsForQuiz() {
    state.phase = "terms";
    state.termsReturnTarget = "quiz";
    persistState();
    render();
    focusFirstTerm();
  }

  function continueFromTerms() {
    if (state.termsReturnTarget === "results") {
      state.phase = "results";
      state.termsReturnTarget = "quiz";
      persistState();
      render();
      ui.reviewTermsBtn.focus();
      return;
    }

    state.phase = "quiz";
    state.submittedCurrent = false;
    hideFeedback();
    markAttemptInProgress();
    persistState();
    render();
    ui.answerFact.focus();
  }

  function submitAnswer() {
    if (state.phase !== "quiz" || state.submittedCurrent) {
      return;
    }

    var selected = getSelectedAnswer();
    if (!selected) {
      showFeedback(
        "Answer needed",
        "Please choose Fact or Fiction, then select Submit Answer.",
        "info"
      );
      return;
    }

    var q = COURSE_CONFIG.questions[state.questionIndex];
    state.answers[state.questionIndex] = selected;
    state.submittedCurrent = true;

    if (selected === q.answer) {
      showFeedback("Correct", q.feedback, "ok");
    } else {
      showFeedback("Not correct", q.feedback, "warn");
    }

    updateScormScore(false);
    persistState();
    renderQuizControls();
  }

  function goToNextStep() {
    if (state.phase !== "quiz" || !state.submittedCurrent) {
      return;
    }

    if (state.questionIndex < COURSE_CONFIG.questions.length - 1) {
      state.questionIndex += 1;
      state.submittedCurrent = false;
      hideFeedback();
      persistState();
      render();
      ui.answerFact.focus();
      return;
    }

    state.phase = "results";
    state.submittedCurrent = false;
    state.reviewVisible = false;

    updateScormScore(true);
    persistState();
    render();
    ui.tryAgainBtn.focus();
  }

  function tryAgain() {
    resetAttemptState();
    state.phase = "teaching";
    state.termsReturnTarget = "quiz";
    markAttemptInProgress();
    persistState();
    render();
    ui.teachingContinueBtn.focus();
  }

  function reviewTermsFromResults() {
    state.phase = "terms";
    state.termsReturnTarget = "results";
    persistState();
    render();
    focusFirstTerm();
  }

  function showResultsReview() {
    if (state.phase !== "results") {
      return;
    }

    state.reviewVisible = true;
    persistState();
    renderResultsReview();
    ui.viewResultsBtn.disabled = true;
  }

  function restartActivity() {
    resetAllState();
    markAttemptInProgress();
    persistState();
    render();
    ui.startBtn.focus();
  }

  function render() {
    ui.welcomeScreen.hidden = state.phase !== "welcome";
    ui.teachingScreen.hidden = state.phase !== "teaching";
    ui.termsScreen.hidden = state.phase !== "terms";
    ui.quizScreen.hidden = state.phase !== "quiz";
    ui.resultsScreen.hidden = state.phase !== "results";

    if (state.phase === "terms") {
      renderTerms();
    }

    if (state.phase === "quiz") {
      renderQuiz();
    }

    if (state.phase === "results") {
      renderResults();
    }
  }

  function renderQuiz() {
    var question = COURSE_CONFIG.questions[state.questionIndex];
    var currentAnswer = state.answers[state.questionIndex];

    ui.quizProgress.textContent = "Question " + (state.questionIndex + 1) + " of " + COURSE_CONFIG.questions.length;
    ui.quizScore.textContent = "Score so far: " + getScore() + " / " + COURSE_CONFIG.scoring.totalPoints;
    ui.statementText.textContent = question.statement;

    ui.answerFact.checked = currentAnswer === "Fact";
    ui.answerFiction.checked = currentAnswer === "Fiction";

    if (state.submittedCurrent && currentAnswer) {
      var type = currentAnswer === question.answer ? "ok" : "warn";
      var title = currentAnswer === question.answer ? "Correct" : "Not correct";
      showFeedback(title, question.feedback, type);
    } else {
      hideFeedback();
    }

    renderQuizControls();
  }

  function renderQuizControls() {
    var isSubmitted = state.submittedCurrent;

    ui.submitAnswerBtn.hidden = isSubmitted;
    ui.nextBtn.hidden = !isSubmitted;

    ui.answerFact.disabled = isSubmitted;
    ui.answerFiction.disabled = isSubmitted;

    if (isSubmitted) {
      ui.nextBtn.textContent = state.questionIndex === COURSE_CONFIG.questions.length - 1 ? "View Results" : "Next";
    } else {
      ui.nextBtn.textContent = "Next";
    }
  }

  function renderTerms() {
    var html = [];

    for (var i = 0; i < COURSE_CONFIG.terms.length; i += 1) {
      var isExpanded = !!state.termExpanded[i];
      var btnId = "term-toggle-" + i;
      var panelId = "term-panel-" + i;

      html.push(
        "<div class=\"term-item\" role=\"listitem\">" +
          "<button id=\"" + btnId + "\" class=\"term-toggle\" type=\"button\" data-term-index=\"" + i + "\" aria-expanded=\"" + String(isExpanded) + "\" aria-controls=\"" + panelId + "\">" +
            "<span>" + escapeHtml(COURSE_CONFIG.terms[i].term) + "</span>" +
            "<span class=\"term-indicator\" aria-hidden=\"true\">" + (isExpanded ? "-" : "+") + "</span>" +
          "</button>" +
          "<div id=\"" + panelId + "\" class=\"term-panel\" " + (isExpanded ? "" : "hidden") + " role=\"region\" aria-labelledby=\"" + btnId + "\">" +
            escapeHtml(COURSE_CONFIG.terms[i].definition) +
          "</div>" +
        "</div>"
      );
    }

    ui.termList.innerHTML = html.join("");

    var toggleButtons = ui.termList.querySelectorAll(".term-toggle");
    for (var j = 0; j < toggleButtons.length; j += 1) {
      toggleButtons[j].addEventListener("click", onToggleTerm);
    }
  }

  function onToggleTerm(event) {
    var index = Number(event.currentTarget.getAttribute("data-term-index"));
    state.termExpanded[index] = !state.termExpanded[index];
    persistState();
    renderTerms();

    var button = document.getElementById("term-toggle-" + index);
    if (button) {
      button.focus();
    }
  }

  function renderResults() {
    var score = getScore();
    var total = COURSE_CONFIG.scoring.totalPoints;
    var percent = getPercent();
    var passed = percent >= COURSE_CONFIG.passingPercent;

    ui.resultChip.textContent = passed ? "Pass status: Passed" : "Pass status: Not yet passed";
    ui.resultSummary.textContent = "Total score: " + score + " out of " + total + " (" + percent + "%). Passing score: " + COURSE_CONFIG.passingPercent + "%";
    ui.resultMessage.textContent = passed ? COURSE_CONFIG.messages.pass : COURSE_CONFIG.messages.retry;

    ui.viewResultsBtn.disabled = state.reviewVisible;
    renderResultsReview();
  }

  function renderResultsReview() {
    ui.resultsReview.hidden = !state.reviewVisible;

    if (!state.reviewVisible) {
      return;
    }

    var rows = [];

    for (var i = 0; i < COURSE_CONFIG.questions.length; i += 1) {
      var question = COURSE_CONFIG.questions[i];
      var answer = state.answers[i] || "Not answered";

      rows.push(
        "<tr>" +
          "<td>" + (i + 1) + "</td>" +
          "<td>" + escapeHtml(question.statement) + "</td>" +
          "<td>" + escapeHtml(answer) + "</td>" +
          "<td>" + escapeHtml(question.answer) + "</td>" +
          "<td>" + escapeHtml(question.feedback) + "</td>" +
        "</tr>"
      );
    }

    ui.resultsBody.innerHTML = rows.join("");
  }

  function getSelectedAnswer() {
    if (ui.answerFact.checked) {
      return "Fact";
    }

    if (ui.answerFiction.checked) {
      return "Fiction";
    }

    return null;
  }

  function getScore() {
    var score = 0;

    for (var i = 0; i < COURSE_CONFIG.questions.length; i += 1) {
      if (state.answers[i] === COURSE_CONFIG.questions[i].answer) {
        score += COURSE_CONFIG.scoring.pointsPerQuestion;
      }
    }

    return score;
  }

  function getPercent() {
    return Math.round((getScore() / COURSE_CONFIG.scoring.totalPoints) * 100);
  }

  function showFeedback(title, message, type) {
    ui.feedbackPanel.hidden = false;
    ui.feedbackPanel.className = "feedback " + type;
    ui.feedbackTitle.textContent = title;
    ui.feedbackText.textContent = message;
  }

  function hideFeedback() {
    ui.feedbackPanel.hidden = true;
    ui.feedbackPanel.className = "feedback info";
    ui.feedbackTitle.textContent = "";
    ui.feedbackText.textContent = "";
  }

  function focusFirstTerm() {
    var firstToggle = document.querySelector(".term-toggle");
    if (firstToggle) {
      firstToggle.focus();
    }
  }

  function emptyAnswers() {
    return Array(COURSE_CONFIG.questions.length).fill(null);
  }

  function initExpandedTerms() {
    var result = {};
    for (var i = 0; i < COURSE_CONFIG.terms.length; i += 1) {
      result[i] = false;
    }
    return result;
  }

  function resetAttemptState() {
    state.questionIndex = 0;
    state.answers = emptyAnswers();
    state.submittedCurrent = false;
    state.reviewVisible = false;
    state.termExpanded = initExpandedTerms();
    hideFeedback();
  }

  function resetAllState() {
    state.phase = "welcome";
    state.questionIndex = 0;
    state.answers = emptyAnswers();
    state.submittedCurrent = false;
    state.reviewVisible = false;
    state.termsReturnTarget = "quiz";
    state.termExpanded = initExpandedTerms();
    hideFeedback();
  }

  function persistState() {
    var payload = JSON.stringify({
      phase: state.phase,
      questionIndex: state.questionIndex,
      answers: state.answers,
      submittedCurrent: state.submittedCurrent,
      reviewVisible: state.reviewVisible,
      termsReturnTarget: state.termsReturnTarget,
      termExpanded: state.termExpanded
    });

    Scorm12.set("cmi.suspend_data", payload);
    Scorm12.set("cmi.core.lesson_location", lessonLocation());
    Scorm12.commit();

    try {
      localStorage.setItem(STORAGE_KEY, payload);
    } catch (error) {
      // Local preview may block storage access.
    }
  }

  function restoreState() {
    var payload = Scorm12.get("cmi.suspend_data");

    if (!payload) {
      try {
        payload = localStorage.getItem(STORAGE_KEY);
      } catch (error) {
        payload = null;
      }
    }

    if (!payload) {
      return;
    }

    try {
      var saved = JSON.parse(payload);
      if (!isValidSavedState(saved)) {
        return;
      }

      state.phase = saved.phase;
      state.questionIndex = saved.questionIndex;
      state.answers = saved.answers;
      state.submittedCurrent = saved.submittedCurrent;
      state.reviewVisible = saved.reviewVisible;
      state.termsReturnTarget = saved.termsReturnTarget;
      state.termExpanded = saved.termExpanded;
    } catch (error) {
      // Ignore malformed saved state.
    }
  }

  function isValidSavedState(saved) {
    if (!saved || typeof saved !== "object") {
      return false;
    }

    if (["welcome", "teaching", "terms", "quiz", "results"].indexOf(saved.phase) === -1) {
      return false;
    }

    if (!Array.isArray(saved.answers) || saved.answers.length !== COURSE_CONFIG.questions.length) {
      return false;
    }

    if (typeof saved.questionIndex !== "number") {
      return false;
    }

    if (saved.questionIndex < 0 || saved.questionIndex >= COURSE_CONFIG.questions.length) {
      return false;
    }

    if (saved.termsReturnTarget !== "quiz" && saved.termsReturnTarget !== "results") {
      return false;
    }

    if (!saved.termExpanded || typeof saved.termExpanded !== "object") {
      return false;
    }

    return true;
  }

  function lessonLocation() {
    if (state.phase === "quiz") {
      return "Q" + (state.questionIndex + 1);
    }

    if (state.phase === "results") {
      return "Results";
    }

    if (state.phase === "terms") {
      return "KeyTerms";
    }

    if (state.phase === "teaching") {
      return "HowCreditWorks";
    }

    return "Welcome";
  }

  function markAttemptInProgress() {
    Scorm12.set("cmi.core.lesson_status", "incomplete");
    Scorm12.set("cmi.core.score.min", "0");
    Scorm12.set("cmi.core.score.max", String(COURSE_CONFIG.scoring.totalPoints));
    Scorm12.set("cmi.core.score.raw", String(getScore()));
    Scorm12.set("cmi.core.exit", "suspend");
    Scorm12.commit();
  }

  function updateScormScore(isComplete) {
    var score = getScore();
    var passed = getPercent() >= COURSE_CONFIG.passingPercent;

    Scorm12.set("cmi.core.score.min", "0");
    Scorm12.set("cmi.core.score.max", String(COURSE_CONFIG.scoring.totalPoints));
    Scorm12.set("cmi.core.score.raw", String(score));

    if (isComplete) {
      Scorm12.set("cmi.core.lesson_status", passed ? "passed" : "failed");
      Scorm12.set("cmi.core.exit", "");
    } else {
      Scorm12.set("cmi.core.lesson_status", "incomplete");
      Scorm12.set("cmi.core.exit", "suspend");
    }

    Scorm12.commit();
  }

  function syncScormWithCurrentState() {
    if (state.phase === "results") {
      updateScormScore(true);
      return;
    }

    if (state.phase === "teaching" || state.phase === "quiz") {
      updateScormScore(false);
      return;
    }

    if (state.phase === "terms" && state.termsReturnTarget === "quiz") {
      updateScormScore(false);
    }
  }

  function finalizeScorm() {
    if (state.phase === "results") {
      Scorm12.set("cmi.core.exit", "");
    } else {
      Scorm12.set("cmi.core.exit", "suspend");
    }

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
