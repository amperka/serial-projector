$(function() {
    $('.btn-code').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#code').toggle(0);
    });

    $('#code').click(function(e) {
        e.stopPropagation();
    });

    $('body').click(function() {
        $('#code').hide();
    });
});