/* This file scrobbles a track. */
import fetch from 'node-fetch';
import md5 from 'md5';
import dotenv from 'dotenv';
dotenv.config();

const {LAST_FM_KEY, LAST_FM_SECRET} = process.env;

export default async function handler(request, response) {
	const {toScrobble, sk} = JSON.parse(request.body);

	const BODY_TEMPLATE = {
		// eslint-disable-next-line camelcase
		api_key: LAST_FM_KEY,
		method: 'track.scrobble',
		sk,
	};

	// Last.fm handles 50 scrobbles at a time, so…
	const arrays = [];
	while (toScrobble[0]) {
		arrays.push(toScrobble.splice(0, 50));
	}

	let scrobbleResults = [];

	for (const array of arrays) {
		const body = {...BODY_TEMPLATE};
		array.forEach((item, index) => {
			index = '[' + index + ']';
			body['artist' + index] = item.artist;
			body['track' + index] = item.track;
			body['timestamp' + index] = item.timestamp;
			body['duration' + index] = item.duration;
		});

		// And to generate a signature…
		const keys = Object.keys(body).sort();
		let signature = '';
		keys.forEach(key => {
			signature += key;
			signature += body[key];
		});
		signature += LAST_FM_SECRET;

		// eslint-disable-next-line camelcase
		body.api_sig = md5(signature);
		body.format = 'json';

		const data = new URLSearchParams(body);
		const scrobble = fetch('http://ws.audioscrobbler.com/2.0/', {
			method: 'post',
			body: data,
		})
			.then(response => response.json());

		scrobbleResults.push(scrobble);
	}

	scrobbleResults = await Promise.all(scrobbleResults);

	return response.status(200).json(scrobbleResults);
}
