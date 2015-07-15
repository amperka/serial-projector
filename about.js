/* Copyright (c) 2015, Amperka LLC
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

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
