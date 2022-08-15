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
const TRACK_REQUESTS_AT_A_TIME = 50;

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

        //user-library-read is the only scope that needs to be requested in order to get the
        //users saved tracks
        var scope = 'user-library-read';

        //Add "Login to Spotify" button
        const button = document.createElement('button');
        button.innerText = 'Login to Spotify';
        button.id = 'loginButton';

        //Redirect to "Authorization" spotify link upon clicking the button
        button.addEventListener('click', () => {

            var url = 'https://accounts.spotify.com/authorize';
            url += '?response_type=token';
            url += '&client_id=' + encodeURIComponent(client_id);
            url += '&scope=' + encodeURIComponent(scope);
            url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
            url += '&state=' + encodeURIComponent(state);

            window.location = url;

        })
        document.body.appendChild(button);

    }
    else {

        requestAllTracks(printResults)

/*
        while (tracks_remaining > 0) {
            console.log(TOTAL_TRACKS)
            if (TOTAL_TRACKS != Infinity) {

                requestTracks(TRACK_REQUESTS_AT_A_TIME, offset)
                tracks_remaining = TOTAL_TRACKS - offset - TRACK_REQUESTS_AT_A_TIME
                offset += TRACK_REQUESTS_AT_A_TIME
                
            }

        }
*/
    }

}

/*
//If url does not have "#" in it, then we have not clicked the login button yet
if (CURRENT_URL.indexOf("#") == -1) {

    //Set client ID and redirect_uri for the Spotify web app
    var client_id = 'cd65bb285db248e4b6352828ac986b66';
    var redirect_uri = CURRENT_URL

    //Generate random 16-character string for state
    var state = generateRandomString(16);

    //Save stateKey with state
    var stateKey = 'spotify_auth_state'
    localStorage.setItem(stateKey, state);

    //user-library-read is the only scope that needs to be requested in order to get the
    //users saved tracks
    var scope = 'user-library-read'

    //Add "Login to Spotify" button
    const button = document.createElement('button')
    button.innerText = 'Login to Spotify'
    button.id = 'loginButton'

    //Redirect to "Authorization" spotify link upon clicking the button
    button.addEventListener('click', () => {

        var url = 'https://accounts.spotify.com/authorize';
        url += '?response_type=token';
        url += '&client_id=' + encodeURIComponent(client_id);
        url += '&scope=' + encodeURIComponent(scope);
        url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
        url += '&state=' + encodeURIComponent(state);

        window.location = url

    })
    document.body.appendChild(button)

}
else {  //Otherwise, we've already clicked the login button and been redirected

    const TRACK_REQUESTS_AT_A_TIME = 50

    var tracks_remaining = Infinity
    var offset = 0

    var album_list = []

    while (tracks_remaining > 0) {

        var request_url = "https://api.spotify.com/v1/me/tracks?"
        request_url += "limit=" + TRACK_REQUESTS_AT_A_TIME
        request_url += "&offset=" + offset

    }

    //var request_url = "https://api.spotify.com/v1/me/tracks"

    //loadFile(request_url, test)

/*
    //50 tracks is the maximum number that can be requested at a time
    const TRACK_REQUESTS_AT_A_TIME = 50

    //Variables and arrays for requesting and storing all user-saved tracks
    var tracks_remaining = Infinity
    var offset = 0
    
    var album_list = []

    //While there are no more tracks remaining to request
    while (tracks_remaining > 0) {

        //Construct request url with proper limit and offset queury parameters
        var request_url = "https://api.spotify.com/v1/me/tracks?";
        request_url += "limit=" + TRACK_REQUESTS_AT_A_TIME
        request_url += "&offset=" + offset

        //Send request
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", request_url, false);
        xmlHttp.setRequestHeader("Authorization", "Bearer " + access_token);
        xmlHttp.send(null);
        //Parse response into a javascript object
        var raw_response = xmlHttp.responseText
        var response = JSON.parse(raw_response)

        document.getElementById("loading_bar").textContent = 
            Math.round(100 * offset / response.total) + "%";

        //Count the number of tracks receieved from the current request
        var num_tracks_received = Object.keys(response).length

        //Update number of tracks remaining
        tracks_remaining = response.total - offset - num_tracks_received

        for(var i = 0; i < num_tracks_received; i++) {

            current_tracks_album = response.items[i].track.album

            album_list_id = albumInList(album_list, current_tracks_album)

            if (album_list_id == -1) {

                var curr_album_entry = new album_entry(current_tracks_album)
                album_list.push(curr_album_entry)

            }
            else
                album_list[album_list_id].incrementCount()

        }

        //Increase offset by number of tracks received
        offset = offset + num_tracks_received

    }

    document.getElementById("loading_bar").textContent = ""

    var num_of_albums = Object.keys(album_list).length

    quickSortAlbumList(album_list, 0, num_of_albums - 1)

    for (var i = 0; i < num_of_albums; i++)
        document.write(album_list[i].album.name +  " | " + album_list[i].getCount() + "<br>")

}
*/

