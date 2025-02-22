import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
// import { Theme } from '@capacitor/theme';


@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  platform = Capacitor.getPlatform();

  selectedTime: Date = new Date();
  timeSubject: Subject<Date> = new Subject<Date>();

  selectedLocation: { lat: number, lon: number } = { lat: 0, lon: 0 };
  selectedLocationSubject: Subject<{ lat: number, lon: number }> = new Subject<{ lat: number, lon: number }>();

  currentLocation: { lat: number, lon: number } = { lat: 0, lon: 0 };
  currentLocationSubject: Subject<{ lat: number, lon: number }> = new Subject<{ lat: number, lon: number }>();
  currentLocationInitialized = false;
  
  constructor() {
    this.copyCurrentLocation();
  }

  setSelectedTime(time: Date) {
    this.selectedTime = time;
    this.timeSubject.next(time);
  }

  setSelectedLocation(location: { lat: number, lon: number }) {
    this.selectedLocation = location;
    this.selectedLocationSubject.next(location);
  }

  async copyCurrentLocation() {
    if (!this.currentLocationInitialized) {
      await this.requestCurrentLocation();
    }

    this.selectedLocation = this.currentLocation;
    this.selectedLocationSubject.next(this.selectedLocation);
  }

  async requestCurrentLocation() {
    if(this.platform === 'web') {
      this.currentLocation = await this.getWebLocation();
    } else {
      this.currentLocation = await this.getNativeLocation();
    }

    this.currentLocationSubject.next(this.currentLocation);
  }

  private async getNativeLocation() {
    const permissions = await Geolocation.requestPermissions();
    if (permissions.location != 'granted') {
      console.error('Location permission not granted');
      return { lat: 0, lon: 0 };
    }

    const position = await Geolocation.getCurrentPosition();
    this.currentLocationInitialized = true;
    return { lat: position.coords.latitude, lon: position.coords.longitude };
  }

  private async getWebLocation() {
    return new Promise<{ lat: number, lon: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocationInitialized = true;
          resolve({ lat: position.coords.latitude, lon: position.coords.longitude });
        },
        (error) => {
          console.error('Error getting location', error);
          resolve({ lat: 0, lon: 0 });
        }
      );
    });
  }
}
