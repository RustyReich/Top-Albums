# Top-Spotify-Albums
A website that allows you to see which albums you have the most number of songs saved from on Spotify 

## Table of Contents
[Showcase](#Showcase)

[How to Use](#How_To_Use)

[How to Host the Site Yourself](#How_to_Host)

<a name="Showcase"/>

## Showcase
![Showcase](https://i.imgur.com/h9hsHKn.png)

<a name="How_To_Use"/>

## How to Use
- Visit the site at https://rustyreich.github.io/Top-Spotify-Albums/
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
