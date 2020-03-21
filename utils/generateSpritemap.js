const Spritesmith = require('spritesmith');
const fs = require('fs');


const generateSpritemap = (spriteLocations, targetDirectory, jsonLocation) => {
	return new Promise((resolve, reject) => {
		Spritesmith.run({
			src: spriteLocations
		}, (err, result) => {
			if (err) {
				reject();
				console.log(err);
				console.log(result);
			} else {
				const json = JSON.parse(fs.readFileSync(jsonLocation, {encoding: 'utf-8'}));
				for (const file in result.coordinates) {
					if (object.hasOwnProperty(file)) {
						const spritesheetData = object[file];
						const index = Number(file.match(/[ \w-]+?(?=\.)/)[0]);
						json.frames[index].sx = spritesheetData.x;
						json.frames[index].sy = spritesheetData.y;
						json.frames[index].sw = spritesheetData.width;
						json.frames[index].sh = spritesheetData.height;
					}
				}
				json.state = 'complete';
				fs.writeFileSync(jsonLocation, JSON.stringify(json));
				fs.writeFile(`${targetDirectory}/spritesheet.png`, result.image, () => {
					resolve();
				});
			}
		})
	})
}

module.exports = generateSpritemap;