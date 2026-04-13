(function () {
  H5P.WorkbenchPlaceholder = function (params) {
    this.params = H5P.jQuery.extend(
      true,
      {
        message: 'Workbench scaffold placeholder'
      },
      params
    );
  };

  H5P.WorkbenchPlaceholder.prototype.attach = function ($container) {
    $container.empty();
    $container.text(this.params.message);
  };
})();
