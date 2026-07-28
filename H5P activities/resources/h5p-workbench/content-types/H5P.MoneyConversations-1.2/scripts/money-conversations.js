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
      ],
      styleSettings: {
        categoryColors: {
          simple: "#10b981",
          dry: "#3b82f6",
          complex: "#8b5cf6",
          hot: "#f43f5e"
        },
        layoutColors: {
          pageBgColor: "#f8fafc",
          headerBgColor: "#ffffff",
          headerTitleColor: "#1e293b",
          headerDescColor: "#475569"
        },
        cardColors: {
          bankBgColor: "#ffffff",
          cardBgColor: "#ffffff",
          cardBorderColor: "#cbd5e1",
          cardTitleColor: "#1e293b",
          cardDescColor: "#475569",
          cardSelectColor: "#0b6b7c"
        },
        buttonColors: {
          btnSecondaryBg: "#ffffff",
          btnSecondaryText: "#1e293b",
          btnSecondaryBorder: "#cbd5e1",
          btnPrimaryBg: "#0b6b7c",
          btnPrimaryText: "#ffffff"
        },
        resultsColors: {
          quadrantBgColor: "#ffffff",
          tipsBgColor: "#f8fafc",
          tipsTextColor: "#475569",
          sectionLabelColor: "#64748b"
        }
      },
      l10n: {
        topicBankTitle: "Topic Bank",
        dropZonePlaceholderTemplate: "Drop @category items",
        itemsRemainingSingle: "1 item remaining",
        itemsRemainingPlural: "@count items remaining",
        allItemsClassified: "All items classified!",
        btnUndo: "Undo",
        btnRedo: "Redo",
        btnReset: "Reset",
        btnSubmit: "Submit Classification",
        quadrantHeaderTemplate: "@category",
        sortedTopicsLabel: "Sorted Topics",
        tipsLabel: "Tips for making these engaging",
        summaryBannerTemplate: "You sorted all @count topics! Below are tips on how to make learning about these categories engaging.",
        btnTryAgain: "Try Again",
        resetConfirmText: "Are you sure you want to reset the board? All classifications will be cleared."
      }
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

  MoneyConversations.prototype.applyStyles = function () {
    if (!this.params.styleSettings || !this.$wrapper) return;

    var ss = this.params.styleSettings;
    var cc = ss.categoryColors || {};
    var lc = ss.layoutColors || {};
    var cardc = ss.cardColors || {};
    var btnc = ss.buttonColors || {};
    var rc = ss.resultsColors || {};

    this.$wrapper.css({
      '--h5p-mc-page-bg': lc.pageBgColor || '#f8fafc',
      '--h5p-mc-header-bg': lc.headerBgColor || '#ffffff',
      '--h5p-mc-header-title': lc.headerTitleColor || '#1e293b',
      '--h5p-mc-header-desc': lc.headerDescColor || '#475569',

      '--h5p-mc-bank-bg': cardc.bankBgColor || '#ffffff',
      '--h5p-mc-card-bg': cardc.cardBgColor || '#ffffff',
      '--h5p-mc-card-border': cardc.cardBorderColor || '#cbd5e1',
      '--h5p-mc-card-title': cardc.cardTitleColor || '#1e293b',
      '--h5p-mc-card-desc': cardc.cardDescColor || '#475569',
      '--h5p-mc-card-select': cardc.cardSelectColor || '#0b6b7c',

      '--h5p-mc-btn-sec-bg': btnc.btnSecondaryBg || '#ffffff',
      '--h5p-mc-btn-sec-text': btnc.btnSecondaryText || '#1e293b',
      '--h5p-mc-btn-sec-border': btnc.btnSecondaryBorder || '#cbd5e1',
      '--h5p-mc-btn-pri-bg': btnc.btnPrimaryBg || '#0b6b7c',
      '--h5p-mc-btn-pri-text': btnc.btnPrimaryText || '#ffffff',

      '--h5p-mc-quadrant-bg': rc.quadrantBgColor || '#ffffff',
      '--h5p-mc-tips-bg': rc.tipsBgColor || '#f8fafc',
      '--h5p-mc-tips-text': rc.tipsTextColor || '#475569',
      '--h5p-mc-section-label': rc.sectionLabelColor || '#64748b',

      '--h5p-mc-color-simple': cc.simple || '#10b981',
      '--h5p-mc-color-dry': cc.dry || '#3b82f6',
      '--h5p-mc-color-complex': cc.complex || '#8b5cf6',
      '--h5p-mc-color-hot': cc.hot || '#f43f5e'
    });
  };

  MoneyConversations.prototype.attach = function ($container) {
    var self = this;
    
    // Clear and add main wrapper class
    $container.empty().addClass('h5p-money-conversations');

    // Build DOM structure
    this.$wrapper = $('<div class="h5p-mc-wrap"></div>').appendTo($container);
    this.applyStyles();

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

      var placeholderTemplate = self.params.l10n.dropZonePlaceholderTemplate || "Drop @category items";
      var placeholderText = placeholderTemplate.replace('@category', colLabel);

      var $placeholder = $(
        '<div class="h5p-mc-drop-zone-placeholder">' +
          '<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:32px;height:32px;opacity:0.5;">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />' +
          '</svg>' +
          '<span class="h5p-mc-drop-label"></span>' +
        '</div>'
      ).appendTo($col);
      $placeholder.find('.h5p-mc-drop-label').text(placeholderText);

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
    $('<span class="h5p-mc-item-bank-title"></span>').text(this.params.l10n.topicBankTitle).appendTo($bankHeader);
    this.$bankCount = $('<span class="h5p-mc-column-badge"></span>').appendTo($bankHeader);
    
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
      '<button class="h5p-mc-btn" disabled>' +
        '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle;">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />' +
        '</svg><span class="h5p-mc-btn-label"></span>' +
      '</button>'
    ).appendTo($toolGroup).on('click', function () { self.undo(); });
    this.$btnUndo.find('.h5p-mc-btn-label').text(this.params.l10n.btnUndo);
    this.$btnUndo.attr('aria-label', this.params.l10n.btnUndo);

    this.$btnRedo = $(
      '<button class="h5p-mc-btn" disabled>' +
        '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle;">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />' +
        '</svg><span class="h5p-mc-btn-label"></span>' +
      '</button>'
    ).appendTo($toolGroup).on('click', function () { self.redo(); });
    this.$btnRedo.find('.h5p-mc-btn-label').text(this.params.l10n.btnRedo);
    this.$btnRedo.attr('aria-label', this.params.l10n.btnRedo);

    this.$btnReset = $('<button class="h5p-mc-btn"></button>').text(this.params.l10n.btnReset).appendTo($toolGroup).on('click', function () {
      if (confirm(self.params.l10n.resetConfirmText)) {
        self.reset();
      }
    });

    this.$btnSubmit = $('<button class="h5p-mc-btn h5p-mc-btn-primary" disabled></button>')
      .text(this.params.l10n.btnSubmit)
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
      var headerTemplate = self.params.l10n.quadrantHeaderTemplate || "@category";
      var quadHeader = headerTemplate.replace('@category', colLabel);

      var $quadrant = $('<div class="h5p-mc-quadrant" data-q="' + cat + '"></div>').appendTo(self.$quadrantGrid);
      var $qHeader = $('<div class="h5p-mc-quadrant-header"><span class="h5p-mc-quadrant-title"></span></div>').appendTo($quadrant);
      $qHeader.find('.h5p-mc-quadrant-title').text(quadHeader);
      
      var $qChipsContainer = $('<div class="h5p-mc-quadrant-chips-container"><span class="h5p-mc-quadrant-chips-label"></span></div>').appendTo($quadrant);
      $qChipsContainer.find('.h5p-mc-quadrant-chips-label').text(self.params.l10n.sortedTopicsLabel);
      $('<div class="h5p-mc-quadrant-chips" id="h5p-mc-results-' + cat + '"></div>').appendTo($qChipsContainer);

      var $qTips = $('<div><span class="h5p-mc-quadrant-tips-title"></span><div class="h5p-mc-quadrant-tips">' + tipText + '</div></div>').appendTo($quadrant);
      $qTips.find('.h5p-mc-quadrant-tips-title').text(self.params.l10n.tipsLabel);
    });

    var $resultsToolbar = $('<div class="h5p-mc-toolbar"></div>').appendTo(this.$resultsScreen);
    this.$summaryScore = $('<span style="font-size:14px;font-weight:500;color:var(--h5p-mc-header-desc, #475569);"></span>').appendTo($resultsToolbar);
    $('<button class="h5p-mc-btn h5p-mc-btn-primary"></button>')
      .text(this.params.l10n.btnTryAgain)
      .appendTo($resultsToolbar)
      .on('click', function () {
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
    this.draggedItemId = null;
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

    // Update bank remaining count with localized format
    var remainingText = "";
    if (bankCountVal === 0) {
      remainingText = this.params.l10n.allItemsClassified;
    } else if (bankCountVal === 1) {
      remainingText = this.params.l10n.itemsRemainingSingle;
    } else {
      remainingText = this.params.l10n.itemsRemainingPlural.replace('@count', bankCountVal);
    }
    this.$bankCount.text(remainingText);
    
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

    $('<div class="h5p-mc-item-name"></div>').html(topic.name).appendTo($card);
    $('<div class="h5p-mc-item-desc"></div>').html(topic.desc).appendTo($card);

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
      $('<span></span>').html(topic.name).appendTo($chip);
      
      $('#h5p-mc-results-' + cat).append($chip);
    });

    var summaryText = this.params.l10n.summaryBannerTemplate.replace('@count', this.params.topics.length);
    this.$summaryScore.text(summaryText);
  };

  // State Persistence
  MoneyConversations.prototype.setState = function (state) {
    if (state && state.placements) {
      this.placements = $.extend({}, state.placements);
      this.historyStack = state.historyStack ? [].concat(state.historyStack) : [];
      this.redoStack = [];
      this.selectedItemId = null;
      this.draggedItemId = null;
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
