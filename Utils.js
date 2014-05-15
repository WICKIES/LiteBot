module.exports = {
    secondsToTime: function(seconds) {
        var b = a % 60,
            c = Math.floor(a / 36E2),
            d = Math.floor(a / 864E2);
        if (a < 36E2)
            return (a / 60 < 10 ? '0' : '') + Math.floor(a / 60) + ':' + (b < 10 ? '0' : '') + Math.floor(b) + ' minutes';
        a -= c * 36E2;
        b = a % 60;
        c -= d * 24;
        return (d > 0 ? d + ' day' + (d === 1 ? '' : 's') + ' and ' : '') + (c < 10 ? '0' : '') + Math.floor(c) + ':' + (a / 60 < 10 ? '0' : '') + Math.floor(a / 60) + ':' + (b < 10 ? '0' : '') + Math.floor(b) + ' hours';
    }
};