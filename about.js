
$(function() {
    $('.btn-about').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#about').toggle(0);
    });

    $('#about').click(function(e) {
        e.stopPropagation();
    });

    $('body').click(function() {
        $('#about').hide();
    });
});
