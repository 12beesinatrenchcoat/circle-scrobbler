const params = (new URL(document.location)).searchParams;
const token = params.get('token');

// Authenticating with Last.fm. Handles "?token"
if (token && (!name || !localStorage.getItem('key'))) {
	fetch('./api/obtainLastFMSessionKey.js?token=' + token)
		.then(response => response.json())
		.then(json => {
			const {name, key} = json.session;
			// This is probably incredibly unsafe, but I don't know any better.
			localStorage.setItem('name', name);
			localStorage.setItem('key', key);

			postLastfmLogin(name);
		});
}

const lastfmName = localStorage.getItem('name') ?? '';

if (lastfmName) {
	postLastfmLogin(lastfmName);
} else {
	// Adding a login link based on what was given in .env
	fetch('./api/getLastFMKey.js')
		.then(response => response.text())
		.then(text => {
			document.getElementById('lastfm-login-link')
				.setAttribute('href', 'https://last.fm/api/auth/?api_key=' + text);
		});
}

// Logging out
const logoutButton = document.getElementById('lastfm-logout');

if (localStorage.getItem('name') && localStorage.getItem('key')) {
	logoutButton.hidden = false;
}

logoutButton.addEventListener('click', () => {
	localStorage.removeItem('name');
	localStorage.removeItem('key');
	window.location.reload();
});

window.toScrobble = [];
window.ignored = [];

