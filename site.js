//Class definition for an entry in the ALBUM_LIST array
class album_entry {

    constructor(album) {

        this.album = album;
        this.count = 1;

    }

    incrementCount() { this.count = this.count + 1; }

    getCount() { return this.count; }

}

//Get the URL of the current page
const CURRENT_URL = window.location.href;

//Get the access token
const ACCESS_TOKEN = CURRENT_URL.substring(CURRENT_URL.indexOf("=") + 1, CURRENT_URL.indexOf("&"))

const MAX_REQUESTS_AT_A_TIME = 50;

//Variables used for receiving and storing tracks and albums
var ALBUM_LIST = []
var TOTAL_TRACKS = Infinity
var TRACKS_RECEIVED = 0

var LOADING_BAR_INTERVAL;

function main() {

    //If url does not have "#" in it, then we have not clicked the login button yet
    if (CURRENT_URL.indexOf("#") == -1) {

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

        //user-library-read is the only scope that needs to be requested in order to get the users saved
        //tracks
        var scope = 'user-library-read';

        const github_button = document.getElementById("github_button");
        github_button.addEventListener('click', () => {

            window.location = "https://github.com/RustyReich/Top-Spotify-Albums";

        })

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

        })

    }
    else {

        document.getElementById("main_square").style.display = "none"

        LOADING_BAR_INTERVAL = setInterval(updateLoadingBar, 1)

        //Request all the users tracks, and call printResults after all tracks have been receieved
        requestAllTracks(printResults)

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
function quickSortAlbumList(low, hight) {

    if (low < hight) {

        var pi = partition(low, hight);

        quickSortAlbumList(low, pi - 1);
        quickSortAlbumList(pi + 1, hight);

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

//Print results to the page
function printResults() {

    document.getElementById("loading_bar").style.display = "none"

    var num_of_albums = Object.keys(ALBUM_LIST).length
    
    quickSortAlbumList(0, num_of_albums - 1)

    const main_square = document.getElementById("main_square");
    main_square.style.display = "block";

    document.getElementById("main_square_text").style.display = "none"
    document.getElementById("login_button").style.display = "none"

    main_square.style.width = "98%";
    main_square.style.height = "90%";
    main_square.style.position = "fixed";
    main_square.style.left = "1%";
    main_square.style.top = "9vmin";

    main_square.style.color = "white";
    main_square.style.textAlign = "left";
    main_square.style.fontSize = "2vmin";
    main_square.style.fontFamily = "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif";
    main_square.style.whiteSpace = "pre-line"
    main_square.style.overflowY = "scroll"
    main_square.style.overflowX = "hidden"

    document.getElementById("album_images").display = "block"
    for (var i = 0; i < num_of_albums; i++) {

        var div = document.createElement("div");
        div.style.width = "98.5%";
        div.style.height = "20vmin";
        div.style.background = "#282828";
        div.style.color = "white";
        div.style.borderRadius = "1vmin"
        
        if (i != 0)
            div.style.marginTop = "1vmin";

        img = new Image();
        img.src = ALBUM_LIST[i].album.images[0].url;
        div.appendChild(img);

        var name = document.createElement("h1");
        name.textContent = ALBUM_LIST[i].album.name;
        div.appendChild(name);

        var band = document.createElement("h2");
        band.textContent = ALBUM_LIST[i].album.artists[0].name;
        div.appendChild(band);

        var count = document.createElement("h3");
        count.textContent = ALBUM_LIST[i].getCount() + " songs saved";
        div.appendChild(count);

        document.getElementById("album_images").appendChild(div);

        var num_of_chars = name.textContent.length
        var max_width_in_pixels = div.clientWidth - pixelsToNumber(getComputedStyle(name).left)
        var max_character_width_in_pixels = max_width_in_pixels / num_of_chars
        var max_font_size = 2 * max_character_width_in_pixels * 0.8;

        if (pixelsToNumber(getComputedStyle(name).fontSize) > max_font_size)
            name.style.fontSize = pixelsToVmin(max_font_size) + "vmin"

    }

    clearInterval(LOADING_BAR_INTERVAL);

}

//Request all tracks saved by the user
    //callback is the function to be called after all tracks have been received
function requestAllTracks(callback) {

    //Send request for first MAX_REQUEST_AT_A_TIME number of tracks
        //requestRemaining is passed as the callback so that it gets called after the first set of tracks
        //have been received
    sendRequest(MAX_REQUESTS_AT_A_TIME, 0, requestRemaining, callback)

}

//Function to be called after the first set of tracks have been receieved.
    //The first set of tracks must be receieved separately so that we can find out how many TOTAL_TRACKS 
    //there are.
    //Once we know TOTAL_TRACKS, we can send requests for all other tracks
        //callback is the function to be called after all responses have been received
function requestRemaining(callback) {

    //As long as there are still more tracks to received, keep sending requests
    if (TOTAL_TRACKS > TRACKS_RECEIVED) {

        //Make sure to not request more tracks than are remaining
        if (MAX_REQUESTS_AT_A_TIME > TOTAL_TRACKS - TRACKS_RECEIVED)
            sendRequest(TOTAL_TRACKS - TRACKS_RECEIVED, TRACKS_RECEIVED, requestRemaining, callback);
        else
            sendRequest(MAX_REQUESTS_AT_A_TIME, TRACKS_RECEIVED, requestRemaining, callback)

    }
    else    //Once we have receieved all tracks, call the callback function
        if (typeof callback == 'function')
            callback();

}

//Funcion that actually sends the requests for tracks
    //amount is the number of tracks to request
    //offset is the index of the first track
    //callback is the function to run after the current request has received a response
    //args are the arguments to that callback function
function sendRequest(amount, offset, callback, ...args) {

    //Craft request url
    var request_url = "https://api.spotify.com/v1/me/tracks?";
    request_url += "&limit=" + amount;
    request_url += "&offset=" + offset;

    const xhr = new XMLHttpRequest();

    //receieveResponse gets called once the request has receieved a response
    xhr.callback = receieveResponse;
    //We pass callback and its arguments to receieveResponse 
    xhr.arguments = Array.prototype.slice.call(arguments, 2)
    xhr.onload = xhrSuccess;
    xhr.onerror = xhrError;

    //Make sure to include ACCESS_TOKEN in headers
    xhr.open("GET", request_url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + ACCESS_TOKEN);
    xhr.send(null)

}

//Function that gets called once a response for a request has been receieved
function receieveResponse(callback, ...args) {

    //Conver JSON response into object
    const raw_response = this.responseText;
    const response = JSON.parse(raw_response);

    //Save total number of tracks
    TOTAL_TRACKS = response.total;

    //Count the number of tracks that were receieved in the response
    const num_tracks_received = Object.keys(response.items).length;

    //For every track received in the current response
    for (var i = 0; i < num_tracks_received; i++) {

        //Check if the current tracks album is already in the ALBUM_LIST array
        current_tracks_album = response.items[i].track.album;
        album_list_id = albumInList(current_tracks_album);

        //If it is not in the array
        if (album_list_id == -1) {

            //Push the album onto the array
            const curr_album_entry = new album_entry(current_tracks_album);
            ALBUM_LIST.push(curr_album_entry);

        }
        else    //If it is in the array already, then increment the count for the album
            ALBUM_LIST[album_list_id].incrementCount();

    }

    //Keep track of the number of tracks receieved so far
    TRACKS_RECEIVED += num_tracks_received;

    //Call the callback function if it is present
    if (typeof callback == 'function')
    {

        //Callback should only ever be passed here with a single or no arguments. If there is a single
        //argument, that argument should be another callback function.
            //So here, we just check if that argument is there, and call callback() with that argument if
            //it is there
        if (typeof arguments[1] == 'function')
            callback(arguments[1]);
        else    //If it's not there, just call callback() with no argument
            callback();

    }

}

var TICKS_SPENT_LOADING = 0

function updateLoadingBar() {

    const vmin = Math.min(window.innerWidth, window.innerHeight);
    const radius = 9.3; //Change this to grab radius from initial bottom value
    const TICKS_PER_ROTATION = 240;
    const PI = 3.14159

    t = TICKS_SPENT_LOADING / TICKS_PER_ROTATION * 2 * PI
    
    x = Math.cos(t)
    y = Math.sin(t)

    const loading_bar_moving_circle = document.getElementById("loading_bar_moving_circle");
    loading_bar_moving_circle.style.bottom = x * radius + "vmin";
    loading_bar_moving_circle.style.left = y * radius + "vmin";

    TICKS_SPENT_LOADING++;

    const loading_bar_percentage = document.getElementById("loading_bar_percentage");
    loading_bar_percentage.textContent = Math.round(100 * TRACKS_RECEIVED / TOTAL_TRACKS);

}

function pixelsToNumber(string) {

    return Number(string.substring(0, string.indexOf("px")));

}

function pixelsToVmin(num_of_pixels) {

    return num_of_pixels * 100 / Math.min(window.innerWidth, window.innerHeight);

}

//Functions for handling successes and errors of sending http requests
function xhrSuccess() { this.callback.apply(this, this.arguments); }
function xhrError() { console.error(this.statusText); }

main()