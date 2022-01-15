/* Literally just giving the user the Last.fm API key, used in authentication. */
import dotenv from 'dotenv';
dotenv.config();

const {LAST_FM_KEY} = process.env;

export default async function handler(request, response) {
	response.status(200).send(LAST_FM_KEY);
}
