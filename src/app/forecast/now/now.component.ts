import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { ApiService } from 'src/app/services/api.service';
import { Ovation } from 'src/app/utils/ovation';

import { Map, NavigationControl } from 'maplibre-gl';

@Component({
  selector: 'app-now',
  templateUrl: './now.component.html',
  styleUrls: ['./now.component.scss'],
})
export class NowComponent  implements OnInit {

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  ovation: Ovation | undefined;
  map: Map | undefined;

  constructor(private apiService: ApiService) {
    this.loadOvation();
  }

  ngOnInit() {}

  ngAfterViewInit() {
     this.map = new Map({
      container: this.mapContainer.nativeElement,
      // style: 'https://demotiles.maplibre.org/style.json',
      center: [-118, 52.87],
      zoom: 5,
      style: {
        'version': 8,
        'projection': {
            'type': 'globe'
        },
        'sources': {
            'satellite': {
                'url': 'https://api.maptiler.com/tiles/satellite-v2/tiles.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
                'type': 'raster'
            },
        },
        'layers': [
            {
                'id': 'Satellite',
                'type': 'raster',
                'source': 'satellite',
            },
        ],
        // 'sky': {
        //     'atmosphere-blend': [
        //         'interpolate',
        //         ['linear'],
        //         ['zoom'],
        //         0, 1,
        //         5, 1,
        //         7, 0
        //     ]
        // },
        // 'light': {
        //     'anchor': 'map',
        //     'position': [1.5, 90, 80]
        // }
    }
    });

    this.map.addControl(new NavigationControl(), 'top-right');

    
  }

  async loadOvation() {
    const ovation: Ovation = await this.apiService.get('/ovation/2025-02-14T03:04:00Z') as Ovation;
    // inflateCoordinates(ovation);
    // createOvationImage(ovation);
    // createContour(ovation);
    this.ovation = ovation;

    if(!this.map) {
      console.log('map not ready');
      return;
    } else {
      console.log('map ready');
    }

    console.log('Adding contour to map');

    // this.map.addSource('contours', {
    //   type: 'geojson',
    //   data: ovation.contour
    // });

    // console.log('Added source');

    // this.map.addLayer({
    //   id: 'contours',
    //   type: 'line',
    //   source: 'contours',
    //   paint: {
    //     'line-color': [
    //       'interpolate',
    //       ['linear'],
    //       ['get', 'value'],
    //       2, '#f00',
    //       5, '#0f0',
    //       10, '#00f',
    //       15, '#ff0'
    //     ],
    //     'line-width': 2
    //   }
    // });

    // console.log('Added layer');


    // this.map.addSource('world-image', {
    //   type: 'image',
    //   url: ovation.image,
    //   coordinates: [
    //     [-180, 85.06 ], // Top-left corner
    //     [180, 85.06 ],  // Top-right corner
    //     [180, -85.06 ], // Bottom-right corner
    //     [-180, -85.06 ] // Bottom-left corner
    //   ]
    // });

    // this.map.addLayer({
    //   id: 'world-layer',
    //   source: 'world-image',
    //   type: 'raster',
    //   paint: {
    //     'raster-opacity': 0.5
    //   },
      
    // });
  }

}

