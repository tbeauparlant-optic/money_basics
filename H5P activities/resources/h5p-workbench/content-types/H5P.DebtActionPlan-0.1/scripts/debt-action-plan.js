var H5P = H5P || {};

H5P.DebtActionPlan = (function ($) {
  function DebtActionPlan(params, contentId, contentData) {
    H5P.EventDispatcher.call(this);

    this.contentId = contentId;
    this.contentData = contentData || {};
    this.previousState = this.contentData.previousState || {};

    this.params = $.extend(true, {}, {
      title: 'Action Plan for Getting Out of Debt',
      intro: 'Write your plan in plain language. Fill in the rows that make sense for you.',
      rowCount: 9,
      closingNote: 'Keep the plan specific enough that you can return to it later.'
    }, params);

    this.inputs = [];
  }

  DebtActionPlan.prototype = Object.create(H5P.EventDispatcher.prototype);
  DebtActionPlan.prototype.constructor = DebtActionPlan;

  DebtActionPlan.prototype.attach = function ($container) {
    if (!this.$root) {
      this.$root = this.buildContent();
    }

    $container.empty().append(this.$root);
    this.setState(this.previousState);
    this.trigger('resize');
  };

  DebtActionPlan.prototype.buildContent = function () {
    var rowCount = Math.max(1, Math.min(9, parseInt(this.params.rowCount, 10) || 9));
    var $root = $('<section>', {
      'class': 'h5p-debt-action-plan'
    });

    $('<h2>', {
      'class': 'h5p-debt-action-plan__title',
      'text': this.params.title
    }).appendTo($root);

    $('<p>', {
      'class': 'h5p-debt-action-plan__intro',
      'text': this.params.intro
    }).appendTo($root);

    var $tableWrap = $('<div>', {
      'class': 'h5p-debt-action-plan__table-wrap'
    }).appendTo($root);

    var $table = $('<table>', {
      'class': 'h5p-debt-action-plan__table'
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

      var $debt = this.createInput('Which monthly debt row ' + rowNumber);
      var $payoff = this.createInput('Payment option and payoff date row ' + rowNumber);
      var $how = $('<textarea>', {
        'class': 'h5p-debt-action-plan__textarea',
        'rows': 3,
        'aria-label': 'How will it be paid off row ' + rowNumber
      });

      $('<td>').append($debt).appendTo($row);
      $('<td>').append($payoff).appendTo($row);
      $('<td>').append($how).appendTo($row);

      this.inputs.push({
        debt: $debt,
        payoff: $payoff,
        how: $how
      });
    }

    $('<p>', {
      'class': 'h5p-debt-action-plan__note',
      'text': this.params.closingNote
    }).appendTo($root);

    return $root;
  };

  DebtActionPlan.prototype.createInput = function (ariaLabel) {
    return $('<input>', {
      'type': 'text',
      'class': 'h5p-debt-action-plan__input',
      'autocomplete': 'off',
      'aria-label': ariaLabel
    });
  };

  DebtActionPlan.prototype.setState = function (previousState) {
    previousState = previousState || {};

    if (!previousState.rows || !previousState.rows.length) {
      return;
    }

    for (var i = 0; i < this.inputs.length; i++) {
      var rowState = previousState.rows[i] || {};
      this.inputs[i].debt.val(rowState.debt || '');
      this.inputs[i].payoff.val(rowState.payoff || '');
      this.inputs[i].how.val(rowState.how || '');
    }
  };

  DebtActionPlan.prototype.getCurrentState = function () {
    var rows = [];

    for (var i = 0; i < this.inputs.length; i++) {
      rows.push({
        debt: this.inputs[i].debt.val(),
        payoff: this.inputs[i].payoff.val(),
        how: this.inputs[i].how.val()
      });
    }

    return {
      rows: rows
    };
  };

  return DebtActionPlan;
})(H5P.jQuery);
