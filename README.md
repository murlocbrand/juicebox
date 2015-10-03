# juicebox
juicebox is an extremely simple media server that can stream audio.

## concept
server that you interact with via RESTful HTTP requests.  
will be able to play audio from many sources, most notably from your own collection.  
you queue a track url and juicebox will stream from that url provided a plugin supports it.  

## features
 - all communication with the server relies on json
 - looping play queue, exposed as a RESTful resource
 - play audio from bandcamp, youtube and piratradio

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
juicebox serves a status page at `localhost:8888`  

*adding tracks to queue:*  
```
curl -X POST localhost:8888/queue \
	-H "Content-Type: application/json" \
	-d "{ 'url' : '<youtube url>' }"
```

*what's up next?:*
```
curl localhost:8888/queue | jq
```

*what's playing now?:*
```
curl localhost:8888/queue/0 | jq
```

*what are my playlists?:*
```
curl localhost:8888/playlist | jq
```

## supported urls
 - youtube (youtube.com/watch?v=olala)
 - bandcamp (bandcamp.com/album/yayaya | bandcamp.com/track/nanana )

## special urls
 - bandcamp mp3 urls (popplers5.bandcamp.com)

## license
MIT
