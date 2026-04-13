var H5P = H5P || {};

H5P.CrisisPlanning = (function ($) {
  function CrisisPlanning(params, contentId, contentData) {
    H5P.EventDispatcher.call(this);

    this.contentId = contentId;
    this.contentData = contentData || {};
    this.previousState = this.contentData.previousState || {};

    this.params = $.extend(true, {}, {
      title: 'Financial Crisis Planning',
      scaleLabels: {
        option1: 'Never',
        option2: 'Rarely',
        option3: 'Sometimes',
        option4: 'Often'
      },
      financialWorksheet: {
        heading: 'How Financial Issues Affect Me',
        statementColumnLabel: 'Statement',
        statementsText: 'I experience anxiety.\nMy sleep is interrupted.\nI feel hopeless.\nI can\'t purchase needed medication or access services.\nI can\'t buy the things I want.\nI do without necessities.\nI feel ashamed.\nI worry about my future.\nMy relationship with my partner is strained.\nI dread (or avoid) opening mail or answering the phone.\nI feel out of control with my spending.\nI have to work more than I would like just to pay my bills.\nI can\'t go out with my friends or take a vacation.\nI feel powerless over my finances.'
      },
      healthWorksheet: {
        heading: 'How Mental Health, Addiction, Treatment, and/or Physical Health Issues Affect My Finances',
        statementColumnLabel: 'Statement',
        statementsText: 'Important bills don\'t get paid on time.\nI go on rampant spending sprees.\nI spend money I can\'t really afford on unnecessary things.\nI avoid opening my mail.\nI have a hard time writing and signing checks.\nI have a hard time using ATMs or debit card machines.\nI let my finances go unchecked.\nI can\'t physically access my finances.\nI lose important financial documents.\nI stop caring about keeping a budget and start making poor financial choices.\nI sabotage my own financial situation.'
      },
      whenExperienceWorksheet: {
        heading: 'When I do or experience this, I will do this instead',
        numberHeader: '#',
        triggerHeader: 'What happens',
        alternativeHeader: 'What I will do instead'
      },
      ratherThanWorksheet: {
        heading: 'Rather than doing this, I will do this instead',
        numberHeader: '#',
        triggerHeader: 'What happens',
        alternativeHeader: 'What I will do instead'
      },
      replacementRowCount: 5,
      expensesWorksheet: {
        heading: 'Monthly Expenses and Due Dates',
        numberHeader: '#',
        expenseHeader: 'Expense or bill',
        amountHeader: 'Amount',
        dueHeader: 'Due date or timing'
      },
      expenseRowCount: 8,
      supportWorksheet: {
        heading: 'Trusted Support Person',
        nameLabel: 'Trusted person',
        relationshipLabel: 'Relationship to me',
        contactLabel: 'Best way to contact them',
        helpLabel: 'How this person can help me during a financial crisis',
        payeeRightsLabel: 'Representative payee rights, questions, or reminders'
      }
    }, params);

    this.scaleOptions = this.getScaleOptions(this.params.scaleLabels);

    this.scaleInputs = {
      financialEffects: [],
      healthEffects: []
    };
    this.replacementInputs = {
      whenExperience: [],
      ratherThan: []
    };
    this.expenseInputs = [];
    this.supportInputs = {};
  }

  CrisisPlanning.prototype = Object.create(H5P.EventDispatcher.prototype);
  CrisisPlanning.prototype.constructor = CrisisPlanning;

  CrisisPlanning.prototype.attach = function ($container) {
    if (!this.$root) {
      this.$root = this.buildContent();
    }

    $container.empty().append(this.$root);
    this.setState(this.previousState);
    this.trigger('resize');
  };

  CrisisPlanning.prototype.getScaleOptions = function (labels) {
    var values = [];
    var candidates = [
      labels.option1,
      labels.option2,
      labels.option3,
      labels.option4
    ];

    for (var i = 0; i < candidates.length; i++) {
      if (typeof candidates[i] === 'string' && candidates[i].trim() !== '') {
        values.push(candidates[i]);
      }
    }

    return values.length ? values : ['Never', 'Rarely', 'Sometimes', 'Often'];
  };

  CrisisPlanning.prototype.getStatementLines = function (text) {
    var lines = String(text || '').split(/\r?\n/);
    var values = [];

    for (var i = 0; i < lines.length; i++) {
      var trimmed = lines[i].trim();
      if (trimmed !== '') {
        values.push(trimmed);
      }
    }

    return values;
  };

  CrisisPlanning.prototype.buildContent = function () {
    var self = this;
    var replacementRowCount = Math.max(2, Math.min(10, parseInt(this.params.replacementRowCount, 10) || 5));
    var expenseRowCount = Math.max(3, Math.min(15, parseInt(this.params.expenseRowCount, 10) || 8));
    var $root = $('<section>', {
      'class': 'h5p-crisis-planning'
    });

    $('<h2>', {
      'class': 'h5p-crisis-planning__title',
      'text': this.params.title
    }).appendTo($root);

    this.buildScaleTable(
      $root,
      this.params.financialWorksheet.heading,
      this.params.financialWorksheet.statementColumnLabel,
      'financialEffects',
      this.getStatementLines(this.params.financialWorksheet.statementsText)
    );

    this.buildScaleTable(
      $root,
      this.params.healthWorksheet.heading,
      this.params.healthWorksheet.statementColumnLabel,
      'healthEffects',
      this.getStatementLines(this.params.healthWorksheet.statementsText)
    );

    this.buildReplacementTable(
      $root,
      this.params.whenExperienceWorksheet,
      'whenExperience',
      replacementRowCount
    );

    this.buildReplacementTable(
      $root,
      this.params.ratherThanWorksheet,
      'ratherThan',
      replacementRowCount
    );

    this.buildExpenseTable($root, this.params.expensesWorksheet, expenseRowCount);

    var $supportSection = $('<section>', {
      'class': 'h5p-crisis-planning__worksheet'
    }).appendTo($root);

    $('<h3>', {
      'class': 'h5p-crisis-planning__worksheet-title',
      'text': this.params.supportWorksheet.heading
    }).appendTo($supportSection);

    $.each([
      { key: 'name', label: this.params.supportWorksheet.nameLabel },
      { key: 'relationship', label: this.params.supportWorksheet.relationshipLabel },
      { key: 'contact', label: this.params.supportWorksheet.contactLabel }
    ], function (_, field) {
      self.supportInputs[field.key] = self.appendLabeledInput($supportSection, field.label, 'text');
    });

    this.supportInputs.help = this.appendLabeledTextarea(
      $supportSection,
      this.params.supportWorksheet.helpLabel
    );

    this.supportInputs.payeeRights = this.appendLabeledTextarea(
      $supportSection,
      this.params.supportWorksheet.payeeRightsLabel
    );

    return $root;
  };

  CrisisPlanning.prototype.buildScaleTable = function ($section, heading, statementColumnLabel, stateKey, items) {
    var self = this;
    var $worksheet = $('<section>', {
      'class': 'h5p-crisis-planning__worksheet'
    }).appendTo($section);

    $('<h3>', {
      'class': 'h5p-crisis-planning__worksheet-title',
      'text': heading
    }).appendTo($worksheet);

    var $tableWrap = $('<div>', {
      'class': 'h5p-crisis-planning__table-wrap'
    }).appendTo($worksheet);

    var $table = $('<table>', {
      'class': 'h5p-crisis-planning__table h5p-crisis-planning__table--scale'
    }).appendTo($tableWrap);

    var $headRow = $('<tr>').appendTo($('<thead>').appendTo($table));
    $('<th>', {
      'scope': 'col',
      'text': statementColumnLabel
    }).appendTo($headRow);

    $.each(this.scaleOptions, function (_, option) {
      $('<th>', {
        'scope': 'col',
        'text': option
      }).appendTo($headRow);
    });

    var $tbody = $('<tbody>').appendTo($table);

    $.each(items, function (itemIndex, item) {
      var groupName = 'h5p-crisis-' + self.contentId + '-' + stateKey + '-' + itemIndex;
      var $row = $('<tr>').appendTo($tbody);

      $('<th>', {
        'scope': 'row',
        'text': item
      }).appendTo($row);

      self.scaleInputs[stateKey][itemIndex] = {};

      $.each(self.scaleOptions, function (_, option) {
        var inputId = groupName + '-' + option.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        var $cell = $('<td>').appendTo($row);
        var $label = $('<label>', {
          'class': 'h5p-crisis-planning__choice',
          'for': inputId
        }).appendTo($cell);

        var $radio = $('<input>', {
          'type': 'radio',
          'name': groupName,
          'id': inputId,
          'value': option,
          'aria-label': item + ' ' + option
        }).appendTo($label);

        $('<span>', {
          'text': option
        }).appendTo($label);

        self.scaleInputs[stateKey][itemIndex][option] = $radio;
      });
    });
  };

  CrisisPlanning.prototype.buildReplacementTable = function ($section, worksheet, stateKey, rowCount) {
    var $worksheet = $('<section>', {
      'class': 'h5p-crisis-planning__worksheet'
    }).appendTo($section);

    $('<h3>', {
      'class': 'h5p-crisis-planning__worksheet-title',
      'text': worksheet.heading
    }).appendTo($worksheet);

    var $tableWrap = $('<div>', {
      'class': 'h5p-crisis-planning__table-wrap'
    }).appendTo($worksheet);

    var $table = $('<table>', {
      'class': 'h5p-crisis-planning__table'
    }).appendTo($tableWrap);

    var $headRow = $('<tr>').appendTo($('<thead>').appendTo($table));

    $.each([
      worksheet.numberHeader,
      worksheet.triggerHeader,
      worksheet.alternativeHeader
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

      var $trigger = $('<textarea>', {
        'class': 'h5p-crisis-planning__textarea',
        'rows': 3,
        'aria-label': worksheet.heading + ' ' + worksheet.triggerHeader + ' ' + rowNumber
      });
      var $alternative = $('<textarea>', {
        'class': 'h5p-crisis-planning__textarea',
        'rows': 3,
        'aria-label': worksheet.heading + ' ' + worksheet.alternativeHeader + ' ' + rowNumber
      });

      $('<td>').append($trigger).appendTo($row);
      $('<td>').append($alternative).appendTo($row);

      this.replacementInputs[stateKey].push({
        trigger: $trigger,
        alternative: $alternative
      });
    }
  };

  CrisisPlanning.prototype.buildExpenseTable = function ($section, worksheet, rowCount) {
    var $worksheet = $('<section>', {
      'class': 'h5p-crisis-planning__worksheet'
    }).appendTo($section);

    $('<h3>', {
      'class': 'h5p-crisis-planning__worksheet-title',
      'text': worksheet.heading
    }).appendTo($worksheet);

    var $tableWrap = $('<div>', {
      'class': 'h5p-crisis-planning__table-wrap'
    }).appendTo($worksheet);

    var $table = $('<table>', {
      'class': 'h5p-crisis-planning__table'
    }).appendTo($tableWrap);

    var $headRow = $('<tr>').appendTo($('<thead>').appendTo($table));

    $.each([
      worksheet.numberHeader,
      worksheet.expenseHeader,
      worksheet.amountHeader,
      worksheet.dueHeader
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

      var $expense = $('<input>', {
        'type': 'text',
        'class': 'h5p-crisis-planning__input',
        'autocomplete': 'off',
        'aria-label': worksheet.expenseHeader + ' ' + rowNumber
      });
      var $amount = $('<input>', {
        'type': 'text',
        'class': 'h5p-crisis-planning__input',
        'inputmode': 'decimal',
        'autocomplete': 'off',
        'aria-label': worksheet.amountHeader + ' ' + rowNumber
      });
      var $due = $('<input>', {
        'type': 'text',
        'class': 'h5p-crisis-planning__input',
        'autocomplete': 'off',
        'aria-label': worksheet.dueHeader + ' ' + rowNumber
      });

      $('<td>').append($expense).appendTo($row);
      $('<td>').append($amount).appendTo($row);
      $('<td>').append($due).appendTo($row);

      this.expenseInputs.push({
        expense: $expense,
        amount: $amount,
        due: $due
      });
    }
  };

  CrisisPlanning.prototype.appendLabeledInput = function ($section, labelText, inputType) {
    var inputId = 'h5p-crisis-' + this.contentId + '-' + labelText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    var $field = $('<div>', {
      'class': 'h5p-crisis-planning__field'
    }).appendTo($section);

    $('<label>', {
      'class': 'h5p-crisis-planning__field-label',
      'for': inputId,
      'text': labelText
    }).appendTo($field);

    return $('<input>', {
      'type': inputType,
      'id': inputId,
      'class': 'h5p-crisis-planning__input',
      'autocomplete': 'off',
      'aria-label': labelText
    }).appendTo($field);
  };

  CrisisPlanning.prototype.appendLabeledTextarea = function ($section, labelText) {
    var inputId = 'h5p-crisis-' + this.contentId + '-' + labelText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    var $field = $('<div>', {
      'class': 'h5p-crisis-planning__field'
    }).appendTo($section);

    $('<label>', {
      'class': 'h5p-crisis-planning__field-label',
      'for': inputId,
      'text': labelText
    }).appendTo($field);

    return $('<textarea>', {
      'id': inputId,
      'class': 'h5p-crisis-planning__textarea',
      'rows': 4,
      'aria-label': labelText
    }).appendTo($field);
  };

  CrisisPlanning.prototype.setScaleState = function (stateKey, savedValues) {
    savedValues = savedValues || [];

    for (var i = 0; i < this.scaleInputs[stateKey].length; i++) {
      var selected = savedValues[i] || '';
      if (selected && this.scaleInputs[stateKey][i][selected]) {
        this.scaleInputs[stateKey][i][selected].prop('checked', true);
      }
    }
  };

  CrisisPlanning.prototype.setReplacementState = function (stateKey, savedRows) {
    savedRows = savedRows || [];

    for (var i = 0; i < this.replacementInputs[stateKey].length; i++) {
      var savedRow = savedRows[i] || {};
      this.replacementInputs[stateKey][i].trigger.val(savedRow.trigger || '');
      this.replacementInputs[stateKey][i].alternative.val(savedRow.alternative || '');
    }
  };

  CrisisPlanning.prototype.setExpenseState = function (savedRows) {
    savedRows = savedRows || [];

    for (var i = 0; i < this.expenseInputs.length; i++) {
      var savedRow = savedRows[i] || {};
      this.expenseInputs[i].expense.val(savedRow.expense || '');
      this.expenseInputs[i].amount.val(savedRow.amount || '');
      this.expenseInputs[i].due.val(savedRow.due || '');
    }
  };

  CrisisPlanning.prototype.setState = function (previousState) {
    previousState = previousState || {};

    this.setScaleState('financialEffects', previousState.financialEffects);
    this.setScaleState('healthEffects', previousState.healthEffects);
    this.setReplacementState('whenExperience', previousState.whenExperienceRows);
    this.setReplacementState('ratherThan', previousState.ratherThanRows);
    this.setExpenseState(previousState.expenseRows);

    this.supportInputs.name.val(previousState.supportName || '');
    this.supportInputs.relationship.val(previousState.supportRelationship || '');
    this.supportInputs.contact.val(previousState.supportContact || '');
    this.supportInputs.help.val(previousState.supportHelp || '');
    this.supportInputs.payeeRights.val(previousState.payeeRights || '');
  };

  CrisisPlanning.prototype.getScaleState = function (stateKey) {
    var values = [];

    for (var i = 0; i < this.scaleInputs[stateKey].length; i++) {
      var selected = '';

      for (var optionIndex = 0; optionIndex < this.scaleOptions.length; optionIndex++) {
        var option = this.scaleOptions[optionIndex];
        if (this.scaleInputs[stateKey][i][option].is(':checked')) {
          selected = option;
          break;
        }
      }

      values.push(selected);
    }

    return values;
  };

  CrisisPlanning.prototype.getReplacementState = function (stateKey) {
    var rows = [];

    for (var i = 0; i < this.replacementInputs[stateKey].length; i++) {
      rows.push({
        trigger: this.replacementInputs[stateKey][i].trigger.val(),
        alternative: this.replacementInputs[stateKey][i].alternative.val()
      });
    }

    return rows;
  };

  CrisisPlanning.prototype.getExpenseState = function () {
    var rows = [];

    for (var i = 0; i < this.expenseInputs.length; i++) {
      rows.push({
        expense: this.expenseInputs[i].expense.val(),
        amount: this.expenseInputs[i].amount.val(),
        due: this.expenseInputs[i].due.val()
      });
    }

    return rows;
  };

  CrisisPlanning.prototype.getCurrentState = function () {
    return {
      financialEffects: this.getScaleState('financialEffects'),
      healthEffects: this.getScaleState('healthEffects'),
      whenExperienceRows: this.getReplacementState('whenExperience'),
      ratherThanRows: this.getReplacementState('ratherThan'),
      expenseRows: this.getExpenseState(),
      supportName: this.supportInputs.name.val(),
      supportRelationship: this.supportInputs.relationship.val(),
      supportContact: this.supportInputs.contact.val(),
      supportHelp: this.supportInputs.help.val(),
      payeeRights: this.supportInputs.payeeRights.val()
    };
  };

  return CrisisPlanning;
})(H5P.jQuery);
