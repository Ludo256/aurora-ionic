import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { Map, NavigationControl, Marker } from 'maplibre-gl';

import { OvationService, Ovation } from '../services/ovation.service';
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

  minTime: Date = new Date();
  maxTime: Date = new Date();
  rangeValue: number = 0;
  selectedTime: Date = new Date();

  marker: Marker | undefined;
  selectedLongitude: number = 0;
  selectedLatitude: number = 0;

  selectedOvation: Ovation | undefined;
  auroraValue: number = 0;

  constructor(private ovationService:OvationService, private settingsService: SettingsService) {
    this.settingsService.selectedLocationSubject.subscribe(location => {
      this.selectedLatitude = location.lat;
      this.selectedLongitude = location.lon;
      this.marker?.setLngLat([location.lon, location.lat]);
      this.updateMarkerValue();
    });

    this.ovationService.newOvationSubject.subscribe(ovation => {
      this.addOvationToMap(ovation);
      this.onSliderChange();
    });

    this.ovationService.minTimeSubject.subscribe(time => {
      this.minTime = time;
      this.rangeValue = (this.selectedTime.getTime() - this.minTime.getTime()) / (this.maxTime.getTime() - this.minTime.getTime()) * 100;
    });

    this.ovationService.maxTimeSubject.subscribe(time => {
      this.maxTime = time;
      this.rangeValue = (this.selectedTime.getTime() - this.minTime.getTime()) / (this.maxTime.getTime() - this.minTime.getTime()) * 100;
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
      const latLng = this.marker?.getLngLat();
      this.settingsService.setSelectedLocation({
        lat: latLng?.lat || 0,
        lon: latLng?.lng || 0
      });
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
        'raster-opacity': 0.5,
      },
      layout: {
        'visibility': 'none'
      }
    });
  }

  onSliderChange() {
    this.selectedTime = new Date(this.minTime?.getTime() + (this.maxTime?.getTime() - this.minTime?.getTime()) * this.rangeValue / 100);
    const newOvation = this.ovationService.getNearestOvation(this.selectedTime);
    if(newOvation != this.selectedOvation) {
      this.selectedOvation = newOvation;
      this.paintSelectedOvation();
    }
  }

  paintSelectedOvation() {
    const layers = this.map?.getStyle().layers || [];
    for(let layer of layers) {
      if(layer.id.startsWith('ovation-')) {
        this.map?.setLayoutProperty(layer.id, 'visibility', 'none');
      }
      
      if(layer.id == `ovation-${this.selectedOvation?.time.getTime()}`) {
        this.map?.setLayoutProperty(layer.id, 'visibility', 'visible');
      }
    }

    this.updateMarkerValue();
    this.setLightPosition();
  }

  updateMarkerValue() {
    const coordinates = this.marker?.getLngLat();
    let lon = coordinates?.lng || 0;
    let lat = coordinates?.lat || 0;

    if(coordinates) {
      lon = Math.round((lon + 360 * 1000) % 360);
      lat = Math.round(lat + 90);

      if(this.selectedOvation?.coordinates && this.selectedOvation.coordinates[lon] && this.selectedOvation.coordinates[lon][lat] != null) {
        this.auroraValue = this.selectedOvation.coordinates[lon][lat];
      } else {
        this.auroraValue = 0;
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

