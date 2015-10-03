# juicebox
juicebox is a simple media server that can play audio from various sources.

## concept
It is as server that exposes functions and data over HTTP.  
Put it in your bathtub, wagon, boombox or other music vehicle of choice.  
Plugin-based url processing system that converts uri to audio.  

## features
 - all communication with the server relies on json
 - looping play queue, exposed as a RESTful resource
 - play audio from your local library, bandcamp, youtube and piratradio

## installation
 1 either `ffplay` or `avplay` installed and on path.  
 2 nodejs and npm: [download](https://nodejs.org/en/download/)  
 3 `which` unix tool  

avconv example install on ubuntu: `sudo apt-get install libav-tools`

installing juicebox itself is simple:  
 - `git clone https://github.com/murlocbrand/juicebox.git`
 - `cd juicebox && npm install`

## running juicebox
before running, check out the `config.toml` file and make edits if you want.  
the config file should be fairly self-explaining and have sensible defaults.  

run juicebox: `cd juicebox && node ./index.js`

## usage
the index page (/) contains some controls for easy control.

juicebox serves a status page at `localhost:8888/status`  

*adding tracks to queue*  
```
curl -X POST localhost:8888/queue \
	-H "Content-Type: application/json" \
	-d "{ 'url' : '<youtube url>' }"
```

*what's up next?*
```
curl localhost:8888/queue | jq
```

*what's playing now?*
```
curl localhost:8888/queue/0 | jq
```

*what are my playlists?*
```
curl localhost:8888/playlist | jq
```

*did you say shuffle?*
```
curl localhost:8888/shuffle
```

*huh, this song sucks!*
```
curl localhost:8888/next
```

## supported urls
 - youtube (youtube.com/watch?v=olala)
 - bandcamp (bandcamp.com/album/yayaya | bandcamp.com/track/nanana )
 - piratradio (piratrad.io/stationurl)
 - local uri (/home/bathman/Music/CoolAlbum/CoolTraK.mp3)
   (mp3/flac confirmed, but should play all ffmpeg/avconv-supported formats)

## special urls
 - bandcamp mp3 urls (popplers5.bandcamp.com)

## license
MIT
