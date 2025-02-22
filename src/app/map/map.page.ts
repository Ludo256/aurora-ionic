import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { Map, NavigationControl, Marker } from 'maplibre-gl';
import * as SunCalc from 'suncalc';

import { Ovation } from '../utils/ovation';
import { ApiService } from '../services/api.service';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: false,
})
export class MapPage implements OnInit {

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  map: Map | undefined;
  mapLoaded = false;

  ovations: Ovation[] = [];
  ovationsLoaded = false;
  minTime: Date = new Date();
  maxTime: Date = new Date();

  selectedTime: Date = new Date();
  selectedOvation: Ovation | undefined;
  marker: Marker | undefined;
  auroraValue: number = 0;

  constructor(private apiService: ApiService, private settingsService: SettingsService) {
    this.loadOvations();

    this.settingsService.locationSubject.subscribe(location => {
      this.marker?.setLngLat([location.lon, location.lat]);
      this.updateMarkerValue();
    });
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.initMap();
  }

  initMap() {
    this.map = new Map({
      attributionControl: false,
      container: this.mapContainer.nativeElement,
      center: [-118, 52.87],
      zoom: 3,
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
        'sky': {
            'atmosphere-blend': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 0.6,
                5, 0.6,
                7, 0
            ],
        }
      }
    });

    this.map.addControl(new NavigationControl(), 'top-right');

    this.map.on('load', () => {
      this.mapLoaded = true;
      this.initMarker();

      if(this.ovationsLoaded) {
        this.loadOvationData(this.ovations[0]);
      }
    });
  }

  initMarker() {

    if(!this.map) {
      return;
    }

    this.marker = new Marker({
      color: '#888',
      draggable: true
    });

    const location = this.settingsService.selectedLocation;
    this.marker.setLngLat([location.lon, location.lat]).addTo(this.map);

    this.marker.on('drag', () => {
      this.settingsService.setSelectedLocation({
        lat: this.marker?.getLngLat().lat || 0,
        lon: this.marker?.getLngLat().lng || 0
      });
    });
  }

  async loadOvations() {
    const results = await this.apiService.get('/forecast/ovations') as [any];
    results.forEach(result => {
      const ovation = new Ovation(this.apiService, new Date(result.time), new Date(result.issued), result.data);
      this.ovations.push(ovation);
    });
    this.ovationsLoaded = true;
    this.minTime = this.ovations[0].time;
    this.maxTime = this.ovations[this.ovations.length - 1].time;
    this.selectedOvation = this.ovations[0];
    this.selectedTime = this.minTime;

    if(this.mapLoaded) {
      this.loadOvationData(this.selectedOvation);
    }
  }

  async loadOvationData(ovation: Ovation) {
    await ovation.loadData(() => {
      this.addOvationToMap(ovation);
      this.paintSelectedOvation();
    });
  }

  addOvationToMap(ovation: Ovation) {
    this.map?.addSource(`ovation-${ovation.time.getTime()}`, {
      type: 'image',
      url: ovation.image || '',
      coordinates: [
        [-180, 85.06 ], // Top-left corner
        [180, 85.06 ],  // Top-right corner
        [180, -85.06 ], // Bottom-right corner
        [-180, -85.06 ] // Bottom-left corner
      ]
    });

    this.map?.addLayer({
      id: `ovation-${ovation.time.getTime()}`,
      source: `ovation-${ovation.time.getTime()}`,
      type: 'raster',
      paint: {
        'raster-opacity': 0.0,
      },
    });
  }

  onSliderChange(event: any) {
    this.selectedTime = new Date(this.minTime?.getTime() + (this.maxTime?.getTime() - this.minTime?.getTime()) * event.detail.value / 100);

    let newSelectedOvation;
    for(let i = 0; i < this.ovations.length; i++) {
      if(this.ovations[i].time.getTime() > this.selectedTime.getTime()) {
        break;
      }
      newSelectedOvation = this.ovations[i];
    }

    if(newSelectedOvation == null || newSelectedOvation == this.selectedOvation) {
      return;
    }

    this.selectedOvation = newSelectedOvation;

    if(!this.selectedOvation.image) {  
      this.loadOvationData(this.selectedOvation);
    } else {
      this.paintSelectedOvation();
    }
  }

  paintSelectedOvation() {
    for(let ovation of this.ovations) {
      if(ovation === this.selectedOvation && this.map?.getLayer(`ovation-${ovation.time.getTime()}`)) {
        this.map?.setPaintProperty(`ovation-${ovation.time.getTime()}`, 'raster-opacity', 0.5);
      } else {
        if(this.map?.getLayer(`ovation-${ovation.time.getTime()}`)) {
          this.map?.setPaintProperty(`ovation-${ovation.time.getTime()}`, 'raster-opacity', 0.0);
        }
      }
    }

    this.updateMarkerValue();
    this.setLightPosition();
  }

  updateMarkerValue() {
    const coordinates = this.marker?.getLngLat();
    if(coordinates) {
      const value = this.selectedOvation?.getValue(coordinates.lng, coordinates.lat);

      if(value != null) {
        this.auroraValue = value;
      }
    }
  }

  setLightPosition() {
    // this.map?.setLight({
    //   anchor: 'map',
    //   position: [1.5, inclination, longitude-ish],
    //   color: '#ffffff',
    //   intensity:
    //     Math.max(0.5, Math.min(1.0, 1.0 - Math.abs(altitude) / 90))
    // });
  }
}

