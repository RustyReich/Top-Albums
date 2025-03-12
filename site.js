//Class definition for an entry in the ALBUM_LIST array
class album_entry {

    constructor(album) {

        this.album = album;

        //The number of songs in the album the user has saved
        this.count = 1;

        //Percentage of songs in the album the user has saved~
        this.percentage;

        //Songs in the album the user has saved
        this.savedSongs = [];
        //All songs that are in the album
        this.songs = [];

    }

    incrementCount() { this.count = this.count + 1; }

    getCount() { return this.count; }

}

//Get the URL of the current page
const CURRENT_URL = window.location.href;

//Get the access token
const ACCESS_TOKEN = CURRENT_URL.substring(CURRENT_URL.indexOf("=") + 1, CURRENT_URL.indexOf("&"));

//Maximum amount of tracks that can be requested at one time
    //This is a limitation imposed by the Spotify Web API
const MAX_REQUESTS_AT_A_TIME = 50;

//Variables used for receiving and storing tracks and albums
var ALBUM_LIST = []
var ALBUM_LIST_BY_PERCENTAGE = []
var TOTAL_TRACKS = Infinity
var TRACKS_RECEIVED = 0

function main() {

    //Hide the sorting buttons until we load the albums
    document.getElementById("most_songs_button").style.display = "none";
    document.getElementById("most_percentage_button").style.display = "none";

    //Add the "Hosted on GitHub" button
    const github_button = document.getElementById("github_button");
    if (isTouchDevice())
        github_button.addEventListener('touchend', () => {
            window.open("https://github.com/RustyReich/Top-Spotify-Albums", '_blank');
        })
    else
        github_button.addEventListener('click', () => {
            window.open("https://github.com/RustyReich/Top-Spotify-Albums", '_blank');
        });

    //If url does not have "#" in it, then we have not clicked the login button yet
    if (CURRENT_URL.indexOf("#") == -1) {

        //Hide loading bar and album_images div
        document.getElementById("loading_bar").style.display = "none";
        document.getElementById("album_images").style.display = "none";

        //Set client ID and redirect_uri for the Spotify web app
        var client_id = 'cd65bb285db248e4b6352828ac986b66';
        var redirect_uri = CURRENT_URL;

        //Generate random 16-character string for state
        var state = generateRandomString(16);

        //Save stateKey with state
        var stateKey = 'spotify_auth_state';
        localStorage.setItem(stateKey, state);

        //user-library-read is the only scope that needs to be requested in order to get the users 
        //saved tracks
        var scope = 'user-library-read';

        //Redirect to "Authorization" spotify link upon clicking login_button
        const login_button = document.getElementById("login_button");
        login_button.addEventListener('click', () => {

            var url = 'https://accounts.spotify.com/authorize';
            url += '?response_type=token';
            url += '&client_id=' + encodeURIComponent(client_id);
            url += '&scope=' + encodeURIComponent(scope);
            url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
            url += '&state=' + encodeURIComponent(state);

            window.location = url;

        });

    }
    else {  //If there is a "#" in the URL, we have clicked the login button

        //So hide the main square
        document.getElementById("main_square").style.display = "none"

        //Set up an interval to update the loading bar while we load all the tracks and albums
        LOADING_BAR_INTERVAL = setInterval(updateLoadingBar, 1)

        //Send request for first MAX_REQUESTS_AT_A_TIME tracks saved by the user
        sendRequest(craftUserTracksUrl(MAX_REQUESTS_AT_A_TIME, 0), function() {

            //After we receieve the first set of tracks
            const raw_response = this.responseText;
            const response = JSON.parse(raw_response);

            //Save total number of tracks saved by user
            TOTAL_TRACKS = response.total;

            //Call handler for first set of tracks
            handleTracksRetrieval(response);
            
            //Send all requests for all remaining tracks
            for (var i = TRACKS_RECEIVED; i < TOTAL_TRACKS; i = i + MAX_REQUESTS_AT_A_TIME)
                sendRequest(craftUserTracksUrl(MAX_REQUESTS_AT_A_TIME, i), function() {

                    const raw_response = this.responseText;
                    const response = JSON.parse(raw_response);

                    //Call the handler function for each response that we receieve
                    handleTracksRetrieval(response);

                });

            //The function that gets called after a response for a set of tracks has been receieved
            function handleTracksRetrieval(response) {

                //Count the number of tracks that were receieved in the response
                const num_tracks_received = Object.keys(response.items).length;

                //For every track received in the current response
                for (var i = 0; i < num_tracks_received; i++) {

                    //Check if the current tracks album is already in the ALBUM_LIST array
                    current_tracks_album = response.items[i].track.album;
                    album_list_id = albumInList(current_tracks_album);

                    //If it is not in the array
                    if (album_list_id == -1) {

                        var curr_album_entry = new album_entry(current_tracks_album);

                        //Push current song onto list of savedSongs in album
                        curr_album_entry.savedSongs.push(response.items[i].track);

                        //Then push album onto the ALBUM_LIST array
                        ALBUM_LIST.push(curr_album_entry);

                        //album_list_id is now equal to the last index in the ALBUM_LIST
                        album_list_id = Object.keys(ALBUM_LIST).length - 1;

                    }
                    else {

                        //If album is already in list, then just incrementCount and add song to
                        //savedSongs list
                        ALBUM_LIST[album_list_id].incrementCount();
                        ALBUM_LIST[album_list_id].savedSongs.push(response.items[i].track);

                    }

                    //Calculate percentage of songs saved from album
                    const saved_count = ALBUM_LIST[album_list_id].getCount();
                    const total_count = current_tracks_album.total_tracks;
                    ALBUM_LIST[album_list_id].percentage = saved_count / total_count * 100;

                }

                //Keep track of the number of tracks receieved so far
                TRACKS_RECEIVED += num_tracks_received;

                //Once all tracks have been receieved
                if (TRACKS_RECEIVED >= TOTAL_TRACKS) {

                    const num_of_albums = Object.keys(ALBUM_LIST).length

                    //Sort ALBUM_LIST by number of songs saved
                    sortByMostSongs(0, num_of_albums - 1);

                    //Copy all albums with more than 1 song into ALBUM_LIST_BY_PERCENTAGE
                    for (var i = 0; i < Object.keys(ALBUM_LIST).length; i++)
                        if (ALBUM_LIST[i].savedSongs[0].album.total_tracks != 1)
                            ALBUM_LIST_BY_PERCENTAGE.push(ALBUM_LIST[i]);
                
                    //Sort ALBUM_LIST_BY_PERCENTAGE by albums with the highest percentage of songs
                    //saved
                    sortByMostPercentage(0, Object.keys(ALBUM_LIST_BY_PERCENTAGE).length - 1);
 
                    //Print the albums by most songs saved
                    printResults("most_songs");

                }

            }

        });

    }

}

