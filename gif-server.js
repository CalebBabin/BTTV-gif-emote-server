const extractFrames = require('gif-frames');
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
    } else if (fs.existsSync(`${__dirname}/gifs/${id}.json`)) {
        res.sendFile(`${__dirname}/gifs/${id}.json`);
    } else {
        tryGettingFile(id, dir)
        .then((data) => {
            const interval = setInterval(()=>{
                if (fs.existsSync(`${__dirname}/gifs/${id}.json`)) {
                    clearInterval(interval);
                    res.sendFile(`${__dirname}/gifs/${id}.json`);
                }
            }, 1000)
            setTimeout(()=>{
                clearInterval(interval);
            }, 10000);
        })
        .catch((error) => {
            console.log(error)
            res.json({
                count: 0,
                error: "Error extracting GIF"
            });
            fs.rmdirSync(dir);
        });
    }
})

const tryGettingFile = (id, dir) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        const fileDir = `${__dirname}/gifs/${id}.gif`;
        const gifURL = `https://cdn.betterttv.net/emote/${id}/3x`;

        
        const file = fs.createWriteStream(fileDir);
        const request = https.get(gifURL, function (response) {
            /*response.on('end', ()=>{
                fs.writeFileSync(`${__dirname}/gifs/${id}.json`, JSON.stringify({
                    count: 0,
                    frames: [],
                }));
                resolve({
                    count: 0,
                    frames: [],
                })
            })*/
            response.pipe(file);
        });

        extractFrames({
            url: gifURL,
            frames: 'all',
            outputType: 'png'
        }).then(function (frameData) {
            const promises = [];
            const frames = new Array(frameData.length);
            for (let index = 0; index < frameData.length; index++) {
                const frameFileDirectory = `${dir}/${frameData[index].frameIndex}.png`;
                frames[frameData[index].frameIndex] = frameData[index].frameInfo;
                promises.push(frameData[index]
                    .getImage()
                    .pipe(
                        fs.createWriteStream(frameFileDirectory)
                    )
                );
            }
            Promise.all(promises).then((data) => {

                fs.writeFileSync(`${__dirname}/gifs/${id}.json`, JSON.stringify({
                    count: frames.length,
                    frames: frames,
                }));

                resolve({
                    count: frameData.length,
                    frames: frames,
                });
            })
            .catch(err => {
                reject(err);
            });
        }).catch(err => {
            resolve({
                count: 0,
                frames: [],
            });
        })

    });
}

app.use((req, res, next) => {
    res.status(404).send('404');
})

app.listen(42069);
