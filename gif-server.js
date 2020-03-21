const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');

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


app.use((req, res, next) => {
    res.status(404).send('404');
})

app.listen(42069);
