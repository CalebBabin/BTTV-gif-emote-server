const extractFrames = require('gif-extract-frames');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

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
    } else if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);

        res.send(JSON.stringify({
            count: files.length,
            id: id,
            cacheHit: true
        }));

    } else if (fs.existsSync(`${__dirname}/gifs/${id}.exists`)) {
        res.json({
            count: 0,
            id: id,
        })
    } else {
        tryGettingFile(id, dir)
        .then((data) => {
            const json = JSON.stringify({
                count: data.shape[0],
                id: id,
                cacheHit: false
            });
            res.send(json);
        })
        .catch((error) => {
            res.json({
                count: 0,
                error: "Error extracting GIF"
            });
            fs.writeFileSync(`${__dirname}/gifs/${id}.exists`, '');
            fs.rmdirSync(dir);
        });
    }
})

const tryGettingFile = (id, dir) => {
    return new Promise((resolve, reject) => {
        const fileDir = `${__dirname}/gifs/${id}.gif`;
        const file = fs.createWriteStream(fileDir);
        const request = https.get(`https://cdn.betterttv.net/emote/${id}/3x`, function (response) {
            response.on('end', () => {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir)
                    extractFrames({
                        input: fileDir,
                        output: dir + '/%d.png',
                        coalesce: false,
                    })
                    .then((data) => {
                        resolve(data);
                    })
                    .catch(err => {
                        reject(err);
                    })
                }
            });
            response.pipe(file);
        });
    });
}

app.use((req, res, next) => {
    res.status(404).send('404');
})

app.listen(42069);
