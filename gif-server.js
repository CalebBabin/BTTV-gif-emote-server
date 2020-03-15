const extractFrames = require('gif-extract-frames');
const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');
const https = require('https');


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

    if (fs.existsSync(dir)) {
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
                            const json = JSON.stringify({
                                count: data.shape[0],
                                id: id,
                                cacheHit: false
                            });
                            res.send(json);

                        })
                        .catch(err => {
                            res.json({
                                count: 0,
                                error: "Error extracting GIF"
                            });
                            fs.writeFileSync(`${__dirname}/gifs/${id}.exists`, '');
                            fs.unlink(fileDir);
                            fs.rmdirSync(dir);
                        })
                }
            });
            response.pipe(file);
        });
    }
})

app.use((req, res, next) => {
    res.status(404).send('404');
})

app.listen(42069);
