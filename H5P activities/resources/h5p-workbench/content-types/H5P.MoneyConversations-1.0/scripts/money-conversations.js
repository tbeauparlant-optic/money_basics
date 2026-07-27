var H5P = H5P || {};

H5P.MoneyConversations = (function ($) {
  function MoneyConversations(params, contentId, contentData) {
    H5P.EventDispatcher.call(this);

    this.contentId = contentId;
    this.contentData = contentData || {};
    this.previousState = this.contentData.previousState || {};

    // Merge default params
    this.params = $.extend(true, {}, {
      title: "Workshop 5: Categorizing Money Conversations",
      instruction: "Not all financial topics should be approached the same way. Classifying topics can help facilitators choose the best way to present them. Drag and drop or click/tap to select each of the topics below and sort them into their category columns.",
      categoryLabels: {
        simple: "Simple",
        dry: "Dry",
        complex: "Complex",
        hot: "Hot-button"
      },
      tips: {
        simple: "Filler Tip: To make simple topics engaging, use quick-fire quizzes, interactive matching games, and real-life scenario simulations to keep learners active.",
        dry: "Filler Tip: Dry topics (like terms of service or regulation details) can be made engaging by using storytelling, gamification elements, or group problem-solving exercises.",
        complex: "Filler Tip: For complex topics, break them into clear modular micro-lessons, use visual flowcharts, step-by-step progress trackers, and detailed case studies.",
        hot: "Filler Tip: Engage learners on hot-button topics by facilitating anonymous voting, structuring debates, using roleplay, and offering space for reflection."
      },
      topics: [
        { id: "atm", name: "ATMs & Cash Safety", desc: "Withdrawing cash, checking balances, and avoiding card skimming." },
        { id: "open-account", name: "Opening a Savings Account", desc: "Setting up a basic, secure, low-risk account with a financial institution." },
        { id: "checking", name: "Checking Accounts", desc: "Managing account features, transaction limits, and standard fees." },
        { id: "interest", name: "Interest Rates", desc: "The cost of borrowing or gain from saving, expressed as an annual rate." },
        { id: "taxes", name: "Filing Taxes", desc: "Filing annual state and federal tax returns and identifying tax credits." },
        { id: "loans", name: "Understanding Loans", desc: "Navigating terms, principal, and amortization tables over the loan duration." },
        { id: "poverty", name: "Systemic Poverty", desc: "Discussing wealth gaps, socio-economic barriers, and structural inequality." },
        { id: "debt", name: "Debt Repayment", desc: "Managing past-due balances, collections, and payoff strategies." },
        { id: "relationships", name: "Money & Relationships", desc: "Addressing money values, family expectations, and financial alignment." },
        { id: "budget", name: "Making a Budget", desc: "Creating plans to balance income and spending monthly." },
        { id: "creditcard", name: "Choosing a Credit Card", desc: "Comparing interest rates, annual fees, credit limits, and rewards." },
        { id: "savingsgoals", name: "Setting Savings Goals", desc: "Defining short-term and long-term targets for saving cash." }
      ]
    }, params);

    // Local State
    this.placements = {}; // itemId -> category (null, 'simple', 'dry', 'complex', 'hot')
    this.historyStack = [];
    this.redoStack = [];
    this.selectedItemId = null; // for mobile click-to-select
    this.draggedItemId = null; // fallback for iframe drag/drop restrictions
  }

  MoneyConversations.prototype = Object.create(H5P.EventDispatcher.prototype);
  MoneyConversations.prototype.constructor = MoneyConversations;

  MoneyConversations.prototype.attach = function ($container) {
    var self = this;
    
    // Clear and add main wrapper class
    $container.empty().addClass('h5p-money-conversations');

    // Build DOM structure
    this.$wrapper = $('<div class="h5p-mc-wrap"></div>').appendTo($container);
    this.$container = $('<div class="h5p-mc-container"></div>').appendTo(this.$wrapper);

    // Build Header
    var $header = $('<header class="h5p-mc-header"></header>').appendTo(this.$container);
    $('<h1></h1>').text(this.params.title).appendTo($header);
    $('<p class="h5p-mc-instruction"></p>').text(this.params.instruction).appendTo($header);

    // Build Workspace Screen
    this.$workspaceScreen = $('<div class="h5p-mc-workspace"></div>').appendTo(this.$container);

    // Build Board
    this.$board = $('<div class="h5p-mc-board" role="region" aria-label="Sorting Categories Board"></div>').appendTo(this.$workspaceScreen);
    
    this.columns = {};
    var cats = ['simple', 'dry', 'complex', 'hot'];
    cats.forEach(function (cat) {
      var colLabel = self.params.categoryLabels[cat] || cat;
      var $col = $('<div class="h5p-mc-column" data-category="' + cat + '"></div>').appendTo(self.$board);
      
      var $colHeader = $('<div class="h5p-mc-column-header"></div>').appendTo($col);
      $('<span class="h5p-mc-column-title"></span>').text(colLabel).appendTo($colHeader);
      $('<span class="h5p-mc-column-badge" id="h5p-mc-badge-' + cat + '">0</span>').appendTo($colHeader);
      
      var $colItems = $('<div class="h5p-mc-column-items"></div>').appendTo($col);
      self.columns[cat] = $colItems;

      var $placeholder = $(
        '<div class="h5p-mc-drop-zone-placeholder">' +
          '<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:32px;height:32px;opacity:0.5;">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />' +
          '</svg>' +
          '<span>Drop ' + colLabel + ' items</span>' +
        '</div>'
      ).appendTo($col);

      // Drag & Drop events
      $col.on('dragover', function (e) {
        e.preventDefault();
        $col.addClass('drag-over');
      });

      $col.on('dragleave', function () {
        $col.removeClass('drag-over');
      });

      $col.on('drop', function (e) {
        e.preventDefault();
        $col.removeClass('drag-over');
        var itemId = e.originalEvent.dataTransfer.getData('text/plain') || self.draggedItemId;
        if (itemId) {
          self.moveItem(itemId, cat);
        }
      });

      // Tap-to-drop click event
      $col.on('click', function () {
        if (self.selectedItemId) {
          self.moveItem(self.selectedItemId, cat);
        }
      });
    });

    // Build Item Bank
    var $bankContainer = $('<div class="h5p-mc-item-bank-container"></div>').appendTo(this.$workspaceScreen);
    var $bankHeader = $('<div class="h5p-mc-item-bank-header"></div>').appendTo($bankContainer);
    $('<span class="h5p-mc-item-bank-title">Topic Bank</span>').appendTo($bankHeader);
    this.$bankCount = $('<span class="h5p-mc-column-badge">12 items remaining</span>').appendTo($bankHeader);
    
    this.$itemBank = $('<div class="h5p-mc-item-bank" role="listbox" aria-label="Topic Bank"></div>').appendTo($bankContainer);
    this.$itemBank.on('dragover', function (e) {
      e.preventDefault();
    });
    this.$itemBank.on('drop', function (e) {
      e.preventDefault();
      var itemId = e.originalEvent.dataTransfer.getData('text/plain') || self.draggedItemId;
      if (itemId) {
        self.moveItem(itemId, null);
      }
    });
    this.$itemBank.on('click', function () {
      if (self.selectedItemId) {
        self.moveItem(self.selectedItemId, null);
      }
    });

    // Build Actions Toolbar
    var $toolbar = $('<div class="h5p-mc-toolbar"></div>').appendTo(this.$workspaceScreen);
    var $toolGroup = $('<div class="h5p-mc-tool-group"></div>').appendTo($toolbar);

    this.$btnUndo = $(
      '<button class="h5p-mc-btn" disabled aria-label="Undo last action">' +
        '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle;">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />' +
        '</svg>Undo' +
      '</button>'
    ).appendTo($toolGroup).on('click', function () { self.undo(); });

    this.$btnRedo = $(
      '<button class="h5p-mc-btn" disabled aria-label="Redo undone action">' +
        '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle;">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />' +
        '</svg>Redo' +
      '</button>'
    ).appendTo($toolGroup).on('click', function () { self.redo(); });

    this.$btnReset = $('<button class="h5p-mc-btn">Reset</button>').appendTo($toolGroup).on('click', function () {
      if (confirm("Are you sure you want to reset the board?")) {
        self.reset();
      }
    });

    this.$btnSubmit = $('<button class="h5p-mc-btn h5p-mc-btn-primary" disabled>Submit Classification</button>')
      .appendTo($toolbar)
      .on('click', function () {
        self.$workspaceScreen.hide();
        self.$resultsScreen.show();
        self.showResults();
        self.trigger('resize');
      });

    // Build Results Screen
    this.$resultsScreen = $('<div class="h5p-mc-results-screen" style="display:none;"></div>').appendTo(this.$container);
    this.$quadrantGrid = $('<div class="h5p-mc-quadrant-grid"></div>').appendTo(this.$resultsScreen);

    cats.forEach(function (cat) {
      var colLabel = self.params.categoryLabels[cat] || cat;
      var tipText = self.params.tips[cat] || "";

      var $quadrant = $('<div class="h5p-mc-quadrant" data-q="' + cat + '"></div>').appendTo(self.$quadrantGrid);
      var $qHeader = $('<div class="h5p-mc-quadrant-header"><span class="h5p-mc-quadrant-title">' + colLabel + ' Quadrant</span></div>').appendTo($quadrant);
      
      var $qChipsContainer = $('<div class="h5p-mc-quadrant-chips-container"><span class="h5p-mc-quadrant-chips-label">Sorted Topics</span></div>').appendTo($quadrant);
      $('<div class="h5p-mc-quadrant-chips" id="h5p-mc-results-' + cat + '"></div>').appendTo($qChipsContainer);

      var $qTips = $('<div><span class="h5p-mc-quadrant-tips-title">Tips for making these engaging</span><div class="h5p-mc-quadrant-tips">' + tipText + '</div></div>').appendTo($quadrant);
    });

    var $resultsToolbar = $('<div class="h5p-mc-toolbar"></div>').appendTo(this.$resultsScreen);
    this.$summaryScore = $('<span style="font-size:14px;font-weight:500;color:#475569;"></span>').appendTo($resultsToolbar);
    $('<button class="h5p-mc-btn h5p-mc-btn-primary">Try Again</button>').appendTo($resultsToolbar).on('click', function () {
      self.$resultsScreen.hide();
      self.$workspaceScreen.show();
      self.reset();
      self.trigger('resize');
    });

    // Initialize Placements & Recover state
    this.resetState();
    if (this.previousState && Object.keys(this.previousState).length > 0) {
      this.setState(this.previousState);
    } else {
      this.render();
    }
    
    this.trigger('resize');
  };

  MoneyConversations.prototype.resetState = function () {
    var self = this;
    this.placements = {};
    this.params.topics.forEach(function (topic) {
      self.placements[topic.id] = null;
    });
    this.historyStack = [];
    this.redoStack = [];
    this.selectedItemId = null;
  };

  MoneyConversations.prototype.reset = function () {
    this.resetState();
    this.render();
  };

  MoneyConversations.prototype.moveItem = function (itemId, newCategory, isUndoRedo) {
    var prevCategory = this.placements[itemId];
    if (prevCategory === newCategory) return;

    this.placements[itemId] = newCategory;

    if (!isUndoRedo) {
      this.historyStack.push({ itemId: itemId, prevCategory: prevCategory, newCategory: newCategory });
      this.redoStack = []; // Clear redo stack
    }

    this.selectedItemId = null;
    this.render();
  };

  MoneyConversations.prototype.undo = function () {
    if (this.historyStack.length === 0) return;
    var action = this.historyStack.pop();
    this.redoStack.push(action);
    this.moveItem(action.itemId, action.prevCategory, true);
  };

  MoneyConversations.prototype.redo = function () {
    if (this.redoStack.length === 0) return;
    var action = this.redoStack.pop();
    this.historyStack.push(action);
    this.moveItem(action.itemId, action.newCategory, true);
  };

  MoneyConversations.prototype.render = function () {
    var self = this;
    
    // Clear elements
    this.$itemBank.empty();
    var cats = ['simple', 'dry', 'complex', 'hot'];
    cats.forEach(function (cat) {
      self.columns[cat].empty();
      self.columns[cat].parent().removeClass('active-drop');
    });

    var bankCountVal = 0;
    var sortedCount = 0;

    this.params.topics.forEach(function (topic) {
      var cat = self.placements[topic.id];
      var $card = self.createCard(topic);

      if (cat) {
        self.columns[cat].append($card);
        sortedCount++;
      } else {
        self.$itemBank.append($card);
        bankCountVal++;
      }
    });

    // Update placeholders and counts
    cats.forEach(function (cat) {
      var $col = self.columns[cat].parent();
      var count = self.columns[cat].children().length;
      $col.find('.h5p-mc-column-badge').text(count);
      
      var $placeholder = $col.find('.h5p-mc-drop-zone-placeholder');
      if (count > 0) {
        $placeholder.hide();
        $col.css('border-style', 'solid');
      } else {
        $placeholder.show();
        $col.css('border-style', 'dashed');
      }
    });

    this.$bankCount.text(bankCountVal === 0 ? "All items classified!" : bankCountVal + " item" + (bankCountVal > 1 ? 's' : '') + " remaining");
    
    this.$btnUndo.prop('disabled', this.historyStack.length === 0);
    this.$btnRedo.prop('disabled', this.redoStack.length === 0);
    this.$btnSubmit.prop('disabled', sortedCount < this.params.topics.length);
  };

  MoneyConversations.prototype.createCard = function (topic) {
    var self = this;
    var $card = $('<div class="h5p-mc-item-card" draggable="true" role="option" tabindex="0"></div>');
    
    if (this.selectedItemId === topic.id) {
      $card.addClass('selected');
    }

    $('<div class="h5p-mc-item-name"></div>').text(topic.name).appendTo($card);
    $('<div class="h5p-mc-item-desc"></div>').text(topic.desc).appendTo($card);

    // HTML5 Drag
    $card.on('dragstart', function (e) {
      $card.addClass('dragging');
      self.draggedItemId = topic.id;
      e.originalEvent.dataTransfer.setData('text/plain', topic.id);
    });

    $card.on('dragend', function () {
      $card.removeClass('dragging');
      self.draggedItemId = null;
    });

    // Click/Tap select (mobile)
    $card.on('click', function (e) {
      e.stopPropagation();
      if (self.selectedItemId === topic.id) {
        self.selectedItemId = null;
      } else {
        self.selectedItemId = topic.id;
      }
      self.render();
    });

    $card.on('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (self.selectedItemId === topic.id) {
          self.selectedItemId = null;
        } else {
          self.selectedItemId = topic.id;
        }
        self.render();
      }
    });

    return $card;
  };

  MoneyConversations.prototype.showResults = function () {
    var self = this;
    var cats = ['simple', 'dry', 'complex', 'hot'];
    
    cats.forEach(function (cat) {
      $('#h5p-mc-results-' + cat).empty();
    });

    this.params.topics.forEach(function (topic) {
      var cat = self.placements[topic.id];
      if (!cat) return;

      var $chip = $('<div class="h5p-mc-feedback-chip" data-col="' + cat + '"></div>');
      $('<span class="h5p-mc-status-bullet"></span>').appendTo($chip);
      $('<span></span>').text(topic.name).appendTo($chip);
      
      $('#h5p-mc-results-' + cat).append($chip);
    });

    this.$summaryScore.text("You sorted all " + this.params.topics.length + " topics! Below are tips on how to make learning about these categories engaging.");
  };

  // State Persistence
  MoneyConversations.prototype.setState = function (state) {
    if (state && state.placements) {
      this.placements = $.extend({}, state.placements);
      this.historyStack = state.historyStack ? [].concat(state.historyStack) : [];
      this.redoStack = [];
      this.selectedItemId = null;
      this.render();
    }
  };

  MoneyConversations.prototype.getCurrentState = function () {
    return {
      placements: this.placements,
      historyStack: this.historyStack
    };
  };

  return MoneyConversations;
})(H5P.jQuery);