//Generate a random string of letters and digits that is the specified length
function generateRandomString(length) {

    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    var result = '';
    for (var i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result;

}

//Check if an album is already in the ALBUM_LIST array
    //Returns the index in the array if the album is in ALBUM_LIST
    //Returns -1 if the album is not in ALBUM_LIST
function albumInList(currAlbum) {

    var num_of_albums = Object.keys(ALBUM_LIST).length;

    for (var i = 0; i < num_of_albums; i++)
        if (ALBUM_LIST[i].album.id == currAlbum.id)
            return i;
    return -1;

}

//Sort ALBUM_LIST by number of tracks saved in album
function sortByMostSongs(low, high) {

    if (low < high) {

        var pi = partition(low, high);

        sortByMostSongs(low, pi - 1);
        sortByMostSongs(pi + 1, high);

    }

    function partition(low, high) {

        var pivot = ALBUM_LIST[high];
        var i = (low - 1);
    
        for (var j = low; j <= high - 1; j++) {
    
            if (ALBUM_LIST[j].count > pivot.count) {
    
                i++;
                swap(i, j);
    
            }
    
        }
    
        swap(i + 1, high);
        return (i + 1);
    
    }
    
    function swap(i, j) {
    
        var temp = ALBUM_LIST[i];
        ALBUM_LIST[i] = ALBUM_LIST[j];
        ALBUM_LIST[j] = temp;
    
    }

}

//Sort ALBUM_LIST_BY_PERCENTAGE by percentage of tracks saved in album
function sortByMostPercentage(low, high) {

    if (low < high) {

        var pi = partition(low, high);

        sortByMostPercentage(low, pi - 1);
        sortByMostPercentage(pi + 1, high);

    }

    function partition(low, high) {

        var pivot = ALBUM_LIST_BY_PERCENTAGE[high];
        var i = (low - 1);
    
        for (var j = low; j <= high - 1; j++) {

            if (ALBUM_LIST_BY_PERCENTAGE[j].percentage > pivot.percentage) {
    
                i++;
                swap(i, j);
    
            }
    
        }
    
        swap(i + 1, high);
        return (i + 1);
    
    }
    
    function swap(i, j) {
    
        var temp = ALBUM_LIST_BY_PERCENTAGE[i];
        ALBUM_LIST_BY_PERCENTAGE[i] = ALBUM_LIST_BY_PERCENTAGE[j];
        ALBUM_LIST_BY_PERCENTAGE[j] = temp;
    
    }

}

//The default height and top margin of album_div's in vmin
const DEFAULT_ALBUM_DIV_HEIGHT = 24;
const DEFAULT_ALBUM_MARGIN_TOP = 1;

//Default width of the spotify logo
const DEFAULT_SPOTIFY_LOGO_WIDTH = 10;

//Print results to the page
    //mode sets the array to print, ALBUM_LIST or ALBUM_LIST_BY_PERCENTAGE
function printResults(mode) {

    //Clear all contents of album_images div
    document.getElementById("album_images").innerHTML = '';

    //Print the appropriate array
    if (mode == "most_songs")
        array = ALBUM_LIST;
    else if (mode == "most_percentage")
        array = ALBUM_LIST_BY_PERCENTAGE;

    //Show the most_songs_button
    const most_songs_button = document.getElementById("most_songs_button");
    most_songs_button.style.display = "block";

    //Show the most_percentage_button
    const most_percentage_button = document.getElementById("most_percentage_button");
    most_percentage_button.style.display = "block";

    //Hide the loading bar
    document.getElementById("loading_bar").style.display = "none"

    //Get the number of albums in array
    const num_of_albums = Object.keys(array).length

    //Re-display the main_square element
    const main_square = document.getElementById("main_square");
    main_square.style.display = "inline-block";

    //Add event listeners for changing the color of the button not currently selected when you
    //hover over it
    if (mode == "most_songs") {

        if (isTouchDevice())
            most_percentage_button.addEventListener('touchend', mostPercentageButtonFunction, false);
        else
            most_percentage_button.addEventListener('click', mostPercentageButtonFunction, false);

        most_percentage_button.addEventListener('mouseover', mostPercentageMouseOver, false);
        most_percentage_button.addEventListener('mouseout', mostPercentageMouseOut, false);

    }
    else if (mode == "most_percentage") {

        if (isTouchDevice())
            most_songs_button.addEventListener('touchend', mostSongsButtonFunction, false);
        else
            most_songs_button.addEventListener('click', mostSongsButtonFunction, false);

        most_songs_button.addEventListener('mouseover', mostSongsMouseOver, false);
        most_songs_button.addEventListener('mouseout', mostSongsMouseOut, false);

    }
    function mostSongsMouseOver() { most_songs_button.style.backgroundColor = "#1db954"; }
    function mostSongsMouseOut() { most_songs_button.style.backgroundColor = "#282828"; }
    function mostPercentageMouseOver() { most_percentage_button.style.backgroundColor = "#1db954"; }
    function mostPercentageMouseOut() { most_percentage_button.style.backgroundColor = "#282828"; }

    //Function for pressing the most_percentage_button
    function mostPercentageButtonFunction() {

        //Button only works if currently in most_songs mode
        if (mode == "most_songs") {

            //Stop loading albums
            clearInterval(LOADING_ALBUMS_INTERVAL);

            //Change colors of sorting buttons
            most_percentage_button.style.backgroundColor = "#1db954";
            most_songs_button.style.backgroundColor = "#282828";

            //Remove hover event listeners for most_percentage_button
            most_percentage_button.removeEventListener('mouseover', mostPercentageMouseOver, false);
            most_percentage_button.removeEventListener('mouseout', mostPercentageMouseOut, false);
            
            //Remove click and touch event listener for most_percentage_button
            most_percentage_button.removeEventListener('click', mostPercentageButtonFunction, false);
            most_percentage_button.removeEventListener('touchend', mostPercentageButtonFunction, false);

            //Print albums in most_percentage mode
            printResults("most_percentage");

        }

    }

    //Function for pressing most_songs_button
    function mostSongsButtonFunction() {

        if (mode == "most_percentage") {

            clearInterval(LOADING_ALBUMS_INTERVAL);

            most_percentage_button.style.backgroundColor = "#282828";
            most_songs_button.style.backgroundColor = "#1db954";

            most_songs_button.removeEventListener('mouseover', mostSongsMouseOver, false);
            most_songs_button.removeEventListener('mouseout', mostSongsMouseOut, false);

            most_songs_button.removeEventListener('click', mostSongsButtonFunction, false);
            most_songs_button.removeEventListener('touchend', mostSongsButtonFunction, false);

            printResults("most_songs");

        }

    }

    //But hide the text in the main_square_element as well as the login button
    document.getElementById("main_square_text").style.display = "none"
    document.getElementById("login_button").style.display = "none"

    //Resize and re-position the main_square 
    main_square.style.width = "98%";
    main_square.style.height = "auto";
    main_square.style.position = "absolute";
    main_square.style.margin = "0";
    main_square.style.left = "1vmin";
    main_square.style.top = "16vmin";
    main_square.style.bottom = "1vmin";

    //Set new formatting attributes for main_square
    main_square.style.color = "white";
    main_square.style.fontFamily = "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif";
    main_square.style.overflowY = "scroll"
    main_square.style.overflowX = "hidden"

    //Set up an interval to resize all text on screen when the window is resized
    var WINDOW_RESIZED_INTERVAL;
    window.addEventListener('resize', function() {

        //Wait until user has not resized window for 100ms
            //This is so we can make the assumption that the user has finished
            //resizing the window
        clearTimeout(WINDOW_RESIZED_INTERVAL);
        WINDOW_RESIZED_INTERVAL = setTimeout(function() { resizeOnScreenText(); }, 100);
        
    });
    
    //Resize text whenever the user scrolls
    main_square.addEventListener('scroll', resizeOnScreenText, false);

    //Load all albums into the album_images div
    var album_id = 0;
    //An interval is set to load one album at a time, every 1ms
        //This is to ensure the page remains responsive while loading them
    const LOADING_ALBUMS_INTERVAL = setInterval(loadAlbum, 1);
    function loadAlbum() {

        //Create a div for the current album information
        const div = document.createElement("div");
        div.setAttribute("id", "album_div_" + album_id);    //Give it an id

        //Set some style attributes for the div
        div.style.width = "auto";
        div.style.height = DEFAULT_ALBUM_DIV_HEIGHT + "vmin";
        div.style.backgroundColor = "#282828";
        div.style.color = "white";
        div.style.borderRadius = "1vmin"
        div.style.cursor = "pointer";
        div.style.position = "relative";
        div.style.display = "block";
        div.style.top = "0";
        div.style.left = "0";
        div.style.marginRight = "2vmin";
        div.style.marginTop = DEFAULT_ALBUM_MARGIN_TOP + "vmin";

        //Append album images to the div
        const img = new Image();
        img.src = array[album_id].album.images[0].url;
        div.appendChild(img);

        //Append spotify logo to the div
        const spotify_logo = new Image();
        spotify_logo.src = CURRENT_URL.substring(0, CURRENT_URL.indexOf("#")) + "/Spotify_Logo.png";
        spotify_logo.style.height = "auto";
        spotify_logo.style.width = DEFAULT_SPOTIFY_LOGO_WIDTH + "vmin";
        spotify_logo.style.top = "19.5vmin";    
        spotify_logo.id = "spotify_logo";
        spotify_logo.style.border = "solid"
        spotify_logo.style.borderColor = "#1db954";
        spotify_logo.style.borderRadius = "3vmin";
        spotify_logo.style.borderWidth = "0.3vmin";
        spotify_logo.style.padding = "0.3vmin 1vmin 0.3vmin 1vmin";
        spotify_logo.style.backgroundColor = "#181818";
        div.appendChild(spotify_logo);

        //Set event listeners for changing the background color of the spotify logo with hovering
        //over it
        spotify_logo.addEventListener('mouseover', function() {
            this.style.backgroundColor = "#282828";
        }, false);
        spotify_logo.addEventListener('mouseout', function() {
            this.style.backgroundColor = "#181818";
        }, false);
        spotify_logo.addEventListener('touchstart', function() {
            this.style.backgroundColor = "#282828";
        }, false);

        //Set event listeners for clicking or tapping the spotify logo to open the album link
        spotify_logo.addEventListener('touchend', function() {

            this.style.backgroundColor = "#181818";
        
            const album_id = Number(this.parentElement.id.substring("album_div_".length));

            if (mode == "most_songs")
                window.open(ALBUM_LIST[album_id].album.external_urls.spotify, '_blank');
            else
                window.open(ALBUM_LIST_BY_PERCENTAGE[album_id].album.external_urls.spotify, '_blank');
        
        }, false);
        spotify_logo.addEventListener('click', function() {

            const album_id = Number(this.parentElement.id.substring("album_div_".length));

            if (mode == "most_songs")
                window.open(ALBUM_LIST[album_id].album.external_urls.spotify, '_blank');
            else
                window.open(ALBUM_LIST_BY_PERCENTAGE[album_id].album.external_urls.spotify, '_blank');

        }, false);

        //Append album name to div
        var name = document.createElement("h1");
        name.textContent = array[album_id].album.name;
        div.appendChild(name);

        //Append album band to div
        var band = document.createElement("h2");
        band.textContent = array[album_id].album.artists[0].name;
        div.appendChild(band);

        //Append count to div
            //If in most_songs mode, count is number of songs saved from album
            //If in most_percentage mode, count is percentage of songs saved from album
        var count = document.createElement("h3");
        if (mode == "most_songs")
            count.textContent = array[album_id].getCount() + " songs saved";
        else if (mode == "most_percentage")
            count.textContent = Math.ceil(array[album_id].percentage) + "% of songs saved";
        div.appendChild(count);

        //Add event listeners for tapping or clicking on the album_div
            //Creates a touch event listener if the device is touch screen, otherwise create a mouse
            //listener
        if (isTouchDevice())
            div.addEventListener('touchstart', function(event) {

                if (event.target.id != "spotify_logo")
                    selectionHandler();

            }, false);
        else
            div.addEventListener('mousedown', function(event) {

                if (event.target.id != "spotify_logo")
                    selectionHandler();

            }, false);

        //Append div to album_images div
        document.getElementById("album_images").appendChild(div);

        //Fit text for all children into the div boundaries
        fitText(div, name);
        fitText(div, band);
        fitText(div, count);

        //Clear interval after we have loaded all albums
        if (album_id < num_of_albums - 1)
            album_id = album_id + 1;
        else
            clearInterval(LOADING_ALBUMS_INTERVAL);

        //Function for handling when the user clicks or taps on an album
        function selectionHandler() {

            //If the device is a touchDevice, add listeners for touchend and touchmove
            if (isTouchDevice()) {

                //When the user lifts their finger, call selectAlbum
                div.addEventListener('touchend', selectAlbum, false);

                //If the user moves their finger, remove the listeners for selecting the album
                    //This is because if the user moves their finger, we assume they are trying to
                    //scroll and therefore aren't trying to select the album
                div.addEventListener('touchmove', removeListeners, false);

            }
            else //call selectAlbum when user lifts up their mouse button
                div.addEventListener('mouseup', selectAlbum, false);

            //If the user scrolls, removeListeners as we assume they are not trying to select the
            //album
            main_square.addEventListener('scroll', removeListeners, false);

        }

        //Function for when the user actually selects the album
        function selectAlbum() {

            //Get the id of the album selected
            const id = Number(div.getAttribute('id').substring(("album_div_").length));
        
            //Check the current color of the div background to figure out which state it is in
                //It can either be in the state of already showing the songs or in the state of
                //not showing the songs
            if (getComputedStyle(div).backgroundColor == "rgb(40, 40, 40)") {
        
                //If it it is not showing songs yet, then we are selecting it to show us the songs

                //Change backgound color
                div.style.backgroundColor = "#3d3939";
        
                //Create element that the list of songs will be in
                const songs = document.createElement("body");
                div.appendChild(songs);

                //Get the number of songs in the album
                const num_of_songs = Object.keys(array[id].songs).length;

                //If the number of songs is zero, that means we haven't yet requested the list of
                //songs
                if (num_of_songs == 0) {

                    var album_tracks_received = 0;
                    var num_tracks_in_album = Infinity;

                    var request_url = "https://api.spotify.com/v1/albums/"
                    request_url += array[id].album.id

                    //So send request for first set of tracks in the album
                    sendRequest(request_url, function() {

                        var raw_response = this.responseText;
                        var response = JSON.parse(raw_response);

                        num_tracks_in_album = response.total_tracks;

                        handleAlbumTracksRetrieval(response);

                        //After we've receieved the first set of tracks from the album, we send
                        //requests for all remaining tracks in the album, MAX_REQUESTS_AT_A_TIME
                        //at a time
                        for (var i = album_tracks_received; i < num_tracks_in_album; i += response.tracks.limit) {
                            
                            //Build URL for current request
                            var new_url = request_url + "/tracks";
                            new_url += "?offset=" + i;
                            new_url += "&limit=" + MAX_REQUESTS_AT_A_TIME;

                            //Send the current request
                            sendRequest(new_url, function() {

                                raw_response = this.responseText;
                                response = JSON.parse(raw_response);

                                handleAlbumTracksRetrieval(response);

                            });

                        }

                    });

                    //Function for handling the retrieval of tracks in an album
                    function handleAlbumTracksRetrieval(response) {

                        var num_tracks_received = 0;

                        //The first set of tracks have slightly different JSON structure from the
                        //other sets, so we have a special condition here for detecting if the
                        //current set is the first set
                        if (album_tracks_received == 0) {

                            num_tracks_received = Object.keys(response.tracks.items).length;

                            for (var i = 0; i < num_tracks_received; i++)
                                array[id].songs.push(response.tracks.items[i]);

                        }
                        else {

                            num_tracks_received = Object.keys(response.items).length;

                            for (var i = 0; i < num_tracks_received; i++)
                                array[id].songs.push(response.items[i]);


                        }

                        album_tracks_received += num_tracks_received;

                        //Once we've receieved all of the tracks from the album, display the songs
                        if (album_tracks_received >= num_tracks_in_album)
                            displaySongs();

                    }

                }
                else    //If num_of_songs is not zero, then we have songs so display them
                    displaySongs();

                //Function for displaying the songs
                function displaySongs() {

                    //For every song in the album
                    for (var i = 0; i < Object.keys(array[id].songs).length; i++) {

                        //Create an element for the current song
                        const song = document.createElement("h4");

                        //If the current song is saved by the user, display it in green
                            //We add a heart to the beginning to kind of mimic the spotify layout
                        const album = array[id];
                        if (album.savedSongs.find(element => element.name == album.songs[i].name)) {

                            song.style.color = "#78b159"
                            song.textContent = "💚 ";

                        }
                        else    //Otherwise, just display it in white
                            song.textContent = "🤍 ";

                        //Append songname to element textContent
                        song.textContent += array[id].songs[i].name;
                        songs.appendChild(song);
            
                    }

                    //Resize song names so that they fit in div
                    resizeSongNames(div);

                    //Keep track of the tallest div for the purpose of optimizing song-name
                    //resizing
                    if(div.clientHeight > TALLEST_DIV_HEIGHT)
                        TALLEST_DIV_HEIGHT = div.clientHeight;

                }
            
            }
            else {
        
                //If songs are already showing, we want to remove them when we click the album
                div.getElementsByTagName("body")[0].remove();
        
                //Reset height and color of the div;
                div.style.height = DEFAULT_ALBUM_DIV_HEIGHT + "vmin";
                div.style.backgroundColor = "#282828";

                //Resize all the text on the screen when the user selects to hide the songs in an
                //album
                    //This is because decreasing the height of the div may move some albums back on
                    //to the screen that were not resized properly before because they were not
                    //previously visible on screen
                resizeOnScreenText();
        
            }

            //Once album has been selected, remove the listeners for selecting it
            removeListeners();

        }

        //Function for removing the listeners for selecting the album
        function removeListeners() {

            //Remove the listeners for selectAlbum
            div.removeEventListener('mouseup', selectAlbum, false);
            div.removeEventListener('touchend', selectAlbum, false);

            //Remove the listeners for removeListeners
            main_square.removeEventListener('scroll', removeListeners, false);
            div.removeEventListener('touchmove', removeListeners, false);

        }

    }

    //clear LOADING_BAR_INTERVAL once we are done loading all tracks
    clearInterval(LOADING_BAR_INTERVAL);

}

//Function for sending a request to the Spotify Web API
    //request_url = url to send GET request for
    //callback = function to call once reponse for request is receieved
    //args = arguments to pass to callback function
function sendRequest(request_url, callback, ...args) {

    //create request
    const xhr = new XMLHttpRequest();

    //Set callback function and arguments for callback function
    xhr.callback = callback;
    xhr.arguments = Array.prototype.slice.call(arguments, 2);

    //Handle successes and errors
    xhr.onload = xhrSuccess;
    xhr.onerror = xhrError;

    //Send GET request with Authorization token
    xhr.open("GET", request_url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + ACCESS_TOKEN);
    xhr.send(null)

}

//Function for crafting the URL for requesting a set of user-saved tracks
    //amount = amount of tracks to request
    //offset = index of first track to request
function craftUserTracksUrl(amount, offset) {

    var request_url = "https://api.spotify.com/v1/me/tracks?";
    request_url += "&limit=" + amount;
    request_url += "&offset=" + offset;

    return request_url;

}

//Variables used for animating the loading circle
var LOADING_BAR_INTERVAL;
var TICKS_SPENT_LOADING = 0
const LOADING_BAR_RADIUS = pixelsToVmin(getComputedStyle(loading_bar_moving_circle).bottom);

//Function that animates the loading circle
function updateLoadingBar() {

    const TICKS_PER_ROTATION = 240;
    const PI = 3.14159

    //Calcuate the current t value for calculating the X and Y values of the moving_circle
    t = TICKS_SPENT_LOADING / TICKS_PER_ROTATION * 2 * PI
    
    //Calculate X and Y for moving_circle
    x = Math.cos(t)
    y = Math.sin(t)

    //Set X and Y values for moving_circle
    loading_bar_moving_circle.style.bottom = x * LOADING_BAR_RADIUS + "vmin";
    loading_bar_moving_circle.style.left = y * LOADING_BAR_RADIUS + "vmin";

    //Keep track of how many milliseconds the loading circle has been active
    TICKS_SPENT_LOADING++;

    //Show the percentage of tracks recieved in the middle of the loading circle
    const loading_bar_percentage = document.getElementById("loading_bar_percentage");
    loading_bar_percentage.textContent = Math.round(100 * TRACKS_RECEIVED / TOTAL_TRACKS);

}

//Convert a value in the form "123px" to Number(123)
function pixelsToNumber(string) {

    return Number(string.substring(0, string.indexOf("px")));

}

//Convert a value measured in pixels to one measured in vmin
function pixelsToVmin(num_of_pixels) {

    if (typeof num_of_pixels === 'string' || num_of_pixels instanceof String)
        num_of_pixels = pixelsToNumber(num_of_pixels)
    return num_of_pixels * 100 / Math.min(window.innerWidth, window.innerHeight);

}

//Function for converting a measurement in vmin to a measurement in pixels
function vminToPixels(num_of_vmin) {

    return (num_of_vmin * Math.min(window.innerWidth, window.innerHeight) / 100);

}

//Get the default fontsize for all headers of childen of the album_images div
    //fontSize will never be greater than these
const H1_ELEMENT = document.getElementById("album_images").getElementsByTagName("h1")[0];
const H2_ELEMENT = document.getElementById("album_images").getElementsByTagName("h2")[0];
const H3_ELEMENT = document.getElementById("album_images").getElementsByTagName("h3")[0];
const H4_ELEMENT = document.getElementById("album_images").getElementsByTagName("h4")[0];
const DEFAULT_H1_FONT_SIZE = pixelsToVmin(getComputedStyle(H1_ELEMENT).fontSize);
const DEFAULT_H2_FONT_SIZE = pixelsToVmin(getComputedStyle(H2_ELEMENT).fontSize);
const DEFAULT_H3_FONT_SIZE = pixelsToVmin(getComputedStyle(H3_ELEMENT).fontSize);
const DEFAULT_H4_FONT_SIZE = pixelsToVmin(getComputedStyle(H4_ELEMENT).fontSize);

//Function for repositioning text so that it is exactly 1vmin to the right of the album art
    //This is because not all albums art have a standard size for some reason
function positionStuffBasedOnAlbumWidth(img_element, text_element, spotify_element) {

    //Get the image left and width 
    img_left = pixelsToVmin(getComputedStyle(img_element).left)
    img_width = pixelsToVmin(img_element.offsetWidth);
    
    //Reposition the text
    text_element.style.left = img_left + img_width + 1 + "vmin";

    //Reposition the spotify logo so that it is centered with the album
    const spotify_offset = 0.5 * (img_width - pixelsToVmin(spotify_element.clientWidth));
    spotify_element.style.left = 1 + spotify_offset + "vmin";

}

//Function for fitting an elements text into the boundaries of its parents div
function fitText(div, text_element) {

    //Get the img_element and check if its been loaded
    const img_element = div.getElementsByTagName("img")[0];
    const img_loaded = img_element.complete && img_element.naturalHeight !== 0;

    //Get the spotify_logo element for the current div
    const spotify_logo = div.querySelector("#spotify_logo");

    //Position the text if the image has been loaded
    if (img_loaded)
        positionStuffBasedOnAlbumWidth(img_element, text_element, spotify_logo)
    else    //If it hasn't been loaded, add an event listener to position text once image is loaded
        img_element.addEventListener('load', function() { 
            positionStuffBasedOnAlbumWidth(img_element, text_element, spotify_logo);
        }, false);

    //First, set its fontSize to the default
        //This is so fonts can resize upward if they were made smaller but then then the window was
        //enlarged
    if (text_element.tagName == "H1")
        text_element.style.fontSize = DEFAULT_H1_FONT_SIZE + "vmin";
    else if (text_element.tagName == "H2")
        text_element.style.fontSize = DEFAULT_H2_FONT_SIZE + "vmin";
    else if (text_element.tagName == "H3")
        text_element.style.fontSize = DEFAULT_H3_FONT_SIZE + "vmin";
    else if (text_element.tagName == "H4")
        text_element.style.fontSize = DEFAULT_H4_FONT_SIZE + "vmin";

    //Use some math to estimate what the maximum_font_size for the given textContent in the given
    //div based on the text_elements current left value would be.
    var num_of_chars = text_element.textContent.length;
    var max_width_in_pixels = div.clientWidth - pixelsToNumber(getComputedStyle(text_element).left);
    var max_character_width_in_pixels = max_width_in_pixels / num_of_chars;
    //We multiply by 0.74 at the end because this is a conservative estimate to ensure that text
    //never goes outside of the div
        //A sideeffect of this is that some text might end up being smaller than it needs to be
    var max_font_size = 2 * max_character_width_in_pixels * 0.74;

    //If it's current fontSize is greater than max_font_size, set it to max_font_size
    if (pixelsToNumber(getComputedStyle(text_element).fontSize) > max_font_size)
        text_element.style.fontSize = pixelsToVmin(max_font_size) + "vmin";

}

//Function for resizing all of the album div text on screen
function resizeOnScreenText() {

    //Get the id's of albums that are currently visible on screen
    const on_screen_album_ids = getOnScreenAlbumIDs();

    //Count number of albums currently visible on screen
    const num_of_albums = Object.keys(on_screen_album_ids).length;

    //Resize one album's text at a time, every 1ms
    var div_id = on_screen_album_ids[0];
    const RESIZING_DIV_INTERVAL = setInterval(resizeText, 1);
    function resizeText() {

        //Get the current div by its album_div_id
        const div = document.getElementById("album_div_" + div_id);

        //Fit the text of all header child elements
        fitText(div, div.getElementsByTagName("h1")[0]);
        fitText(div, div.getElementsByTagName("h2")[0]);
        fitText(div, div.getElementsByTagName("h3")[0]);

        //Resize song names if any h4 tags are present
            //An h4 tag being present means that the song names are currently being displayed
        if (Object.keys(div.getElementsByTagName("h4")).length > 0)
            resizeSongNames(div);

        //Stop resizing once all on-screen albums are finished
        if (div_id < on_screen_album_ids[num_of_albums - 1])
            div_id = div_id + 1;
        else    
            clearInterval(RESIZING_DIV_INTERVAL);

    }

}

//Function for resizing the text of all the song names in an album  
    //A seperate function is made because all song names should be the same size
        //This means if one song name is too long, it will cause all song names to become smaller
function resizeSongNames(div) {

    //We want all songs to have the same text size so that it looks nice

    const num_of_songs = Object.keys(div.getElementsByTagName("h4")).length;

    //First, find the smallest text size by resizing each song name
    var smallest_song_text_size = DEFAULT_H4_FONT_SIZE;
    for (var i = 0; i < num_of_songs; i++) {

        const song_div = div.getElementsByTagName("h4")[i];

        fitText(div, song_div);

        //Keep track of the smallest new text size
        if (pixelsToVmin(getComputedStyle(song_div).fontSize) < smallest_song_text_size)
            smallest_song_text_size = pixelsToVmin(getComputedStyle(song_div).fontSize);

    }
    //Then, set all song names to that smallest font size;
    for (var i = 0; i < num_of_songs; i++)
        div.getElementsByTagName("h4")[i].style.fontSize = smallest_song_text_size + "vmin";

    //Set div_height by using the height of the songs_div to fit all songs in it
    const songs = div.getElementsByTagName("body")[0];
    const songs_div_height = pixelsToVmin(getComputedStyle(songs).height);
    div.style.height = DEFAULT_ALBUM_DIV_HEIGHT + songs_div_height + "vmin";

}

//Keep track of the tallest div on the site
var TALLEST_DIV_HEIGHT = vminToPixels(DEFAULT_ALBUM_DIV_HEIGHT);

//Function for getting all albums currently visible on screen
function getOnScreenAlbumIDs() {
    
    var onscreen_albums = [];
    
    const main_square = document.getElementById("main_square");

    const num_of_albums = Object.keys(ALBUM_LIST).length;

    //The y-value of the top of the current scroll position
    const top_of_scroll = main_square.scrollTop;

    //The height_per_album is the height of an album plus the top margin of an album
    const height_per_album = vminToPixels(TALLEST_DIV_HEIGHT) + vminToPixels(DEFAULT_ALBUM_MARGIN_TOP);

    //The reason we keep track of the TALLEST_DIV_HEIGHT is so that we can calculate what the
    //minimum possible index of the first div currently on screen would be.
        //This is done by assuming that every div is as tall as the TALLEST_DIV_HEIGHT and
        //determining what the first album visible on screen would be if that were the case
            //In this hypothetical scenario, the min_first_album_index would just be 
            //top_of_scroll / height_per_album
    const min_first_album_index = Math.floor(top_of_scroll / height_per_album);

    //The reason we calculate min_first_album_index is so that when we run through some loops to
    //determine which albums are currently visible on screen, we don't iterate though any albums
    //that are literally impossible to be visible on screen based on the current scrollTop
        //This opitimizes the process by lowering the number of iterations that take place in the 
        //first loop below
    var index = min_first_album_index;

    //Increase index counter for every album that is not visible
        //This process is to find the first album index that is currently visible on screen
    while (!isVisible(getAlbumDiv(index)) && index < num_of_albums - 1)
        index++;

    //Once you find the first album that is currently visible, push it's index to the list
    onscreen_albums.push(index);
    index++;

    //From that first visible album, go down 1-by-1 and push each index onto the list that is also
    //visible
    while (isVisible(getAlbumDiv(index)) && index < num_of_albums) {

        onscreen_albums.push(index);
        index++;

    }

    //Once we reach another album that is not currently visible, we have found all of the albums
    //that are currently visible, so we can return the list
    return onscreen_albums;

    //Function for checking if the album_div is currently visible inside of the main_square element
    function isVisible(element) {

        if (element === null)
            return false;

        const main_square = document.getElementById("main_square");

        const sTop = main_square.scrollTop;
        const sBot = sTop + main_square.clientHeight;

        const eTop = element.offsetTop;
        const eBot = eTop + element.clientHeight;

        const totally_in_view = eTop >= sTop && eBot <= sBot;
        const partially_in_view = (eTop < sTop && eBot > sTop) || (eBot > sBot && eTop < sBot);

        return (totally_in_view || partially_in_view);
    
    }

}

//Function for checking if the device is a touch device
function isTouchDevice() {

    return (('ontouchstart' in window) || 
            (navigator.maxTouchPoints > 0) || 
            (navigator.msMaxTouchPoints > 0));

}

//Function that returns the actual document element of the given album_div_id
function getAlbumDiv(id) {

    return document.getElementById("album_div_" + id);

}

//Functions for handling successes and errors of sending http requests
function xhrSuccess() { 

    if (this.status == 200)
        this.callback.apply(this, this.arguments); 
    else    //Display responseText if status is not 200
        document.write(this.responseText);
}
function xhrError() { console.error(this.statusText); }

main()