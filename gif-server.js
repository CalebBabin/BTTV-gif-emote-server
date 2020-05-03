const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const tryGettingFile = require('./utils/download.js');

global.rootDirectory = __dirname;


const app = express();
app.use(cors());

if (!fs.existsSync(`${__dirname}/gifs`)) {
    fs.mkdirSync(`${__dirname}/gifs`);
}

//app.use((req, res, next) => {
//    res.header('Access-Control-Allow-Origin', '*');
//    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//    next();
//})

app.use('/static', express.static(path.join(__dirname, 'gifs')));

app.get('/gif/:id', (req, res) => {
    const id = req.params.id.replace(/\W/g, '');
    const dir = `${__dirname}/gifs/${id}`;

    let parsedJSONData = {};
    if (fs.existsSync(`${__dirname}/gifs/${id}.json`)) {
        parsedJSONData = JSON.parse(fs.readFileSync(`${__dirname}/gifs/${id}.json`, {encoding: 'utf-8'}))
    }

    if (req.params.id.includes('.gif')) {
        const fileDir = `${__dirname}/gifs/${id.replace(/gif$/, '.gif')}`;
        if (!fs.existsSync(fileDir)) {
            tryGettingFile(id.replace(/gif$/, ''), dir)
            .then((data) => {
                res.sendFile(fileDir);
            })
            .catch((error) => {
                res.sendFile(fileDir);
            });
        } else {
            res.sendFile(fileDir);
        }
    } else if (fs.existsSync(`${__dirname}/gifs/${id}.json`) && parsedJSONData.state === 'completed') {
        res.sendFile(`${__dirname}/gifs/${id}.json`);
    } else {
        tryGettingFile(id, dir)
        .then((data) => {
            res.sendFile(`${__dirname}/gifs/${id}.json`);
        })
        .catch((error) => {
            console.log(error)
            res.json({
                count: 0,
                error: "Error extracting GIF"
            });
        });
    }
})

app.get('/channel/username/:username', (req, res) => {
    const filtered_username = req.params.username.replace( /[^a-zA-Z0-9]/ , "");
    fetch("https://api.twitch.tv/helix/users?login="+filtered_username, {
        headers: {
            "Client-ID": "6ro4h73lmdtiaxzhq6t5c7fr9ix50r"
        }
    })
    .then(response => response.json())
    .then(body => {
        if (body && body.data && body.data[0] && body.data[0].id) {
            getBTTVEmotes(body.data[0].id)
            .then(data => {
                res.set('Cache-Control', 'max-age=3600')
                res.set('expires', '1h')
                res.json(data);
            })
            .catch(e => {
                console.error(e);
                res.json({
                    error: e
                });
            })

            
        } else {
            res.json({
                error: "something went wrong getting the ID"
            })
        }
    })
    .catch(e => {
        console.error(e);
        res.json({
            error: "something went wrong fetching from the twitch API"
        })
    })
})

const getBTTVEmotes = (id) => {
    return new Promise((resolve, reject) => {
        
        fetch('https://api.betterttv.net/3/cached/emotes/global')
        .then(json => json.json())
        .then(global_emotes_body => {
            const output = [];

            if (global_emotes_body && global_emotes_body.length > 0) {
                for (let index = 0; index < global_emotes_body.length; index++) {
                    const emote = global_emotes_body[index];
                    output.push(emote);
                }
            }
            
            fetch(`https://api.betterttv.net/3/cached/users/twitch/${id}`)
            .then(response => response.json())
            .then(channel_emotes_body => {
                
                if (channel_emotes_body.channelEmotes) {
                    for (let index = 0; index < channel_emotes_body.channelEmotes.length; index++) {
                        const emote = channel_emotes_body.channelEmotes[index];
                        output.push(emote);
                    }
                }
                if (channel_emotes_body.sharedEmotes) {
                    for (let index = 0; index < channel_emotes_body.sharedEmotes.length; index++) {
                        const emote = channel_emotes_body.sharedEmotes[index];
                        output.push(emote);
                    }
                }

                resolve(output);
            }).catch(e => {reject(e)})
        }).catch(e => {reject(e)})
    })
}


app.use((req, res, next) => {
    res.status(404).send('404');
})

app.listen(42069);
