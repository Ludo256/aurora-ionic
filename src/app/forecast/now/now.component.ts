import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { OvationService } from 'src/app/services/ovation.service';

import { Map, NavigationControl } from 'maplibre-gl';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
  selector: 'app-now',
  templateUrl: './now.component.html',
  styleUrls: ['./now.component.scss'],
})
export class NowComponent  implements OnInit {

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  map: Map | undefined;
  values: any[] = [];

  constructor(private ovationService: OvationService, settingsService: SettingsService) {
    
    settingsService.selectedLocationSubject.subscribe(location => {
      const now = new Date();
      const later = new Date(now.getTime() + 1000 * 60 * 60 * 24);
      this.values = this.ovationService.getValues(now, later, location.lat, location.lon);
    });
  }

  ngOnInit() {
  
  }



}

