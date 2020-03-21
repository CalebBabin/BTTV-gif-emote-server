const extractFrames = require('gif-frames');
const fs = require('fs');

//const generateSpritemap = require('./generateSpritemap.js');

const parseGif = (id, destinationDirectory, jsonLocation, gifURL, gifDirectory) => {
	return new Promise((resolve, reject) => {
		if (!fs.existsSync(destinationDirectory)) {
			fs.mkdirSync(destinationDirectory);
		}

		extractFrames({
			url: gifURL,
			frames: 'all',
			outputType: 'png'
		}).then(function (frameData) {
			const promises = [];
			const frames = new Array(frameData.length);
			const spriteLocations = new Array(frameData.length);
			for (let index = 0; index < frameData.length; index++) {
				const frameFileDirectory = `${destinationDirectory}/${frameData[index].frameIndex}.png`;
				frames[frameData[index].frameIndex] = frameData[index].frameInfo;
				spriteLocations[frameData[index].frameIndex] = frameFileDirectory;
				promises.push(frameData[index]
					.getImage()
					.pipe(
						fs.createWriteStream(frameFileDirectory)
					)
				);
			}
			Promise.all(promises).then((data) => {
				fs.writeFileSync(jsonLocation, JSON.stringify({
					count: frames.length,
					frames: frames,
					state: 'completed',
				}));
				resolve();
				/*generateSpritemap(spriteLocations, `${global.rootDirectory}/gifs/${id}`, jsonLocation)
				.then(resolve)
				.catch(reject);*/
			})
			.catch(err => {
				reject(err);
			});
		}).catch(err => {
			reject(err);
		})
	})
}

module.exports = parseGif;