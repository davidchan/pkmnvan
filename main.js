var http = require('https');
var Twitter = require('twitter');
var moment = require('moment');
require('moment-timezone');

// setup libraries
// secrets from environment
var client = new Twitter({
    consumer_key: process.env.TW_CONSUMER_KEY,
    consumer_secret: process.env.TW_CONSUMER_SECRET,
    access_token_key: process.env.TW_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TW_ACCESS_TOKEN_SECRET
});

var urlsDt = [
    'https://pokevision.com/map/data/49.29154563906309/-123.13287734985352',
    'https://pokevision.com/map/data/49.28829871209136/-123.12429428100586',
    'https://pokevision.com/map/data/49.28359588700294/-123.11150550842287',
    'https://pokevision.com/map/data/49.28214015975995/-123.10077667236327',
    'https://pokevision.com/map/data/49.27659680498306/-123.11562538146973',
    'https://pokevision.com/map/data/49.278388664575886/-123.12764167785645',
    'https://pokevision.com/map/data/49.28337193176269/-123.13708305358885',
    'https://pokevision.com/map/data/49.29137769980898/-123.14240455627443',
    'https://pokevision.com/map/data/49.281692235039465/-123.12026023864746'
];

var pokeMap = {
    1 : 'Bulbasaur',
    2 : 'Ivysaur',
    3 : 'Venusaur',
    4 : 'Charmander',
    5 : 'Charmeleon',
    6 : 'Charizard',
    7 : 'Squirtle',
    8 : 'Wartortle',
    9 : 'Blastoise',
    25 : 'Pikachu',
    26 : 'Raichu',
    31 : 'Nidoqueen',
    34 : 'Nidoking',
    36 : 'Clefable',
    38 : 'Ninetales',
    40 : 'Wigglytuff',
    45 : 'Vileplume',
    51 : 'Dugtrio',
    53 : 'Persian',
    55 : 'Golduck',
    57 : 'Primeape',
    58 : 'Growlithe',
    59 : 'Arcanine',
    62 : 'Poliwrath',
    64 : 'Kadabra',
    65 : 'Alakazam',
    68 : 'Machamp',
    71 : 'Victreebel',
    73 : 'Tentacruel',
    75 : 'Graveler',
    76 : 'Golem',
    77 : 'Ponyta',
    78 : 'Rapidash',
    80 : 'Slowbro',
    82 : 'Magneton',
    91 : 'Cloyster',
    95 : 'Onix',
    101 : 'Electrode',
    102 : 'Exeggcute',
    103 : 'Exeggutor',
    106 : 'Hitmonlee',
    107 : 'Hitmonchan',
    108 : 'Lickitung',
    110 : 'Weezing',
    112 : 'Rhydon',
    113 : 'Chansey',
    115 : 'Kangaskhan',
    112 : 'Mr. Mime',
    117 : 'Seadra',
    121 : 'Starmie',
    123 : 'Scyther',
    125 : 'Electabuzz',
    126 : 'Magmar',
    127 : 'Pinsir',
    128 : 'Tauros',
    130 : 'Gyarados',
    131 : 'Lapras',
    132 : 'Ditto',
    134 : 'Vaporeon',
    135 : 'Jolteon',
    136 : 'Flareon',
    137 : 'Porygon',
    138 : 'Omanyte',
    139 : 'Omastar',
    140 : 'Kabuto',
    141 : 'Kabutops',
    142 : 'Aerodactyl',
    143 : 'Snorlax',
    144 : '!Articuno',
    145 : '!Zapdos',
    146 : '!Moltres',
    147 : 'Dratini',
    148 : 'Dragonair',
    149 : '!Dragonite',
    150 : '!Mewtwo',
    151 : '!Mew'
};

var cache = {};

function sendTweet (p, name) {
    var text = createMessage (p, name);
    var mapUrl = createMapUrl(p.latitude, p.longitude);

    getAddress(p.latitude, p.longitude, (addressStr) => {
        if (addressStr) {
            addressStr = '(' + addressStr + ')';
        }
        var msg = text + ' ' + addressStr + ' ' + mapUrl;
        console.log(msg);
        //client.post('statuses/update', {status: msg}, function(error, tweet, response) {});
    });

}

