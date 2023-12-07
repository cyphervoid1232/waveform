import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { create as createWavsurfer, WaveSurfer } from 'wavesurfer.js'
import { create as createRegions } from 'wavesurfer.js/dist/plugin/wavesurfer.regions.js'
import { create as createMinimap } from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.js'
import { create as createTimeline } from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.js'
import * as _ from 'lodash'
import { KeyCode } from './keycode';
import { Observable, fromEvent, merge, combineLatest } from 'rxjs';
import { filter, distinctUntilChanged, share, tap  } from 'rxjs/operators';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'angular-wavesurfer';
  wavesurfer
  currentNote = "Snore"
  fileName = "train_only_a/102_Actual_1"
  snorColor = 'rgba(187, 242, 125, 0.5)'
  snorLessColor = "rgb(153, 255, 204, 0.5)"
  snoreOutColor = "rgb(0, 51, 204, 0.5)"
  squeeceColor = "rgba(168, 162, 217, 0.5)"
  tooNoiseColor = "rgba(255, 255, 102, 0.5)"
  start_skip_time = 0
  // start_skip_time = 7200
  // start_skip_time = 14400
  // start_skip_time = 21600
  // start_skip_time = 28800
  loundColor = "rgba(238, 149, 139, 0.5)"
  daydreamColor = "rgba(255, 80, 80, 0.5)"
  silentColor = "rgba(166, 166, 166, 0.5)"

  constructor(private zone: NgZone) { }

  ngOnInit() {
    console.log('WaveSurfer :>> ', WaveSurfer);
  }

  ngAfterViewInit() {
    // console.log('createRegions :>> ', createRegions);
    console.log("ngAfterViewInit")
    // document.addEventListener('DOMContentLoaded', function() {
    // this.zone.run(() => {
    const regions = createRegions()
    console.log('regions :>> ', regions);
    this.wavesurfer = createWavsurfer({
      container: '#waveform',
      height: 600,
      pixelRatio: 1,
      scrollParent: true,
      normalize: true,
      minimap: true,
      backend: 'MediaElement',
      // backgroundColor: "red",
      plugins: [
        regions,
        createMinimap({
          height: 100,
          waveColor: '#ddd',
          progressColor: '#999',
          cursorColor: '#999'
        }),
        createTimeline({
          container: '#wave-timeline'
        })
      ]
    });
    // this.wavesurfer.util
    //   .fetchFile({
    //     responseType: 'json',
    //     url: `assets/${this.fileName}.json
    //   })
    //   .on('success', function (data) {
    //     this.wavesurfer.load(
    //       `assets/${this.fileName}.mp3,
    //       data
    //     );
    //   });

    this.wavesurfer.load(
      `assets/${this.fileName}.mp3`,
    );
    // this.wavesurfer.load(
    //   `assets/${this.fileName}.wav`,
    // );

    /* Regions */
    this.wavesurfer.on('ready', () => {
      this.wavesurfer.enableDragSelection({
        color: this.snorColor,
        data: { note: "Snore" },
        attributes: { label: this.currentNote, highlight: true }
      });
      console.log('this.wavesurfer.getVolume() :>> ', this.wavesurfer.getVolume());
      // this.wavesurfer.setVolume(1)
      this.wavesurfer.on("region-update-end", (region) => {
        console.log("u[date end: ", region)
        // create and dump json here
      })
      console.log("ready")
      if (localStorage.regions) {
        // let storageJson = JSON.parse(localStorage.regions)
        // storageJson = _.map(storageJson, (object) => {
        //   if(object.attributes.label === 'Snoreless'){
        //     return {
        //       ...object,
        //       data: {note: "Snoreout"},
        //       attributes: {label: "Snoreout", highlight: true}
        //     }
        //   }
        //   return object
        // })
        // console.log('storageJson :>> ', storageJson);
        this.loadRegions(JSON.parse(localStorage.regions));
        // this.loadRegions(storageJson);
        // this.saveRegions()
      } else {
        // loadRegions(
        //     extractRegions(
        //         this.wavesurfer.backend.getPeaks(512),
        //         this.wavesurfer.getDuration()
        //     )
        // );

        fetch(`assets/${this.fileName}_annotation.json`)
            .then(r => r.json())
            .then(data => {
              this.loadRegions(data);
              this.saveRegions();
            });
      }
    });
    this.wavesurfer.on('region-click', (region, e) => {
      e.stopPropagation();
      // Play on click, loop on shift click
      e.shiftKey ? region.playLoop() : region.play();
    });
    this.wavesurfer.on('region-click', this.editAnnotation);
    this.wavesurfer.on('region-updated', this.saveRegions);
    this.wavesurfer.on('region-removed', this.saveRegions);
    this.wavesurfer.on('region-in', this.showNote);

    this.wavesurfer.on('region-play', (region) => {
      region.once('out', () => {
        this.wavesurfer.play(region.start);
        this.wavesurfer.pause();
      });
    });

    /* Toggle play/pause buttons. */
    let playButton = document.querySelector('#play');
    let pauseButton = document.querySelector('#pause');
    this.wavesurfer.on('play', () => {
      console.log("awdawd")
      playButton.setAttribute('style.display', 'none')
      pauseButton.setAttribute('style.display', '')
      // playButton.style.display = 'none';
      // pauseButton.style.display = '';
    });
    this.wavesurfer.on('pause', () => {
      playButton.setAttribute('style.display', '')
      pauseButton.setAttribute('style.display', 'none')
      // playButton.style.display = '';
      // pauseButton.style.display = 'none';
    });


    document.querySelector(
      '[data-action="delete-region"]'
    ).addEventListener('click', () => {
      let form = document.forms as any;
      form = form.edit
      let regionId = form.dataset.region;
      if (regionId) {
        this.wavesurfer.regions.list[regionId].remove();
        form.reset();
      }
    });

    this.assignShotcut()
    // })
    // })
  }

  assignShotcut = () => {
    // const playTrack = this.shortcut([KeyCode.KeyQ]);

    // playTrack.pipe(tap(() => {
    //   this.wavesurfer.play()
    // })).subscribe();

    // const pauseTrack = this.shortcut([KeyCode.KeyS]);

    // pauseTrack.pipe(tap(() => {
    //   this.wavesurfer.pause()
    // })).subscribe();

    const playPauseTrack = this.shortcut([KeyCode.KeyQ]);

    playPauseTrack.pipe(tap(() => {
      if(this.wavesurfer.isPlaying()){
        this.wavesurfer.pause()
      }else{
        this.wavesurfer.play()
      }
    })).subscribe();

    const snoreLabel = this.shortcut([KeyCode.Digit1]);

    snoreLabel.pipe(tap(() => {
      console.log("press 1")
      this.chageNote("Snore")
    })).subscribe();

    const sqeeceLabel = this.shortcut([KeyCode.Digit2]);

    sqeeceLabel.pipe(tap(() => {
      console.log("press 2")
      this.chageNote("Sqeece")
    })).subscribe();

    const loundLabel = this.shortcut([KeyCode.Digit3]);

    loundLabel.pipe(tap(() => {
      this.chageNote("Lound")
    })).subscribe();

    const daydreamLabel = this.shortcut([KeyCode.Digit4]);

    daydreamLabel.pipe(tap(() => {
      this.chageNote("Daydream")
    })).subscribe();

    const silentLabel = this.shortcut([KeyCode.Digit5]);

    silentLabel.pipe(tap(() => {
      this.chageNote("Silent")
    })).subscribe();

    const snorelessLabel = this.shortcut([KeyCode.Digit6]);

    snorelessLabel.pipe(tap(() => {
      this.chageNote("Snoreless")
    })).subscribe();

    const snoreoutLabel = this.shortcut([KeyCode.Digit7]);

    snoreoutLabel.pipe(tap(() => {
      this.chageNote("Snoreout")
    })).subscribe();

    const tooNoiseLabel = this.shortcut([KeyCode.Digit8]);

    tooNoiseLabel.pipe(tap(() => {
      this.chageNote("TooNoise")
    })).subscribe();
  }
 
  saveRegions = () => {
    localStorage.regions = JSON.stringify(
      Object.keys(this.wavesurfer.regions.list).map((id) => {
        let region = this.wavesurfer.regions.list[id];
        return {
          start: region.start,
          end: region.end,
          attributes: region.attributes,
          data: region.data,
        };
      })
    );
  }

  /**
  * Load regions from localStorage.
  */
  loadRegions = (regions) => {
    regions.forEach((region) => {
      if(region.attributes.label === 'Snore'){
        region.color = this.snorColor
      }else if(region.attributes.label === 'Sqeece'){
        region.color = this.squeeceColor
      }else if(region.attributes.label === 'Lound'){
        region.color = this.loundColor
      }else if(region.attributes.label === 'Daydream'){
        region.color = this.daydreamColor
      }else if(region.attributes.label === 'Silent'){
        region.color = this.silentColor
      }else if(region.attributes.label === 'Snoreless'){
        region.color = this.snorLessColor
      }else if(region.attributes.label === 'Snoreout'){
        region.color = this.snoreOutColor
      
      }else if(region.attributes.label === 'TooNoise'){
        region.color = this.tooNoiseColor
      }
      else{
        region.color = this.randomColor(0.1);
      }
      this.wavesurfer.addRegion(region);
    });
  }

  /**
  * Extract regions separated by silence.
  */
  extractRegions = (peaks, duration) => {
    // Silence params
    const minValue = 0.0015;
    const minSeconds = 0.25;

    let length = peaks.length;
    let coef = duration / length;
    let minLen = minSeconds / coef;

    // Gather silence indeces
    let silences = [];
    Array.prototype.forEach.call(peaks, (val, index) => {
      if (Math.abs(val) <= minValue) {
        silences.push(index);
      }
    });

    // Cluster silence values
    let clusters = [];
    silences.forEach((val, index) => {
      if (clusters.length && val == silences[index - 1] + 1) {
        clusters[clusters.length - 1].push(val);
      } else {
        clusters.push([val]);
      }
    });

    // Filter silence clusters by minimum length
    let fClusters = clusters.filter((cluster) => {
      return cluster.length >= minLen;
    });

    // Create regions on the edges of silences
    let regions = fClusters.map((cluster, index) => {
      let next = fClusters[index + 1];
      return {
        start: cluster[cluster.length - 1],
        end: next ? next[0] : length - 1
      };
    });

    // Add an initial region if the audio doesn't start with silence
    let firstCluster = fClusters[0];
    if (firstCluster && firstCluster[0] != 0) {
      regions.unshift({
        start: 0,
        end: firstCluster[firstCluster.length - 1]
      });
    }

    // Filter regions by minimum length
    let fRegions = regions.filter((reg) => {
      return reg.end - reg.start >= minLen;
    });

    // Return time-based regions
    return fRegions.map((reg) => {
      return {
        start: Math.round(reg.start * coef * 10) / 10,
        end: Math.round(reg.end * coef * 10) / 10
      };
    });
  }

  /**
  * Random RGBA color.
  */
  randomColor = (alpha) => {
    return (
      'rgba(' +
      [
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        alpha || 1
      ] +
      ')'
    );
  }

  /**
  * Edit annotation for a region.
  */
  editAnnotation = (region) => {
    let form = document.forms as any;
    form = form.edit
    form.style.opacity = 1;
    (form.elements.start.value = Math.round(region.start * 10) / 10),
      (form.elements.end.value = Math.round(region.end * 10) / 10);
    form.elements.note.value = region.data.note || '';
    form.onsubmit = (e) => {
      e.preventDefault();
      region.update({
        start: form.elements.start.value,
        end: form.elements.end.value,
        data: {
          note: form.elements.note.value
        },
        attributes: {
          label: form.elements.note.value
        }
      });
      form.style.opacity = 0;
    };
    form.onreset = () => {
      form.style.opacity = 0;
      form.dataset.region = null;
    };
    form.dataset.region = region.id;
  }

  /**
  * Display annotation.
  */
  showNote = (region) => {
    // if (!showNote.el) {
    //     showNote.el = document.querySelector('#subtitle');
    // }
    // showNote.el.textContent = region.data.note || '–';
    console.log("showNote: ", region.data.note || '–')
  }

  onPlay = () => {
    console.log("onPlay: ")
    console.log('this.wavesurfer :>> ', this.wavesurfer);
    this.wavesurfer.play()
  }

  onPause = () => {
    console.log("onPause: ")
    this.wavesurfer.pause()
  }

  chageNote = (note) => {
    console.log("note: ", note)
    this.currentNote = note
    let color
    if(note === 'Snore'){
      color = this.snorColor
    }else if(note === 'Sqeece'){
      color = this.squeeceColor
    }else if(note === 'Lound'){
      color = this.loundColor
    }else if(note === 'Daydream'){
      color = this.daydreamColor
    }else if(note === 'Silent'){
      color = this.silentColor
    }else if(note === 'Snoreless'){
      color = this.snorLessColor
    }else if(note === 'Snoreout'){
      color = this.snoreOutColor
    }else if(note === 'TooNoise'){
      color = this.tooNoiseColor
    }else{
      color = this.randomColor(0.1);
    }
    this.wavesurfer.enableDragSelection({ data: { note }, attributes: { label: note, highlight: true }, color })
  }

  exportData = () => {
    const windowSize = 30 // s
    const regions = JSON.parse(localStorage.regions)
    if (!regions) { 
      console.log("Cannot find localStorage?.regions")
      return
    }
    console.log('regions :>> ', regions);
    const exportData = _.chain(regions).map((region) => {
      return {...region, epoch: Math.floor((region.start + this.start_skip_time) / windowSize) + 1, duration: region.end - region.start, start_skip_time: this.start_skip_time}
    }).sortBy(['start'])

    console.log('exportData :>> ', exportData);

    this.download(exportData, `${this.fileName}_annotation.json`, 'application/json');
  }

  download(content, fileName, contentType) {
    var a = document.createElement("a");
    const data = JSON.stringify(content, null, 2)
    var file = new Blob([data], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  shortcut = (shortcut: KeyCode[]): Observable<KeyboardEvent[]> => {
    // Observables for all keydown and keyup events
    const keyDown$ = fromEvent<KeyboardEvent>(document, 'keydown');
    const keyUp$ = fromEvent<KeyboardEvent>(document, 'keyup');
  
    // All KeyboardEvents - emitted only when KeyboardEvent changes (key or type)
    const keyEvents$ = merge(keyDown$, keyUp$).pipe(
      distinctUntilChanged((a, b) => a.code === b.code && a.type === b.type),
      share()
    );
    // Create KeyboardEvent Observable for specified KeyCode
    const createKeyPressStream = (charCode: KeyCode) =>
      keyEvents$.pipe(filter((event) => {
        // console.log('event :>> ', event);
        return event.code === charCode.valueOf()
      }));
  
    // Create Event Stream for every KeyCode in shortcut
    const keyCodeEvents$ = shortcut.map((s) => createKeyPressStream(s));
  
    // Emit when specified keys are pressed (keydown).
    // Emit only when all specified keys are pressed at the same time.
    // More on combineLatest below
    return combineLatest(keyCodeEvents$).pipe(
      filter<KeyboardEvent[]>((arr) => arr.every((a) => a.type === 'keydown'))
    );
  };
}  
