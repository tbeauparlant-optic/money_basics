var H5P = H5P || {};

H5P.DebtActionPlanner = (function ($) {
  /**
   * Minimal worksheet-style H5P content type for debt planning.
   *
   * @param {object} params Content parameters.
   * @param {number} contentId H5P content id.
   * @param {object} contentData Previous state wrapper from H5P.
   */
  function DebtActionPlanner(params, contentId, contentData) {
    H5P.EventDispatcher.call(this);

    this.contentId = contentId;
    this.contentData = contentData || {};
    this.previousState = this.contentData.previousState || {};

    this.params = $.extend(true, {}, {
      actionPlanTitle: 'Action Plan for Getting Out of Debt',
      actionPlanIntro: 'Write your plan in plain language. Fill in the rows that make sense for you.',
      rowCount: 9,
      futureTitle: 'Planning for the Future',
      futureIntro: 'Think in hopeful numbers and realistic numbers.',
      futurePrompts: {
        oneYearHopeful: 'One year from now, I would like to reduce my debt by:',
        oneYearRealistic: 'One year from now, I realistically think I can reduce my debt by:',
        threeYearHopeful: 'Three years from now, I would like to reduce my debt by:',
        threeYearRealistic: 'Three years from now, I realistically think I can reduce my debt by:'
      },
      closingNote: 'Your answers here can help you decide which debts to focus on first.'
    }, params);

    this.activeStep = 0;
    this.actionInputs = [];
    this.futureInputs = {};
  }

  DebtActionPlanner.prototype = Object.create(H5P.EventDispatcher.prototype);
  DebtActionPlanner.prototype.constructor = DebtActionPlanner;

  /**
   * Attach content to H5P container.
   *
   * @param {jQuery} $container H5P wrapper.
   */
  DebtActionPlanner.prototype.attach = function ($container) {
    if (!this.$root) {
      this.$root = this.buildContent();
    }

    $container.empty().append(this.$root);

    this.setState(this.previousState);
    this.goToStep(this.previousState.activeStep || 0, true);
  };

  /**
   * Build the activity DOM once.
   *
   * @returns {jQuery} Root element.
   */
  DebtActionPlanner.prototype.buildContent = function () {
    var self = this;
    var $root = $('<div>', {
      'class': 'h5p-debt-action-planner'
    });

    this.$stepButtons = [];
    this.$sections = [];

    var $nav = $('<div>', {
      'class': 'h5p-debt-action-planner__nav',
      'role': 'tablist',
      'aria-label': 'Planner steps'
    }).appendTo($root);

    var steps = [
      {
        shortLabel: 'Step 1',
        label: 'Action Plan',
        section: this.createActionPlanSection()
      },
      {
        shortLabel: 'Step 2',
        label: 'Future Planning',
        section: this.createFuturePlanSection()
      }
    ];

    $.each(steps, function (index, step) {
      var $button = $('<button>', {
        'type': 'button',
        'class': 'h5p-debt-action-planner__step',
        'role': 'tab',
        'text': step.shortLabel + ': ' + step.label,
        'aria-selected': 'false'
      }).on('click', function () {
        self.goToStep(index, false);
      });

      self.$stepButtons.push($button);
      $nav.append($button);

      self.$sections.push(step.section);
      $root.append(step.section);
    });

    return $root;
  };

  /**
   * Create the action plan screen.
   *
   * @returns {jQuery} Section.
   */
  DebtActionPlanner.prototype.createActionPlanSection = function () {
    var self = this;
    var rowCount = Math.max(1, Math.min(9, parseInt(this.params.rowCount, 10) || 9));

    var $section = $('<section>', {
      'class': 'h5p-debt-action-planner__section',
      'data-step-index': 0
    });

    $('<p>', {
      'class': 'h5p-debt-action-planner__kicker',
      'text': 'Step 1'
    }).appendTo($section);

    $('<h2>', {
      'class': 'h5p-debt-action-planner__title',
      'text': this.params.actionPlanTitle,
      'tabindex': '-1'
    }).appendTo($section);

    $('<p>', {
      'class': 'h5p-debt-action-planner__intro',
      'text': this.params.actionPlanIntro
    }).appendTo($section);

    var $tableWrap = $('<div>', {
      'class': 'h5p-debt-action-planner__table-wrap'
    }).appendTo($section);

    var $table = $('<table>', {
      'class': 'h5p-debt-action-planner__table'
    }).appendTo($tableWrap);

    var $thead = $('<thead>').appendTo($table);
    var $headRow = $('<tr>').appendTo($thead);
    $.each([
      '#',
      'Which Monthly Debt?',
      'Payment Option: When Will It Be Paid Off?',
      'How Will It Be Paid Off?'
    ], function (_, heading) {
      $('<th>', {
        'scope': 'col',
        'text': heading
      }).appendTo($headRow);
    });

    var $tbody = $('<tbody>').appendTo($table);

    for (var i = 0; i < rowCount; i++) {
      var rowNumber = i + 1;
      var $row = $('<tr>').appendTo($tbody);

      $('<th>', {
        'scope': 'row',
        'text': rowNumber
      }).appendTo($row);

      var $debtInput = this.createInput('text', 'Which monthly debt row ' + rowNumber);
      var $payoffInput = this.createInput('text', 'Payment option and payoff date row ' + rowNumber);
      var $howInput = $('<textarea>', {
        'class': 'h5p-debt-action-planner__textarea',
        'rows': 3,
        'aria-label': 'How will it be paid off row ' + rowNumber
      });

      $('<td>').append($debtInput).appendTo($row);
      $('<td>').append($payoffInput).appendTo($row);
      $('<td>').append($howInput).appendTo($row);

      this.actionInputs.push({
        debt: $debtInput,
        payoff: $payoffInput,
        how: $howInput
      });
    }

    var $actions = $('<div>', {
      'class': 'h5p-debt-action-planner__actions'
    }).appendTo($section);

    $('<button>', {
      'type': 'button',
      'class': 'h5p-debt-action-planner__button h5p-debt-action-planner__button--primary',
      'text': 'Continue to Future Planning'
    }).on('click', function () {
      self.goToStep(1, false);
    }).appendTo($actions);

    return $section;
  };

  /**
   * Create the future planning screen.
   *
   * @returns {jQuery} Section.
   */
  DebtActionPlanner.prototype.createFuturePlanSection = function () {
    var self = this;
    var $section = $('<section>', {
      'class': 'h5p-debt-action-planner__section',
      'data-step-index': 1
    });

    $('<p>', {
      'class': 'h5p-debt-action-planner__kicker',
      'text': 'Step 2'
    }).appendTo($section);

    $('<h2>', {
      'class': 'h5p-debt-action-planner__title',
      'text': this.params.futureTitle,
      'tabindex': '-1'
    }).appendTo($section);

    $('<p>', {
      'class': 'h5p-debt-action-planner__intro',
      'text': this.params.futureIntro
    }).appendTo($section);

    var prompts = [
      {
        key: 'oneYearHopeful',
        label: this.params.futurePrompts.oneYearHopeful
      },
      {
        key: 'oneYearRealistic',
        label: this.params.futurePrompts.oneYearRealistic
      },
      {
        key: 'threeYearHopeful',
        label: this.params.futurePrompts.threeYearHopeful
      },
      {
        key: 'threeYearRealistic',
        label: this.params.futurePrompts.threeYearRealistic
      }
    ];

    $.each(prompts, function (_, prompt) {
      var inputId = 'h5p-debt-action-planner-' + self.contentId + '-' + prompt.key;
      var $row = $('<div>', {
        'class': 'h5p-debt-action-planner__prompt'
      }).appendTo($section);

      $('<label>', {
        'for': inputId,
        'class': 'h5p-debt-action-planner__label',
        'text': prompt.label
      }).appendTo($row);

      var $money = $('<div>', {
        'class': 'h5p-debt-action-planner__money'
      }).appendTo($row);

      $('<span>', {
        'class': 'h5p-debt-action-planner__currency',
        'text': '$',
        'aria-hidden': 'true'
      }).appendTo($money);

      var $input = self.createInput('text', prompt.label);
      $input.attr({
        'id': inputId,
        'inputmode': 'decimal'
      });
      $money.append($input);
      self.futureInputs[prompt.key] = $input;
    });

    $('<p>', {
      'class': 'h5p-debt-action-planner__note',
      'text': this.params.closingNote
    }).appendTo($section);

    var $actions = $('<div>', {
      'class': 'h5p-debt-action-planner__actions'
    }).appendTo($section);

    $('<button>', {
      'type': 'button',
      'class': 'h5p-debt-action-planner__button',
      'text': 'Back to Action Plan'
    }).on('click', function () {
      self.goToStep(0, false);
    }).appendTo($actions);

    return $section;
  };

  /**
   * Create a standard input.
   *
   * @param {string} type Input type.
   * @param {string} ariaLabel Label for accessibility.
   * @returns {jQuery} Input element.
   */
  DebtActionPlanner.prototype.createInput = function (type, ariaLabel) {
    return $('<input>', {
      'type': type,
      'class': 'h5p-debt-action-planner__input',
      'autocomplete': 'off',
      'aria-label': ariaLabel
    });
  };

  /**
   * Switch between the two planner steps.
   *
   * @param {number} index Step index.
   * @param {boolean} skipFocus When true, do not focus the section heading.
   */
  DebtActionPlanner.prototype.goToStep = function (index, skipFocus) {
    this.activeStep = Math.max(0, Math.min(1, index));

    for (var i = 0; i < this.$sections.length; i++) {
      var isActive = i === this.activeStep;

      this.$sections[i].toggleClass('h5p-debt-action-planner__section--active', isActive);
      this.$sections[i].attr('hidden', isActive ? null : 'hidden');

      this.$stepButtons[i]
        .toggleClass('h5p-debt-action-planner__step--active', isActive)
        .attr('aria-selected', isActive ? 'true' : 'false');
    }

    if (!skipFocus) {
      this.$sections[this.activeStep].find('.h5p-debt-action-planner__title').focus();
    }

    this.trigger('resize');
  };

  /**
   * Restore learner-entered state.
   *
   * @param {object} previousState Previous state payload.
   */
  DebtActionPlanner.prototype.setState = function (previousState) {
    previousState = previousState || {};

    if (previousState.actionRows && previousState.actionRows.length) {
      for (var i = 0; i < this.actionInputs.length; i++) {
        var rowState = previousState.actionRows[i] || {};
        this.actionInputs[i].debt.val(rowState.debt || '');
        this.actionInputs[i].payoff.val(rowState.payoff || '');
        this.actionInputs[i].how.val(rowState.how || '');
      }
    }

    if (previousState.futureFields) {
      this.futureInputs.oneYearHopeful.val(previousState.futureFields.oneYearHopeful || '');
      this.futureInputs.oneYearRealistic.val(previousState.futureFields.oneYearRealistic || '');
      this.futureInputs.threeYearHopeful.val(previousState.futureFields.threeYearHopeful || '');
      this.futureInputs.threeYearRealistic.val(previousState.futureFields.threeYearRealistic || '');
    }
  };

  /**
   * Return current learner-entered state for H5P persistence.
   *
   * @returns {object} Current state.
   */
  DebtActionPlanner.prototype.getCurrentState = function () {
    var actionRows = [];

    for (var i = 0; i < this.actionInputs.length; i++) {
      actionRows.push({
        debt: this.actionInputs[i].debt.val(),
        payoff: this.actionInputs[i].payoff.val(),
        how: this.actionInputs[i].how.val()
      });
    }

    return {
      activeStep: this.activeStep,
      actionRows: actionRows,
      futureFields: {
        oneYearHopeful: this.futureInputs.oneYearHopeful.val(),
        oneYearRealistic: this.futureInputs.oneYearRealistic.val(),
        threeYearHopeful: this.futureInputs.threeYearHopeful.val(),
        threeYearRealistic: this.futureInputs.threeYearRealistic.val()
      }
    };
  };

  return DebtActionPlanner;
})(H5P.jQuery);
