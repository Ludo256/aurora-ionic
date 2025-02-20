import { inflateSync } from 'fflate';
import proj4 from 'proj4';
import { HttpClient } from '@angular/common/http';

import { ApiService } from '../services/api.service';
import { getGradientColorValue } from './colors';

const wgs84 = 'EPSG:4326';
const webMercator = 'EPSG:3857'; 

class Ovation {

    time: Date;
    issued: Date;
    data: any | undefined;
    coordinates: number[][] | undefined;
    image: string | undefined;
    loading = false;

    constructor(private apiService: ApiService, time: Date, issued: Date, data: string | undefined) {
        this.time = time;
        this.issued = issued;
        this.data = data;
    }

    public async loadData(callback: any, inflateCoordinates = true, createOvationImage = true) {

        if(this.loading) {
            return;
        }

        this.loading = true;

        if(!this.data) {
            const result = await this.apiService.get(`/ovation/${this.time.toISOString()}`) as any;
            this.data = result.data;
        }
        
        if(inflateCoordinates && !this.coordinates) {        
            this.inflateCoordinates();
        }

        if(createOvationImage && !this.image) {
            this.createOvationImage();
        }

        this.loading = false;

        callback();
    }

    private inflateCoordinates() {

        if(!this.data) {
            throw new Error('Data not loaded ' + this.time.getMinutes() + ' ' + this.loading);
        }

        const binaryString = window.atob(this.data);
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

        this.coordinates = Array.from({ length: 360 }, () => Array(181).fill(0))

        const offset = 4 + metadataLength;
        for (let lon = 0; lon < 360; lon++) {
            for (let lat = 0; lat < 181; lat++) {
                const value = decompressed[offset + lon * 181 + lat];
                this.coordinates[lon][lat] = value;
            }
        }
    }

    private createOvationImage() {

        if(!this.coordinates) {
            this.inflateCoordinates();
        }

        const timeA = new Date();

        const imageWidth = 360;
        const imageHeight = 180;

        const canvas = document.createElement('canvas');
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Could not create canvas context');
        }

        const imageData = ctx.createImageData(imageWidth, imageHeight);

        for(let x = 0; x < imageWidth; x++) {
            for(let y = 0; y < imageHeight; y++) {
                const mercatorLon = ((x / imageWidth) - 0.5) * 2 * 20037508.34;
                const mercatorLat = ((y / imageHeight) - 0.5) * 2 * 20048966.1;

                const wgs84Coordinates = proj4(webMercator, wgs84, [mercatorLon, mercatorLat]);
                
                const x0 = Math.floor(wgs84Coordinates[0]);
                const x1 = Math.ceil(wgs84Coordinates[0]);
                const y0 = Math.floor(wgs84Coordinates[1]);
                const y1 = Math.ceil(wgs84Coordinates[1]);

                const x0Ratio = 1 - (wgs84Coordinates[0] - x0);
                const x1Ratio = 1 - x0Ratio;
                const y0Ratio = 1 - (wgs84Coordinates[1] - y0);
                const y1Ratio = 1 - y0Ratio;

                if(!this.coordinates) {
                    throw new Error('Coordinates not loaded');
                }

                const x0y0 = this.coordinates[(x0 + 360) % 360][y0 + 90];
                const x1y0 = this.coordinates[(x1 + 360) % 360][y0 + 90];
                const x0y1 = this.coordinates[(x0 + 360) % 360][y1 + 90];
                const x1y1 = this.coordinates[(x1 + 360) % 360][y1 + 90];

                const x0y0Value = x0y0 * x0Ratio * y0Ratio;
                const x1y0Value = x1y0 * x1Ratio * y0Ratio;
                const x0y1Value = x0y1 * x0Ratio * y1Ratio;
                const x1y1Value = x1y1 * x1Ratio * y1Ratio;

                let value = x0y0Value + x1y0Value + x0y1Value + x1y1Value;

                if(Math.abs(y0) < 5) {
                    value = 0;
                }

                const index = ((imageHeight - y) * imageWidth + x) * 4;
                imageData.data[index] = getGradientColorValue('ovation', value).r;
                imageData.data[index + 1] = getGradientColorValue('ovation', value).g;
                imageData.data[index + 2] = getGradientColorValue('ovation', value).b;
                imageData.data[index + 3] = getGradientColorValue('ovation', value).a;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        this.image = canvas.toDataURL();
        canvas.remove();
    }

    public getValue(lon: number, lat: number) {
        if(!this.coordinates) {
            return null;
        }

        lon = Math.round((lon + 360 * 1000) % 360);
        lat = Math.round(lat + 90);
        return this.coordinates[lon][lat];
    }
}

export { Ovation };