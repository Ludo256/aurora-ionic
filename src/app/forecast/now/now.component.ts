import { Component, OnInit } from '@angular/core';

import { ApiService } from 'src/app/services/api.service';
import { Ovation, inflateCoordinates, createOvationImage } from 'src/app/utils/ovation';

@Component({
  selector: 'app-now',
  templateUrl: './now.component.html',
  styleUrls: ['./now.component.scss'],
})
export class NowComponent  implements OnInit {

  ovation: Ovation | undefined;

  constructor(private apiService: ApiService) {
    this.loadOvation();
  }

  ngOnInit() {}

  async loadOvation() {
    const ovation: Ovation = await this.apiService.get('/ovation/2025-02-12T14:26:00.000+00:00') as Ovation;
    inflateCoordinates(ovation);
    createOvationImage(ovation);
    this.ovation = ovation;
  }

}
