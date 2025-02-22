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

  }

  ngOnInit() {
    
  }



}

