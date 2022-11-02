# Top Albums
A website that allows you to see which albums you have the most number of songs saved from on Spotify

## Table of Contents
[Showcase](#Showcase)

[How to Use](#How_To_Use)

[How to Host the Site Yourself](#How_to_Host)

[How to Host the Site with Your Own Spotify Web App](#How_to_Host_with_Own_App)

<a name="Showcase"/>

## Showcase
![Showcase](https://raw.githubusercontent.com/RustyReich/Top-Albums/main/Showcase.png)

<a name="How_To_Use"/>

## How to Use
- Visit the site at https://rustyreich.github.io/Top-Albums/
- Click or tap the `Login with Spotify` button
- After loading, you shoud immediately see the 5 or so albums that you have the most songs saved from
- Scroll through the list to see every album that you have at least 1 song saved from
- Click or tap on an album to see a list of songs in the album and which ones you have saved from the album
  - Song names will appear in green if they are songs that you have saved
- Click or tap the `Sort by Highest Percentage` button to see the list sorted by albums which you have the highest percentage of songs saved from (e.g. an album with 10 songs of which you have 8 saved would have a percentage of 80%)
  - Singles (albums containing only a single song) are automatically removed from this list as they would all appear at the top with 100%
  
<a name="How_to_Host"/>
  
## How to Host the Site Yourself

- Download `index.html`, `style.css`, and `site.js` from this repository
- Download HTML server software (for development, I used [http-server](https://github.com/http-party/http-server))
- Start an HTML server at `localhost:8888`
  - Make sure that `index.html` is set as the main page
  - Make sure that the port is `8888`, as it will not work with any other port
- Open up any browser and connect to the site with the url `localhost:8888`
  - Again, using any other port or connecting using any other url, such as `127.0.0.1:8888`, will result in an `invalid callback URL` error
  
<a name="How_to_Host_with_Own_App"/>

## How to Host the Site with Your Own Spotify Web App
- Go to https://developer.spotify.com/dashboard/
- Sign in with your Spotify account
- Click the `Create an App` button
- Fill out the submission box that appears and enter the dashboard for your newly created app
- Click the `Edit Settings` button
- Under `Redirect URIs`, click `add` to add a new callback URL and add `http://localhost:8888/`
- Copy your apps `Client ID`
- Download `index.html`, `style.css`, and `site.js` from this repository
- Open up `site.js` with an editing tool and look for the line `var client_id = 'cd65bb285db248e4b6352828ac986b66';`. Replace this id with your own Web App's ID
- Now follow the rest of the steps laid out in [How to Host the Site Yourself](#How_to_Host)
