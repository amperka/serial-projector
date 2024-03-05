/* Copyright (c) 2015, Amperka LLC
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

function setBackgroundColor(val) {
    $('body').css('background-color', val);

    val = val.replace(/[^0-9a-f]/gi, '');
	if (val.length < 6) {
		val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
	}

    var max = 0;
    var min = 255;

	for (var i = 0; i < 3; i++) {
		var c = parseInt(val.substr(i*2, 2), 16);
        max = c > max ? c : max;
        min = c < min ? c : min;
	}

    var lum = (min + max) / 2;

    if (lum < 128) {
        $('#menu').addClass('light');
    } else {
        $('#menu').removeClass('light');
    }
}

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
                setBackgroundColor(val);
                break;
        }
    });

    $('#apply-settings').click(function(e) {
        e.preventDefault();
        $('#settings').hide();
    });

    $('.btn-settings').click(function(e) {
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
