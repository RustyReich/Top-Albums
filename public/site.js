class album_entry {

    constructor(album) {

        this.album = album
        this.count = 1

    }

    incrementCount() { this.count = this.count + 1 }

    getCount() { return this.count }

}

//Get the URL of the current page
var current_url = window.location.href

//If url does not have "#" in it, then we have not clicked the login button yet
if (current_url.indexOf("#") == -1) {

    //Set client ID and redirect_uri for the Spotify web app
    var client_id = 'cd65bb285db248e4b6352828ac986b66';
    var redirect_uri = 'http://localhost:8888/'

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

    //Parse access token from url
    var access_token = current_url.substring(current_url.indexOf("=") + 1);
    access_token = access_token.substring(0, access_token.indexOf("&"));

    //50 tracks is the maximum number that can be requested at a time
    const MAX_TRACKS_AT_A_TIME = 50

    //Variables and arrays for requesting and storing all user-saved tracks
    var tracks_remaining = Infinity
    var offset = 0
    
    var album_list = []

    //While there are no more tracks remaining to request
    while (tracks_remaining > 0) {

        //Construct request url with proper limit and offset queury parameters
        var request_url = "https://api.spotify.com/v1/me/tracks?";
        request_url += "limit=" + MAX_TRACKS_AT_A_TIME
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

//Generate a random string of letters and digits that is the specified length
function generateRandomString(length) {

    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    var result = ''
    for (var i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result

}

function albumInList(album_list, currAlbum) {

    var num_of_albums = Object.keys(album_list).length

    for (var i = 0; i < num_of_albums; i++)
        if (album_list[i].album.id == currAlbum.id)
            return i
    return -1

}

function quickSortAlbumList(album_list, low, hight) {

    var album_count = Object.keys(album_list).length

    if (low < hight) {

        var pi = partition(album_list, low, hight)

        quickSortAlbumList(album_list, low, pi - 1)
        quickSortAlbumList(album_list, pi + 1, hight)

    }

}

function partition(album_list, low, high) {

    var pivot = album_list[high]
    var i = (low - 1)

    for (var j = low; j <= high - 1; j++) {

        if (album_list[j].count > pivot.count) {

            i++
            swap(album_list, i, j)

        }

    }

    swap(album_list, i + 1, high)
    return (i + 1)

}

function swap(album_list, i, j) {

    var temp = album_list[i];
    album_list[i] = album_list[j]
    album_list[j] = temp

}