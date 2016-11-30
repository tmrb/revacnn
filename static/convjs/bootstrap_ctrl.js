$(document).ready(function(){
    control_panel();
});

var control_panel = function() {
    // $('.panel-heading span.clickable').on("click", function (e) {
  $('.panel-heading').on("click", function () {
    console.log('onClick');
    if ($(this).hasClass('panel-collapsed')) {
        // expand the panel
        $(this).parents('.panel').find('.panel-body').slideDown();
        $(this).removeClass('panel-collapsed');
        $(this).find('i').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
    }
    else {
        // collapse the panel
        $(this).parents('.panel').find('.panel-body').slideUp();
        $(this).addClass('panel-collapsed');
        $(this).find('i').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
    }
  });
}
