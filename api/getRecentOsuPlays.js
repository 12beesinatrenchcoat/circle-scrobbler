/* Getting an osu! player's most recent plays (50 of them.) */
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const baseURL = 'https://osu.ppy.sh';
const {OSU_CLIENT_ID, OSU_CLIENT_SECRET} = process.env;

async function authorize() {
	console.log('getting a token…');
	/* eslint-disable */
	const headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
	}
	const body = {
		client_id: Number(OSU_CLIENT_ID),
		client_secret: OSU_CLIENT_SECRET,
		grant_type: 'client_credentials',
		scope: 'public',
	} /* eslint-enable */

	const response = await fetch(baseURL + '/oauth/token', {
		method: 'post',
		headers,
		body: JSON.stringify(body),
	}).then(response => response.json());

	return response.access_token;
}

export default async function handler(request, response) {
	const osuUsername = String(request.query.osu_username);
	const mode = (request.query.modes).split(',')
		.filter(mode => mode === 'osu' || mode === 'taiko' || mode === 'mania' || mode === 'fruits');

	console.log(mode);

	if (!osuUsername) {
		return response.status(400).send('missing username');
	}

	if (osuUsername.length < 3) {
		return response.status(400).send('username is too short!');
	}

	if (osuUsername.length > 15) {
		return response.status(400).send('username is too long!');
	}

	// TODO: This should probably be cached instead of called every single time.
	const token = await authorize();

	const recentPlays = await getUserID(osuUsername, token)
		.then(id => fetchRecentPlays(id, mode, token))
		.catch(() => {
			response.status(404).send('user does not exist.');
		});

	console.log('sending!');
	return response.status(200).json(recentPlays);
}

/**
 * Getting an osu! user's ID, from a username.
 * @param {String} username an osu! username
 * @param {String} token osu!api v2 token
 * @returns {Promise<Number>}
 */
async function getUserID(username, token) {
	const URL = `${baseURL}/api/v2/users/${username}?key=username`;
	const headers = {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		Authorization: 'Bearer ' + token,
	};

	const response = await fetch(URL, {
		method: 'get',
		headers,
	})
		.then(response => response.json());

	if (response.error === null) {
		throw new Error('User does not exist.');
	}

	return response.id;
}

async function fetchRecentPlays(id, modes, token) {
	// No mode specified, uses user's default mode
	if (!modes.length) {
		modes.push(null);
	}

	let plays = [];

	for (const mode of modes) {
		// TODO: Find a nice way to get more than 100 plays.
		const URL = `${baseURL}/api/v2/users/${id}/scores/recent?limit=100${mode ? '&mode=' + mode : ''}`;
		console.log(URL);

		const headers = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: 'Bearer ' + token,
		};

		const response = fetch(URL, {
			method: 'get',
			headers,
		}).then(response => response.json());

		plays.push(response);
	}

	plays = await Promise.all(plays);
	plays = plays.flat(1);

	/* eslint-disable camelcase */
	return plays.map(({created_at, mode, beatmap, beatmapset}) => ({
		created_at, mode, beatmapset,
		beatmap: {
			difficulty_rating: beatmap.difficulty_rating,
			version: beatmap.version,
			hit_length: beatmap.hit_length,
		},
		/* eslint-enable camelcase */
	})).sort((a, b) => (new Date(b.created_at) - new Date(a.created_at)));
}
