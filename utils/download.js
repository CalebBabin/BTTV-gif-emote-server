const extractFrames = require('gif-frames');
const Spritesmith = require('spritesmith');
const https = require('https');
const fs = require('fs');

const parseGif = require('./parseGif.js');

const fileIndex = {}

const resolveAll = (id, data = true) => {
	for (let index = 0; index < fileIndex[id].length; index++) {
		const element = fileIndex[id][index];
		element.resolve(data);
	}
	fileIndex[id] = false;
}
const rejectAll = (id, data = true) => {
	for (let index = 0; index < fileIndex[id].length; index++) {
		const element = fileIndex[id][index];
		element.reject(data);
	}
	fileIndex[id] = false;
}

const tryGettingFile = (id, destinationDirectory) => {
    return new Promise((resolve, reject) => {
		if (fileIndex[id]) {
			fileIndex[id].push({resolve:resolve, reject:reject})
		} else {
			fileIndex[id] = [{resolve:resolve, reject:reject}]
			const jsonLocation = `${global.rootDirectory}/gifs/${id}.json`;

			fs.writeFileSync(jsonLocation, JSON.stringify({
				count: 0,
				frames: [],
				state: 'downloading',
			}));
	
			const fileDir = `${global.rootDirectory}/gifs/${id}.gif`;
			const gifURL = `https://cdn.betterttv.net/emote/${id}/3x`;
	
			
			const file = fs.createWriteStream(fileDir);
			https.get(gifURL, function (response) {
				response.on('end', ()=>{
					fs.writeFileSync(jsonLocation, JSON.stringify({
						count: 0,
						frames: [],
						state: 'downloaded',
					}));
	
					setTimeout(()=>{
						parseGif(id, destinationDirectory, jsonLocation, gifURL, fileDir)
						.then(()=>{resolveAll(id)})
						.catch(()=>{rejectAll(id)});
					}, 1000)
					
				})
				response.pipe(file);
			});
		}

    });
}

module.exports = tryGettingFile;