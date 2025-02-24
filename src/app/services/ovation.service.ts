import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { inflateSync } from 'fflate';
import proj4 from 'proj4';

import { ApiService } from './api.service';
import { getGradientColorValue } from '../utils/colors';

export interface Ovation {
    time: Date;
    issued: Date;
    data: any | undefined;
    coordinates: number[][] | undefined;
    image: string | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class OvationService {

  ovations = new Map<number, Ovation>();

  imageWidth = 360;
  imageHeight = 180;

  lonProjections: number[] = [];
  latProjections: number[] = [];

  newOvationSubject: Subject<Ovation> = new Subject<Ovation>();
  minTime: Date = new Date();
  minTimeSubject: Subject<Date> = new Subject<Date>();
  maxTime: Date = new Date();
  maxTimeSubject: Subject<Date> = new Subject<Date>();
  
  constructor(private apiService: ApiService) {
    this.initProjection();
    
    this.loadOvations();
    setInterval(() => {
      this.loadOvations();
    }, 2 * 60 * 1000);
  }

  initProjection() {
    const wgs84 = 'EPSG:4326';
    const webMercator = 'EPSG:3857';
    
    for(let x=0; x < this.imageWidth; x++) {
        const mercatorLon = ((x / this.imageWidth) - 0.5) * 2 * 20037508.34;
        const wgs84Coordinates = proj4(webMercator, wgs84, [mercatorLon, 0]);
        this.lonProjections.push(wgs84Coordinates[0]);
    }

    for(let y=0; y < this.imageHeight; y++) {
        const mercatorLat = ((y / this.imageHeight) - 0.5) * 2 * 20048966.1;
        const wgs84Coordinates = proj4(webMercator, wgs84, [0, mercatorLat]);
        this.latProjections.push(wgs84Coordinates[1]);
    }
  }

  private async loadOvations() {
    const results = await this.apiService.get('/forecast/ovations') as [any];
    results.forEach(result => {

      const time = new Date(result.time);
      if(time < this.minTime) {
        this.minTime = time;
        this.minTimeSubject.next(this.minTime);
      }
      if(time > this.maxTime) {
        this.maxTime = time;
        this.maxTimeSubject.next(this.maxTime);
      }
      
      if(!this.ovations.has(time.getTime())) {
        this.loadOvation(result.time);
      }   
    });
  }

  private async loadOvation(time: string) {
    const result = await this.apiService.get(`/ovation/${time}`) as any;
    let ovation: Ovation = {
      time: new Date(result.time),
      issued: new Date(result.issued),
      data: result.data,
      coordinates: undefined,
      image: undefined
    };

    this.inflateCoordinates(ovation);
    this.createOvationImage(ovation);
    delete ovation.data; // Free up memory

    this.ovations.set(ovation.time.getTime(), ovation);

    this.newOvationSubject.next(ovation);
  }

  private inflateCoordinates(ovation: Ovation) {

      const binaryString = window.atob(ovation.data);
      let uint8Array = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
      }

      // remove the first 2 bytes and last 4 bytes (because of the zip format)
      uint8Array = uint8Array.slice(2, -4);
      const decompressed = inflateSync(uint8Array);

      const metadataLength = new DataView(decompressed.buffer).getUint32(0, false);
      // const metadataString = new TextDecoder().decode(decompressed.slice(4, 4 + metadataLength));
      // const metadata = JSON.parse(metadataString);

      ovation.coordinates = Array.from({ length: 360 }, () => Array(181).fill(0))

      const offset = 4 + metadataLength;
      for (let lon = 0; lon < 360; lon++) {
          for (let lat = 0; lat < 181; lat++) {
              const value = decompressed[offset + lon * 181 + lat];
              ovation.coordinates[lon][lat] = value;
          }
      }
  }

  private createOvationImage(ovation: Ovation) {

    if(!ovation.coordinates) {
        throw new Error('Coordinates not loaded');
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.imageWidth;
    canvas.height = this.imageHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not create canvas context');
    }

    const imageData = ctx.createImageData(this.imageWidth, this.imageHeight);

    for(let x = 0; x < this.imageWidth; x++) {
        for(let y = 0; y < this.imageHeight; y++) {            
            const wgs84Coordinates = [this.lonProjections[x], this.latProjections[y]];

            const x0 = Math.floor(wgs84Coordinates[0]);
            const x1 = Math.ceil(wgs84Coordinates[0]);
            const y0 = Math.floor(wgs84Coordinates[1]);
            const y1 = Math.ceil(wgs84Coordinates[1]);

            const x0Ratio = 1 - (wgs84Coordinates[0] - x0);
            const x1Ratio = 1 - x0Ratio;
            const y0Ratio = 1 - (wgs84Coordinates[1] - y0);
            const y1Ratio = 1 - y0Ratio;

            const x0y0 = ovation.coordinates[(x0 + 360) % 360][y0 + 90];
            const x1y0 = ovation.coordinates[(x1 + 360) % 360][y0 + 90];
            const x0y1 = ovation.coordinates[(x0 + 360) % 360][y1 + 90];
            const x1y1 = ovation.coordinates[(x1 + 360) % 360][y1 + 90];

            const x0y0Value = x0y0 * x0Ratio * y0Ratio;
            const x1y0Value = x1y0 * x1Ratio * y0Ratio;
            const x0y1Value = x0y1 * x0Ratio * y1Ratio;
            const x1y1Value = x1y1 * x1Ratio * y1Ratio;

            let value = x0y0Value + x1y0Value + x0y1Value + x1y1Value;

            if(Math.abs(y0) < 5) {
                value = 0;
            }

            const index = ((this.imageHeight - y) * this.imageWidth + x) * 4;
            imageData.data[index] = getGradientColorValue('ovation', value).r;
            imageData.data[index + 1] = getGradientColorValue('ovation', value).g;
            imageData.data[index + 2] = getGradientColorValue('ovation', value).b;
            imageData.data[index + 3] = getGradientColorValue('ovation', value).a;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    ovation.image = canvas.toDataURL();
    canvas.remove();
  }

  public getOvations() {
    return this.ovations;
  }

  public getNearestOvation(time: Date) {
    let nearestOvation;
    let minDistance = Number.MAX_VALUE;
    for(let ovation of this.ovations.values()) {
      const distance = Math.abs(ovation.time.getTime() - time.getTime());
      if(distance < minDistance) {
        minDistance = distance;
        nearestOvation = ovation;
      }
    }
    return nearestOvation;
  }
}
