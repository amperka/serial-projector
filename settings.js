
$(function() {
    $('#settings input').change(function(e) {
        var name = $(this).attr('name');
        var val = $(this).val();
        switch (name) {
            case 'font-size':
                $('h1').css('font-size', val + 'vw');
                break;

            case 'text-color':
                $('h1').css('color', val);
                break;

            case 'bg-color':
                $('body').css('background-color', val);
                break;
        }
    });

    $('#apply-settings').click(function(e) {
        e.preventDefault();
        $('#settings').hide();
    });

    $('.invoke-settings').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#settings').toggle(0);
    });

    $('#settings').click(function(e) {
        e.stopPropagation();
    });

    $('body').click(function() {
        $('#settings').hide();
    });

    $('#settings input').each(function() {
        $(this).change();
    });
});
