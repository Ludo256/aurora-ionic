import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

    constructor(private httpClient: HttpClient) {

    }

    async get(path: string) {
        return await firstValueFrom(this.httpClient.get(`https://aurora-forecast-450321.uc.r.appspot.com/api${path}`));
    }
}
