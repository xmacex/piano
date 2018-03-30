# Piano with Audio Sprites

A piano thing for Frameworks and Architecture for the Web course at ITU, using the idea of Audio Sprites. Soureces of inspiration include Chris Heilmann's [HTML5 audio and audio sprites – this should be simple](https://hacks.mozilla.org/2012/04/html5-audio-and-audio-sprites-this-should-be-simple/) and Stoyan Stefanov's post [*Audio Sprites*](http://www.phpied.com/audio-sprites/) Mozilla's [MDN web docs](https://developer.mozilla.org/), and other places.

The piano samples are from University of Iowa's [Electronic Music Studios](http://theremin.music.uiowa.edu/MISpiano.html), and were trimmed and transcoded to MP3 with [ffmpeg](https://www.ffmpeg.org). Thank you.

## Audio sample preparation

After downloading the samples with a bit of Python automation, the following steps were performed. I'm writing these after the fact, based on notes and my shell history, so please don't assume the workflow to be complete, though the commands are more or less what I did. I'm providing these so that you can see the steps, commands and parameter I used.

### Conversion to MP3

With bash, I transcoded from original AIFF to MP3 with ffmpeg, and also converted from stereo to mono

    for f in downloads/*.aiff ;do ffmpeg -i $f -ac 1 mp3/$(basename $f .aiff).mp3 ;done

### Silence trimming

Then trim silence from the beginning with ffmpeg, using the [*silenceremove* filter](https://ffmpeg.org/ffmpeg-filters.html#silenceremove). This filter removes first segment of silence at the beginning of the sample, with threshold of -60dB.

    for f in mp3/* ;do ffmpeg -i $f -filter 'silenceremove=1:0:-60dB' mp3-trimmed/$(basename $f) ;done

### File re-organization per dynamic

Then organization of the files to directories per dynamic

    mkdir ff mf pp
    cp mp3-trimmed/Piano.ff* ff
    cp mp3-trimmed/Piano.mf* mf
    cp mp3-trimmed/Piano.pp* pp

Then I removed redundant information from filenames of the `Piano.pp.Bb2.aiff` pattern, which is now part of the path name, for each of the three directories `ff`, `mf` and `pp`.

    for f in * ;do mv $f $(echo $f |cut -d'.' -f 3-) ;done

The filenames are now of pattern `pp/Bb2.mp3`.

### Sample playtime extraction

Then, since the idea of Audio Sprites is to jump around in an audio file, we need lenght of each of the samples. ffmpeg's [`ffprobe`](https://www.ffmpeg.org/ffprobe.html) can be used to calculate them, and a bit of Unix love magic ✨ helps us to achieve a pretty CSV file.

    for f in {ff,mf,pp}/*mp3 ;do echo ff,$(basename $f),$(ffprobe -loglevel 0 -print_format compact -show_entries stream=duration $f |cut -d'=' -f2) ;done

The CSV file looks like this

    pp,A1.mp3,34.481633
    pp,A2.mp3,36.754286
    pp,A3.mp3,36.310204
    pp,A4.mp3,22.256327
    ⋮

Then, converting the CSV to a JSON file with Python. First read in the CSV file and group it by dynamic

    with open('playtimes.csv') as fd:
        reader = csv.reader(fd)
        playtimes_dyns = list(reader)

    playtimes_dyns_dict = {}

    for d, n, t in playtimes_dyns:
        playtimes_dyns_dict[d][n] = float(t)

Then run a little algorithm to calculate cumulative time for the concatenation, which will be done below for the audio samples. All of this is using lexical order of the notes, a more domainspecific, musical theoretical ordering would be nicer maybe.

    playtimes_cum = {'pp': {}, 'mf': {}, 'ff': {}}
    for dynamic, dyndata in playtimes_dyns_dict.items():
        cumtime = 0
        for n, t in dyndata.items():
            playtimes_cum[dynamic][n.split('.')[0]] = {
                'begin':round(cumtime, 2),
                'end': round(cumtime + t, 2),
                'playtime': round(t, 2)}
            cumtime = cumtime + t

Then finally write the `playtimes_cum` dict to a JSON file

    with open("playtimes-as.json", 'w') as fd:
        fd.write(json.dumps(playtimes_dyns_dict, indent=4))

Which gives this sort of a file

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

Which I later, after some programming work, manually changed to this

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

### Audio Sprite concatenation

Ok so to get all of these samples into a single file, one per dynamic, [ffmpeg was used to concatenate](https://trac.ffmpeg.org/wiki/Concatenate) them. First an input file was created

    for f in ff/* ;do echo "file '$f'" ;done >ff.files
    for f in mf/* ;do echo "file '$f'" ;done >mf.files
    for f in pp/* ;do echo "file '$f'" ;done >pp.files

and finally concatenated with

    ffmpeg -f concat -safe 0 -i ff.files -c copy ff.mp3
    ffmpeg -f concat -safe 0 -i mf.files -c copy mf.mp3
    ffmpeg -f concat -safe 0 -i pp.files -c copy pp.mp3

And later on, the three files were moved into the `ff`, `mf` and `pp` files, and the individual samples deleted.

Sorted.