function createMessage (monData, name) {
    var secondsExp = monData.expiration_time;
    var exp = moment(secondsExp * 1000).tz('America/Vancouver');
    var expirationStr = exp.clone().format('h:mmA'); // 9:28PM
    var expFromNow = exp.clone().toNow(true);      // in X mins

    return name + ' found. Around for ' + expFromNow + ', until ' + expirationStr;
}

function createMapUrl (lat, longi) {
    return 'https://maps.google.com/maps?q=' + lat + ',' + longi;
}

function getAddress (lat, longi, callback) {
    var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + longi + '&key=' + process.env.GOOGLE_KEY;
    getContent(url).then((body) => {
        var json,
            output = '';
        if (body && body.length && body.charAt(0) === '{') {
            json = JSON.parse(body);
            if (json.results && json.results[0] && json.results[0].address_components && json.results[0].formatted_address) {
                output = json.results[0].formatted_address;
                // turn "1050 Quebec St, Vancouver, BC V6A, Canada" into "1050 Quebec St"
                output = output.split(',')[0];
                output = 'near ' + output;
            }
        }
        callback(output);
    });
}

function getCacheKey (p) {
    // can't trust p.uid for some reason
    return p.pokemonId + '|' + p.latitude + '|' + p.longitude;
}

function putCache (key, p) {
    if (getCache(key)) {
        return;
    }
    cache[key] = p;
}

function getCache (key) {
    return cache[key];
}

function removeCache (key) {
    delete cache[key];
}

function cleanCache () {
    var curr = (new Date())*1;
    var toDelete = [];
    for (var key in cache) {
        var p = cache[key];
        // give 1 second buffer
        if (curr >= (p.expiration_time + 1)*1000) {
            toDelete.push(key);
        }
    }

    console.log(Object.keys(cache), toDelete);

    toDelete.forEach(function (key) {
        removeCache(key);
    });
}

function isCached (p) {
    var result = false;

    var cached = getCache(getCacheKey(p));
    if (cached) {
        result = true;
    }
    return result;
}

function processMons (res, callback) {
    if (res && res.pokemon && res.pokemon.length) {
        res.pokemon.forEach((p) => {
            var pId = parseInt(p.pokemonId, 10);
            if (pokeMap[pId]) {
                if (!isCached(p)) {
                    var name = pokeMap[pId];
                    sendTweet(p, name);
                    putCache(getCacheKey(p), p);
                }
            }
        });
    }
}

function getByUrls (urls) {
    var promises = urls.map((url) => {
        return getContent(url);
    });
    Promise.all(promises).then(bodies => {
        var outputs = [];
        bodies.forEach((body) => {
            if (body && body.length && body.charAt(0) === '{') {
                try {
                    var parsed = JSON.parse(body);
                    outputs.push(parsed);
                } catch (e) {}
            }
        });

        outputs.forEach((data) => {
            processMons(data);
        });
    });
}

// https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies/
function getContent (url) {
    // return new pending promise
    return new Promise((resolve, reject) => {
        // select http or https module, depending on reqested url
        //const lib = url.startsWith('https') ? require('https') : require('http');
        const lib = http;
        const request = lib.get(url, (response) => {
            // handle http errors
            if (response.statusCode < 200 || response.statusCode > 299) {
                //reject(new Error('Failed to load page, status code: ' + response.statusCode));
                console.log('Failed to get: ' + url);
                resolve('');
            }
            // temporary data holder
            const body = [];
            // on every content chunk, push it to the data array
            response.on('data', (chunk) => body.push(chunk));
            // we are done, resolve promise with those joined chunks
            response.on('end', () => resolve(body.join('')));
        });
        // handle connection errors of the request
        //request.on('error', (err) => reject(err));
        request.on('error', () => {
            console.log('Failed to get: ' + url);
            resolve('');
        });
    });
};


// main loop
function main () {
    cleanCache();

    getByUrls(urlsDt);
}

main(); // run immediately
// run every 45 seconds
setInterval(() => {
    main();
}, 45 * 1000);

