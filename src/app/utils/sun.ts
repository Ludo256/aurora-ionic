import * as SunCalc from 'suncalc';

const getSunAltitude = (lat: number, lon: number, time: Date): number => {
    const position = SunCalc.getPosition(time, lat, lon);
    return (position.altitude * 180) / Math.PI;
};

const getSunPhase = (altitude: number): string => {
    if(altitude >= 0) {
        return 'day';
    } else if(altitude >= -6) {
        return 'civil_twilight';
    } else if(altitude >= -12) {
        return 'nautical_twilight';
    } else if(altitude >= -18) {
        return 'astronomical_twilight';
    } else {
        return 'night';
    }
}

export { getSunAltitude, getSunPhase };