// Display of user info after logging into Last.fm.
function postLastfmLogin(username) {
	// "log into last.fm" link turns to link to user profile
	const lastfmApiKey = fetch('./api/getLastFMKey.js');
	const loginLink = document.getElementById('lastfm-login-link');
	loginLink.innerText = username;
	loginLink.href = 'https://last.fm/user/' + username;

	Promise.resolve(lastfmApiKey)
		.then(response => response.text())
		.then(key => {
			fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${key}&format=json`)
				.then(response => response.json())
				.then(json => {
					const imgElement = document.getElementById('lastfm-user-image');
					imgElement.setAttribute('src', json.user.image[2]['#text']);
				});
		});
}

// Getting a user's recent osu! plays
document.getElementById('get-recent-osu-plays').addEventListener('submit', event => {
	event.preventDefault(); // Stops redirect
	const latestTimestamp = Number(localStorage.getItem('latestTimestamp')); // Timestamp of the latest play scrobbled, if exists

	const scoresDiv = document.getElementById('scores');

	const formData = new FormData(event.target);
	const osuUsername = String(formData.get('osu_username'));
	const modes = formData.getAll('mode');

	fetch(`./api/getRecentOsuPlays.js?osu_username=${osuUsername}&modes=${modes}`)
		.then(response => response.json())
		.then(plays => {
			if (plays.length) {
				scoresDiv.innerHTML = '';
				window.toScrobble = [];
			}

			console.log(plays);
			plays.every(play => {
				const {beatmap, beatmapset, created_at: createdAt} = play;
				const timestamp = Math.round(new Date(createdAt).getTime() / 1000) - beatmap.hit_length;

				if (timestamp <= latestTimestamp) {
					return false;
				}

				scoresDiv.appendChild(createPlayCard(play));
				window.toScrobble.push({
					artist: beatmapset.artist,
					artistUnicode: beatmapset.artist_unicode,
					track: beatmapset.title,
					trackUnicode: beatmapset.title_unicode,
					timestamp,
					duration: beatmap.hit_length,
				});

				return true;
			});
			if (window.toScrobble) {
				document.getElementById('scrobble-top').hidden = false;
				document.getElementById('status').innerText = window.toScrobble.length + ' plays loaded!';
			}
		})
		.catch(error => console.log(error));
});

/**
 * Creates a little card for a play.
 * @param {Object} play
 * @returns {HTMLDivElement}
 */
function createPlayCard(play) {
	const {checked: useUnicode} = document.getElementById('use-unicode');
	const {beatmapset, beatmap, mode} = play;
	const {title, title_unicode: titleUnicode, artist, artist_unicode: artistUnicode} = beatmapset;
	const {difficulty_rating: diffRating, version: diffName} = beatmap;
	const playedAt = new Date(play.created_at);

	const div = document.createElement('div');
	div.className = 'score';

	const infoDiv = document.createElement('div');
	infoDiv.className = 'info';

	const image = document.createElement('img');
	image.src = beatmapset.covers.card;

	const linesDiv = document.createElement('div');
	linesDiv.className = 'lines';

	const lineOne = document.createElement('span');
	lineOne.className = 'line';

	const titleElement = document.createElement('span');
	titleElement.textContent = useUnicode ? titleUnicode : title;
	titleElement.className = 'bold song-name';
	if (title !== titleUnicode) {
		titleElement.dataset.romanized = title;
		titleElement.dataset.unicode = titleUnicode;
	}

	const by = document.createElement('span');
	by.textContent = ' by ';

	const artistElement = document.createElement('span');
	artistElement.textContent = useUnicode ? artistUnicode : artist;
	artistElement.className = 'artist';
	if (artist !== artistUnicode) {
		artistElement.dataset.romanized = artist;
		artistElement.dataset.unicode = artistUnicode;
	}

	lineOne.append(titleElement, by, artistElement);

	const lineTwo = document.createElement('span');

	const diffElement = document.createElement('span');
	diffElement.textContent = `${diffName} (★${diffRating})`;
	diffElement.dataset.rating = diffRating;
	diffElement.className = 'difficulty ' + mode;

	// This is just ridiculous. I'm sorry.
	const dateElement = document.createElement('time');
	dateElement.textContent = ' on ' + playedAt.getDate() + ' '
		// eslint-disable-next-line new-cap
		+ Intl.DateTimeFormat('en-US', {month: 'short'}).format(playedAt) + ' ' // This is ridiculous.
		+ String(playedAt.getHours()).padStart(2, '0') + ':'
		+ String(playedAt.getMinutes()).padStart(2, '0') + ':'
		+ String(playedAt.getSeconds()).padStart(2, '0');
	dateElement.setAttribute('datetime', playedAt.toISOString());

	lineTwo.append(diffElement, dateElement);

	linesDiv.append(lineOne, lineTwo);

	const deleteButton = document.createElement('button');
	deleteButton.textContent = 'x';
	deleteButton.className = 'delete';
	deleteButton.addEventListener('click', event => {
		event.target.parentElement.remove();
	});

	infoDiv.append(image, linesDiv);
	div.append(infoDiv, deleteButton);

	return div;
}

// Switching between unicode + non-unicode titles.
document.getElementById('use-unicode').addEventListener('change', event => {
	const {checked} = event.target;
	const elements = document.querySelectorAll('[data-unicode][data-romanized]');
	if (checked) {
		elements.forEach(element => {
			element.textContent = element.dataset.unicode;
		});
	} else {
		elements.forEach(element => {
			element.textContent = element.dataset.romanized;
		});
	}
});

// The scrobble button(s)!
document.querySelectorAll('#scrobble, #scrobble-top').forEach(button => {
	button.addEventListener('click', () => {
		const sk = localStorage.getItem('key'); // Session Key.

		console.log('scrobbling!');
		// Whether to use Unicode characters is based on the "Prefer metadata in original language" checkbox
		const toScrobble = document.getElementById('use-unicode').checked
			? window.toScrobble.map(({artistUnicode, trackUnicode, duration, timestamp}) => ({artist: artistUnicode, track: trackUnicode, duration, timestamp}))
			: window.toScrobble.map(({artist, track, duration, timestamp}) => ({artist, track, duration, timestamp}));

		fetch('./api/scrobbleTrack.js', {
			method: 'POST',
			body: JSON.stringify({toScrobble, sk}),
		})
			.then(response => console.log(response))
			.then(() => {
				document.getElementById('scores').innerHTML = '';
				// Used to filter already-scrobbled recent plays.
				localStorage.setItem('latestTimestamp', window.toScrobble[0].timestamp);
				window.toScrobble = [];
			})
			.catch(error => {
				console.error(error);
			});
	});
});
