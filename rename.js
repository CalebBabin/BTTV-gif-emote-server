const fs = require('fs');

const gifsDir = fs.readdirSync(`${__dirname}/gifs`);

const scanDir = (directory) => {
	const array = fs.readdirSync(directory);
	for (let index = 0; index < array.length; index++) {
		const original = array[index];
		let element = original;
		let changed = false;
		while(element.substr(0,1) === "0" && element.substr(1,1) !== ".") {
			changed = true;
			element = element.substring(1, element.length);
		}
		if (changed) {
			fs.renameSync(directory+'/'+original, directory+'/'+element);
		}
	}
}

for (let index = 0; index < gifsDir.length; index++) {
	const filename = gifsDir[index];
	
	if (!filename.includes('.')) {
		console.log(`${__dirname}/gifs/${filename}`)
		scanDir(`${__dirname}/gifs/${filename}`);
	}
}