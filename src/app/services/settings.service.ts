import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  selectedTime: Date = new Date();
  timeSubject: Subject<Date> = new Subject<Date>();

  selectedLocation: { lat: number, lon: number } = { lat: 0, lon: 0 };
  locationSubject: Subject<{ lat: number, lon: number }> = new Subject<{ lat: number, lon: number }>();
  
  constructor() {
    this.selectedLocation = { lat: 52.87, lon: -118 };
  }


  setSelectedTime(time: Date) {
    this.selectedTime = time;
    this.timeSubject.next(time);
  }

  setSelectedLocation(location: { lat: number, lon: number }) {
    this.selectedLocation = location;
    this.locationSubject.next(location);
  }
}