//Generate a random string of letters and digits that is the specified length
function generateRandomString(length) {

    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    var result = '';
    for (var i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result;

}

function albumInList(currAlbum) {

    var num_of_albums = Object.keys(ALBUM_LIST).length;

    for (var i = 0; i < num_of_albums; i++)
        if (ALBUM_LIST[i].album.id == currAlbum.id)
            return i;
    return -1;

}

function quickSortAlbumList(album_list, low, hight) {

    var album_count = Object.keys(album_list).length;

    if (low < hight) {

        var pi = partition(album_list, low, hight);

        quickSortAlbumList(album_list, low, pi - 1);
        quickSortAlbumList(album_list, pi + 1, hight);

    }

}

function partition(album_list, low, high) {

    var pivot = album_list[high];
    var i = (low - 1);

    for (var j = low; j <= high - 1; j++) {

        if (album_list[j].count > pivot.count) {

            i++;
            swap(album_list, i, j);

        }

    }

    swap(album_list, i + 1, high);
    return (i + 1);

}

function swap(album_list, i, j) {

    var temp = album_list[i];
    album_list[i] = album_list[j];
    album_list[j] = temp;

}

function printResults() {
    console.log("test")
    document.getElementById("loading_bar").textContent = ""

    var num_of_albums = Object.keys(ALBUM_LIST).length
    
    quickSortAlbumList(ALBUM_LIST, 0, num_of_albums - 1)

    for (var i = 0; i < num_of_albums; i++)
        document.write(ALBUM_LIST[i].album.name + " | " + ALBUM_LIST[i].getCount() + "<br>")

}

function requestAllTracks(callback) {

    sendRequest(MAX_REQUESTS_AT_A_TIME, 0, requestRemaining, callback)

}

function requestRemaining(callback) {

    if (TOTAL_TRACKS > TRACKS_RECEIVED) {

        if (MAX_REQUESTS_AT_A_TIME > TOTAL_TRACKS - TRACKS_RECEIVED)
            sendRequest(TOTAL_TRACKS - TRACKS_RECEIVED, TRACKS_RECEIVED, requestRemaining, callback);
        else
            sendRequest(MAX_REQUESTS_AT_A_TIME, TRACKS_RECEIVED, requestRemaining, callback)

    }
    else
        if (typeof callback == 'function')
            callback();

}

function sendRequest(amount, offset, callback, ...args) {

    var request_url = "https://api.spotify.com/v1/me/tracks?";
    request_url += "&limit=" + amount;
    request_url += "&offset=" + offset;

    const xhr = new XMLHttpRequest();

    xhr.callback = receieveResponse;
    xhr.arguments = Array.prototype.slice.call(arguments, 2)
    xhr.onload = xhrSuccess;
    xhr.onerror = xhrError;

    xhr.open("GET", request_url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + ACCESS_TOKEN);
    xhr.send(null)

}

function receieveResponse(callback, ...args) {

    const raw_response = this.responseText;
    const response = JSON.parse(raw_response);

    TOTAL_TRACKS = response.total;

    const num_tracks_received = Object.keys(response.items).length;
    //document.write(raw_response)
    //console.log("num_tracks_receieved: " + num_tracks_received)
    //console.log("limit: " + response.limit)
    for (var i = 0; i < num_tracks_received; i++) {

        current_tracks_album = response.items[i].track.album;

        album_list_id = albumInList(current_tracks_album);

        if (album_list_id == -1) {

            const curr_album_entry = new album_entry(current_tracks_album);
            ALBUM_LIST.push(curr_album_entry);

        }
        else
            ALBUM_LIST[album_list_id].incrementCount();

    }

    TRACKS_RECEIVED += num_tracks_received;

    document.getElementById("loading_bar").textContent = Math.round(100*TRACKS_RECEIVED/TOTAL_TRACKS) + "%";

    if (typeof callback == 'function')
    {

        if (typeof arguments[1] == 'function')
            callback(arguments[1]);
        else
            callback();

    }

}

function xhrSuccess() { this.callback.apply(this, this.arguments); }
function xhrError() { console.error(this.statusText); }

main()