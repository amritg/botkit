/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    set token=<MY TOKEN>
	
	node bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}


var MathHelper = require('./botmath.js');
var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

var request = require('request');

var herotable = []
request('https://api.steampowered.com/IEconDOTA2_570/GetHeroes/v0001/?key=CED9D559CCCD3B55EBE66DEAAD2983B2&language=en_us', function (error, response, body) {
        try{
            var json = JSON.parse(body);
            for(i=0;i<json.result.heroes.length;i++){
                var hobject = json.result.heroes[i];
                herotable[json.result.heroes[i].id] = json.result.heroes[i].localized_name
            }
        }
        catch(err){
        }
});

controller.hears(['dota (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
	 var matches = message.text.match(/dota (.*)/i);
     var playerId = matches[1];
     var match_id;
     request('https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/V001/?matches_requested=1&account_id=' + playerId+'&key=CED9D559CCCD3B55EBE66DEAAD2983B2', function (error, response, body) {
		 try{
			 var json = JSON.parse(body);
             match_id=json.result.matches[0].match_id;
			 bot.reply(message,"Match Id: " + match_id);

             request('https://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/V001/?match_id='+match_id+'&key=CED9D559CCCD3B55EBE66DEAAD2983B2', function (error, response, body) {
        try{
            var json = JSON.parse(body);
            var playerindex;
            for(i=0;i<json.result.players.length;i++){
                if (playerId==json.result.players[i].account_id){
                    playerindex=i
                }
            }
            var heroid = json.result.players[playerindex].hero_id;
            var hero = herotable[heroid];
            var k = json.result.players[playerindex].kills;
            var d = json.result.players[playerindex].deaths;
            var a = json.result.players[playerindex].assists;
            var lh = json.result.players[playerindex].last_hits;

            var slot = json.result.players[playerindex].player_slot;
            var team;
            if(slot > 100){
                team = 'dire';
            }
            else{
                team = 'radiant';
            }
            console.log(team);
            var win = json.result.radiant_win;
            var wongame;
            if(win=='true'){
                if(team=='radiant'){
                    wongame = true;
                }else{
                    wongame=false;
                }
            }else{
                if(team=='dire'){
                    wongame=true;
                }else{
                    wongame=false;
                }
            }

            bot.reply(message,'Here is the info for your last dota2 game.');
            bot.reply(message,'hero: '+hero);
            bot.reply(message,'Kills/deaths/assists: '+k+' / '+d+' / '+a);
            bot.reply(message,'Last hits: '+lh);
            if(wongame){
                    bot.reply(message,'You won the game.');
            }else{
                bot.reply(message,'You lost the game.');
            }
        }
        catch(err){
            bot.reply(message, err);
        }
    });

    }
    catch(err){
		bot.reply(message,"Not im my Database");
    }
 	});
    
});

controller.hears(['record (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
	var matches = message.text.match(/record (.*)/i);
    var name = matches[1];
	var request = require('request');
	request('http://www.speedrun.com/api_records.php?game=' + name, function (error, response, body) {
	  try{
		 
		var json = JSON.parse(body);
		var string = body;
		var n = string.match(/time":"(.*?)"/i);
		  
		  
		bot.reply(message,"Record is: " + n[1] + " Seconds");
		console.log(body) // Show the HTML for the Google homepage.
	  }
		catch(err){
			bot.reply(message,"Not im my Database");
		}
	})

    });



controller.hears(['hello','hi'],'direct_message,direct_mention,mention',function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    },function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(',err);
        }
    });


    controller.storage.users.get(message.user,function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Hello ' + user.name + '!!');
        } else {
            bot.reply(message,'Hello.');
        }
    });
});

controller.hears(['call me (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
    var matches = message.text.match(/call me (.*)/i);
    var name = matches[1];
    controller.storage.users.get(message.user,function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user,function(err, id) {
            bot.reply(message,'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});


controller.hears(['what is my name','who am i'],'direct_message,direct_mention,mention',function(bot, message) {

    controller.storage.users.get(message.user,function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Your name is ' + user.name);
        } else {
            bot.reply(message,'I don\'t know yet!');
        }
    });
});


controller.hears(['shutdown'],'direct_message,direct_mention,mention',function(bot, message) {

    bot.startConversation(message,function(err, convo) {
        convo.ask('Are you sure you want me to shutdown?',[
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    },3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});

controller.hears(['uptime','identify yourself','who are you','what is your name'],'direct_message,direct_mention,mention',function(bot, message) {

    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message,':robot_face: I am a bot named <@' + bot.identity.name + '>. I have been running for ' + uptime + ' on ' + hostname + '.');

});

controller.hears(['fibonacci'], 'direct_message,direct_mention,mention', function(bot, message) {
    if (message.text === 'fibonacci') {
        bot.reply(message, '1, 1, 2, 3, 5, 8, 13, 21, 34, 55');
    }
});

controller.hears(['fibonacci ([0-9]+)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var parameter = parseInt(message.match[1]);
    
    var fibonacci = calculateFibonacciUpto(parameter);
    
    if (fibonacci[fibonacci.length-1] !== parameter) {
        bot.reply(message, 'That is not a Fibonacci number!');
    }
    else {
        bot.reply(message, fibonacci.slice(fibonacci.length-10,fibonacci.length).join(', '));
    }
});

function calculateFibonacciUpto(goal) {
    var fibonacci = [1, 1];
    
    while (fibonacci[fibonacci.length-1] < goal) {
        fibonacci.push(fibonacci[fibonacci.length-2] + fibonacci[fibonacci.length-1]);
    }
    
    return fibonacci;
}

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}

controller.hears('prime',['direct_message', 'direct_mention', 'mention'],function(bot,message) {
    if (message.text === "prime") {
        return bot.reply(message, '2, 3, 5, 7, 11, 13, 17, 19, 23, 29');
    }
});

controller.hears('prime (.*)',['direct_message', 'direct_mention', 'mention'],function(bot,message) {

    var parameter = parseInt(message.match[1]);

    if (MathHelper.isPrime(parameter)) {
        var primes = new Array();
        var number = parameter + 1;

        while (primes.length < 10) {

            if (MathHelper.isPrime(number)) {
                primes.push(number);
            }

            number++;
        }

        var reply = "";
        for (var i = 0; i < primes.length; i++) {
            reply += primes[i] + " ";
        }

        return bot.reply(message, reply);
    }
    else {
        return bot.reply(message, "your parameter: " + parameter + " is not Prime number");
    }
});
//Twitch integration
controller.hears('twitch (.*)', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {

   var channel = message.match[1];
   var url = "https://api.twitch.tv/kraken/streams/" + channel;

   request({
       url: url,
       json: true
   }, function(error, response, body) {

       if (!error && response.statusCode === 200) {
           console.log(body); // Print the json response
           if (body["stream"] == null) {
               //THEY ARE OFFLINE DO WHATEVER HERE
               return bot.reply(message, channel + ' is OFFLINE NOW. Sadface. Kappa \n Check again later.');
           } else {
               //THEY ARE ONLINE DO WHATEVER HERE
               return bot.reply(message, channel + ' is LIVE NOW. PogChamp \n He is playing: ' + body.stream.game + '\n' + body.stream.preview.large);
           }
       }
   });

});
