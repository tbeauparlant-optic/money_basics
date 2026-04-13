var H5P = H5P || {};

H5P.DebtFuturePlan = (function ($) {
  function DebtFuturePlan(params, contentId, contentData) {
    H5P.EventDispatcher.call(this);

    this.contentId = contentId;
    this.contentData = contentData || {};
    this.previousState = this.contentData.previousState || {};

    this.params = $.extend(true, {}, {
      title: 'Planning for the Future',
      intro: 'Think in hopeful numbers and realistic numbers.',
      prompts: {
        oneYearHopeful: 'One year from now, I would like to reduce my debt by:',
        oneYearRealistic: 'One year from now, I realistically think I can reduce my debt by:',
        threeYearHopeful: 'Three years from now, I would like to reduce my debt by:',
        threeYearRealistic: 'Three years from now, I realistically think I can reduce my debt by:'
      },
      closingNote: 'Your answers here can help you decide which debts to focus on first.'
    }, params);

    this.inputs = {};
  }

  DebtFuturePlan.prototype = Object.create(H5P.EventDispatcher.prototype);
  DebtFuturePlan.prototype.constructor = DebtFuturePlan;

  DebtFuturePlan.prototype.attach = function ($container) {
    if (!this.$root) {
      this.$root = this.buildContent();
    }

    $container.empty().append(this.$root);
    this.setState(this.previousState);
    this.trigger('resize');
  };

  DebtFuturePlan.prototype.buildContent = function () {
    var self = this;
    var $root = $('<section>', {
      'class': 'h5p-debt-future-plan'
    });

    $('<h2>', {
      'class': 'h5p-debt-future-plan__title',
      'text': this.params.title
    }).appendTo($root);

    $('<p>', {
      'class': 'h5p-debt-future-plan__intro',
      'text': this.params.intro
    }).appendTo($root);

    var prompts = [
      {
        key: 'oneYearHopeful',
        label: this.params.prompts.oneYearHopeful
      },
      {
        key: 'oneYearRealistic',
        label: this.params.prompts.oneYearRealistic
      },
      {
        key: 'threeYearHopeful',
        label: this.params.prompts.threeYearHopeful
      },
      {
        key: 'threeYearRealistic',
        label: this.params.prompts.threeYearRealistic
      }
    ];

    $.each(prompts, function (_, prompt) {
      var inputId = 'h5p-debt-future-plan-' + self.contentId + '-' + prompt.key;
      var $row = $('<div>', {
        'class': 'h5p-debt-future-plan__prompt'
      }).appendTo($root);

      $('<label>', {
        'for': inputId,
        'class': 'h5p-debt-future-plan__label',
        'text': prompt.label
      }).appendTo($row);

      var $money = $('<div>', {
        'class': 'h5p-debt-future-plan__money'
      }).appendTo($row);

      $('<span>', {
        'class': 'h5p-debt-future-plan__currency',
        'text': '$',
        'aria-hidden': 'true'
      }).appendTo($money);

      var $input = $('<input>', {
        'type': 'text',
        'class': 'h5p-debt-future-plan__input',
        'id': inputId,
        'inputmode': 'decimal',
        'autocomplete': 'off',
        'aria-label': prompt.label
      }).appendTo($money);

      self.inputs[prompt.key] = $input;
    });

    $('<p>', {
      'class': 'h5p-debt-future-plan__note',
      'text': this.params.closingNote
    }).appendTo($root);

    return $root;
  };

  DebtFuturePlan.prototype.setState = function (previousState) {
    previousState = previousState || {};

    this.inputs.oneYearHopeful.val(previousState.oneYearHopeful || '');
    this.inputs.oneYearRealistic.val(previousState.oneYearRealistic || '');
    this.inputs.threeYearHopeful.val(previousState.threeYearHopeful || '');
    this.inputs.threeYearRealistic.val(previousState.threeYearRealistic || '');
  };

  DebtFuturePlan.prototype.getCurrentState = function () {
    return {
      oneYearHopeful: this.inputs.oneYearHopeful.val(),
      oneYearRealistic: this.inputs.oneYearRealistic.val(),
      threeYearHopeful: this.inputs.threeYearHopeful.val(),
      threeYearRealistic: this.inputs.threeYearRealistic.val()
    };
  };

  return DebtFuturePlan;
})(H5P.jQuery);
