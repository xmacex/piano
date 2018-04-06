# Piano with Audio Sprites

A piano thing for Frameworks and Architecture for the Web course at ITU, using the idea of Audio Sprites. Sources of inspiration include Chris Heilmann's [HTML5 audio and audio sprites – this should be simple](https://hacks.mozilla.org/2012/04/html5-audio-and-audio-sprites-this-should-be-simple/) and Stoyan Stefanov's post [*Audio Sprites*](http://www.phpied.com/audio-sprites/) Mozilla's [MDN web docs](https://developer.mozilla.org/), and other places.

The piano samples are from University of Iowa's [Electronic Music Studios](http://theremin.music.uiowa.edu/MISpiano.html), and were trimmed and transcoded to MP3 with [ffmpeg](https://www.ffmpeg.org). Thank you.

## API

Instantiate a new Piano by first sourcing the `piano.js` file, e.g. in HTML

```html
<script src="piano.js"></script>
```

And then from Javascript you can instantiate and initialize the piano

```javascript
p = new Piano();
p.init();
```

The constructor accepts one parameter, which is an URL to a JSON structure, which for each dynamic defines a filename for the concatenated samples, and a dict of notes and begin and endtimes for the sprites.

The `init()` accepts one parameter too, namely a CSS selector into which a rudimentary HTML UI will be built for testing purposes.

Then play the piano by giving a note, and optionally a dynamic. Note that these must match exactly the playtime structure.

```javascript
p.playNote('C4');
p.playNote('D4', 'pp');
```

## Audio sample preparation

After downloading the samples with a bit of Python automation, the following steps were performed. I'm writing these after the fact, based on notes and my shell history, so please don't assume the workflow to be complete, though the commands are more or less what I did. I'm providing these so that you can see the steps, commands and parameter I used.

### Conversion to MP3

With bash, I transcoded from original AIFF to MP3 with ffmpeg, and also converted from stereo to mono

```bash
for f in downloads/*.aiff ;do ffmpeg -i $f -ac 1 mp3/$(basename $f .aiff).mp3 ;done
```

### Silence trimming

Then trim silence from the beginning with ffmpeg, using the [*silenceremove* filter](https://ffmpeg.org/ffmpeg-filters.html#silenceremove). This filter removes first segment of silence at the beginning of the sample, with threshold of -60dB.

```bash
for f in mp3/* ;do ffmpeg -i $f -filter 'silenceremove=1:0:-60dB' mp3-trimmed/$(basename $f) ;done
```

### File re-organization per dynamic

Then organization of the files to directories per dynamic

```bash
mkdir ff mf pp
cp mp3-trimmed/Piano.ff* ff
cp mp3-trimmed/Piano.mf* mf
cp mp3-trimmed/Piano.pp* pp
```

Then I removed redundant information from filenames of the `Piano.pp.Bb2.aiff` pattern, which is now part of the path name, for each of the three directories `ff`, `mf` and `pp`.

```bash
for f in * ;do mv $f $(echo $f |cut -d'.' -f 3-) ;done
```

The filenames are now of pattern `pp/Bb2.mp3`.

### Sample playtime extraction

Then, since the idea of Audio Sprites is to jump around in an audio file, we need lenght of each of the samples. ffmpeg's [`ffprobe`](https://www.ffmpeg.org/ffprobe.html) can be used to calculate them, and a bit of Unix love magic ✨ helps us to achieve a pretty CSV file.

```bash
for f in {ff,mf,pp}/*mp3 ;do echo ff,$(basename $f),$(ffprobe -loglevel 0 -print_format compact -show_entries stream=duration $f |cut -d'=' -f2) ;done
```

The CSV file looks like this

    pp,A1.mp3,34.481633
    pp,A2.mp3,36.754286
    pp,A3.mp3,36.310204
    pp,A4.mp3,22.256327
    ⋮

Then, converting the CSV to a JSON file with Python. First read in the CSV file and group it by dynamic

```python
with open('playtimes.csv') as fd:
    reader = csv.reader(fd)
    playtimes_dyns = list(reader)

playtimes_dyns_dict = {}

for d, n, t in playtimes_dyns:
    playtimes_dyns_dict[d][n] = float(t)
```

Then run a little algorithm to calculate cumulative time for the concatenation, which will be done below for the audio samples. All of this is using lexical order of the notes, a more domainspecific, musical theoretical ordering would be nicer maybe.

```python
playtimes_cum = {'pp': {}, 'mf': {}, 'ff': {}}
for dynamic, dyndata in playtimes_dyns_dict.items():
    cumtime = 0
    for n, t in dyndata.items():
        playtimes_cum[dynamic][n.split('.')[0]] = {
            'begin':round(cumtime, 2),
            'end': round(cumtime + t, 2),
            'playtime': round(t, 2)}
        cumtime = cumtime + t
```

Then finally write the `playtimes_cum` dict to a JSON file

```python
with open("playtimes-as.json", 'w') as fd:
    fd.write(json.dumps(playtimes_dyns_dict, indent=4))
```

Which gives this sort of a file

```json
{
    "pp": {
        "A1": {
            "begin": 0,
            "end": 34.48,
            "playtime": 34.48
        },
        "A2": {
            "begin": 34.48,
            "end": 71.24,
            "playtime": 36.75
        },
        "A3": {
            "begin": 71.24,
            "end": 107.55,
            "playtime": 36.31
        },
        ⋮
```

Which I later, after some programming work, manually changed to this

```json
{
    "pp": {
        "filename": "pp/pp.mp3",
        "sprites": {
            "A1": {
                "begin": 0,
                "end": 34.48,
                "playtime": 34.48
            },
            "A2": {
                "begin": 34.48,
                "end": 71.24,
                "playtime": 36.75
            },
            "A3": {
                "begin": 71.24,
                "end": 107.55,
                "playtime": 36.31
            },
            ⋮
```

### Audio Sprite concatenation

Ok so to get all of these samples into a single file, one per dynamic, [ffmpeg was used to concatenate](https://trac.ffmpeg.org/wiki/Concatenate) them. First an input file was created

```bash
for f in ff/* ;do echo "file '$f'" ;done >ff.files
for f in mf/* ;do echo "file '$f'" ;done >mf.files
for f in pp/* ;do echo "file '$f'" ;done >pp.files
```

and finally concatenated with

```bash
ffmpeg -f concat -safe 0 -i ff.files -c copy ff.mp3
ffmpeg -f concat -safe 0 -i mf.files -c copy mf.mp3
ffmpeg -f concat -safe 0 -i pp.files -c copy pp.mp3
```

And later on, the three files were moved into the `ff`, `mf` and `pp` files, and the individual samples deleted.

Sorted.

## Limitations

### Polyphony

The implementation, as it is, is limited in polyphony – only one note can play from any of the dynamics at a time, though the dynamics can play in parellel. The Audio Sprites are implemented for all the ~88 notes across 3 dynamics, instead of 3 dynamics across the ~88 keys. This doesn't match how a physical piano works, of course.

### Audio Sprite does not work solve pre-buffering

The idea was to limit the number of HTTP requests and media resources down from one per sample ie. 3 * ~88 = ~264. The current Audio Sprite implementation has 3 resources to download, the one which would map to physical piano would have ~88. The HTTP >= 1.1 protocol uses the `Range` request header to ask the server to transfer a particular segment of it, and the response contains `Content-Range` header. So the idea of Audio Sprite does not really work around lag, as was hoped.
