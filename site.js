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

function main() {

    //If url does not have "#" in it, then we have not clicked the login button yet
    if (CURRENT_URL.indexOf("#") == -1) {

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

    document.getElementById("loading_bar").textContent = ""

    var num_of_albums = Object.keys(ALBUM_LIST).length
    console.log(num_of_albums)
    
    quickSortAlbumList(0, num_of_albums - 1)

    for (var i = 0; i < num_of_albums; i++)
        document.write(ALBUM_LIST[i].album.name + " | " + ALBUM_LIST[i].getCount() + "<br>")

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

    //Update the loading bar
    document.getElementById("loading_bar").textContent = Math.round(100*TRACKS_RECEIVED/TOTAL_TRACKS) + "%";

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

//Functions for handling successes and errors of sending http requests
function xhrSuccess() { this.callback.apply(this, this.arguments); }
function xhrError() { console.error(this.statusText); }

main()