/* Getting a last.fm session key from a user. */
import fetch from 'node-fetch';
import md5 from 'md5';
import dotenv from 'dotenv';
dotenv.config();

const baseURL = 'https://ws.audioscrobbler.com/2.0/';
const {LAST_FM_KEY, LAST_FM_SECRET} = process.env;

export default async function handler(request, response) {
	const token = String(request.query.token);
	const signature = md5(`api_key${LAST_FM_KEY}methodauth.getSessiontoken${token}${LAST_FM_SECRET}`);

	const session = await fetch(`${baseURL}?method=auth.getSession&token=${token}&api_key=${LAST_FM_KEY}&api_sig=${signature}&format=json`)
		.then(response => response.json());

	response.status(200).json(session);
}
