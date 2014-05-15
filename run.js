var plugAPI = require('plugapi');
var Utils = require('./Utils.js');
var config = require('./config.json');
var bot = new plugAPI(config.auth);
var lastCommand = {};
var startupTime = Date.now();

bot.connect(config.room);
bot.preCommandHandler = function(data) {
    if (lastCommand[data.fromID] !== undefined) {
        if (lastCommand[data.fromID] > Date.now() - 2e3)
            return false;
    }
    lastCommand[data.fromID] = Date.now();
    return true;
};

bot.on(plugAPI.messageTypes.ROOM_JOIN, function(roomName) {
    bot.log('Joined Room', roomName);
}).on('command:shutdown', function(data) {
    data.havePermission(bot.ROLE.COHOST, function() {
        bot.close();
        process.exit(0);
    });
}).on('command:move', function(data) {
    data.havePermission(bot.ROLE.MANAGER, function() {
        if (data.args.length > 2) {
            var userID = data.args[0].id;
            if (userID !== undefined) {
                var pos = ~~data.args[1];
                if (!isNaN(pos) && pos > 0 && pos < 50) {
                    bot.moderateMoveDJ(userID, pos);
                } else bot.sendChat('Missing position');
            } else bot.sendChat('Missing user');
        } else bot.sendChat('Missing parameters');
    });
}).on('command:skip', function(data) {
    if (bot.getDJ() === null) return;
    data.havePermission(bot.ROLE.BOUNCER, function() {
        bot.moderateForceSkip();
    });
}).on('command:lockskip', function(data) {
    if (bot.getDJ() === null) return;
    data.havePermission(bot.ROLE.MANAGER, function() {
        var userID = bot.getDJ().id;
        var executeSkip = function() {
            bot.moderateForceSkip(function() {
                bot.moderateLockBooth(false, false, function() {
                    bot.moderateMoveDJ(userID, 1);
                });
            });
        };
        if (!bot.moderateLockBooth(true, false, executeSkip))
            executeSkip();
    });
}).on('command:ban', function(data) {
    data.havePermission(bot.ROLE.MANAGER, function() {
        if (data.args.length > 2) {
            var userID = data.args[0].id;
            if (userID !== undefined) {
                var duration = data.args[1].toLowerCase();
                if (['hour', 'day', 'perma'].indexOf(duration) > -1) {
                    bot.moderateBanUser(userID, 0, duration == 'hour' ? bot.BAN.HOUR : duration == 'day' ? bot.BAN.DAY : bot.BAN.PERMA);
                } else bot.sendChat('Wrong duration');
            } else bot.sendChat('Missing user');
        } else bot.sendChat('Missing parameters');
    });
}).on('command:kick', function(data) {
    data.havePermission(bot.ROLE.MANAGER, function() {
        if (data.args.length > 1) {
            var userID = data.args[0].id;
            if (userID !== undefined) {
                bot.moderateBanUser(userID, 0, 60, function() {
                    bot.moderateUnbanUser(userID);
                });
            } else bot.sendChat('Missing user');
        } else bot.sendChat('Missing parameters');
    });
}).on(bot.messageTypes.DJ_ADVANCE, function(data) {
    if (data.media !== null) {
        bot.getHistory(function(history) {
            for (var i in history) {
                if (history.hasOwnProperty(i)) {
                    if (history[i].id == data.media.id) {
                        bot.moderateForceSkip();
                        bot.sendChat("/me Song skipped because it was in history!");
                    }
                }
            }
        });
    }
}).on('command:eta', function(data) {
    if (bot.getDJ() === null)
        return data.respondTimeout('If you join the waitlist now, you would be DJing!', 10);
    var a = bot.getDJ().id === data.from.id,
        b = bot.getWaitListPosition(data.from.id),
        c = 0;
    bot.getHistory(function(history) {
        for (var i in history) {
            if (history.hasOwnProperty(i))
                c += Math.min(history[i].info === undefined || history[i].info.duration === 0 ? 240 : history[i].info.duration, config.maxSongLength * 60);
        }
        c = Math.round(c / history.length);
        if (a === true)
            return data.respondTimeout('You are already DJing!', 10);
        if (b < 0)
            return data.respondTimeout(util.format(
                'If you join the waitlist now, you would be DJing in about %s!',
                Utils.secondsToTime(bot.getWaitList().length * c + bot.getTimeRemaining())
            ), 10);
        return data.respondTimeout(util.format(
            'You are in the waitlist %d of %d, you will be DJing in about %s!',
                b + 1,
            bot.getWaitList().length,
            Utils.secondsToTime((b + 1) * c + bot.getTimeRemaining())
        ), 10);
    });
}).on('command:info', function(data) {
    data.respond('Bot build on top of LiteBot by TAT');
}).on('command:uptime', function() {
    data.respond('Bot have been running for ' + Utils.secondsToTime((Date.now() - startupTime) / 1e3) + '.');
});