import * as SunCalc from 'suncalc';

const getMoonAltitude = (lat: number, lon: number, time: Date): number => {
    const position = SunCalc.getMoonPosition(time, lat, lon);
    return (position.altitude * 180) / Math.PI;
};

const getMoonLuminosity = (time: Date): number => {
    return 100 * SunCalc.getMoonIllumination(time).fraction;
};

const getMoonPhase = (time: Date): string => {
    const luminosity = getMoonLuminosity(time);
    if(luminosity >= 95) {
        return 'full_moon';
    } else if(luminosity >= 75) {
        return 'waning_crescent';
    } else if(luminosity >= 5) {
        return 'waning_gibbous';
    } else if(luminosity >= 25) {
        return 'waxing_gibbous';
    } else if(luminosity >= 5) {
        return 'waxing_crescent';
    } else {
        return 'new_moon';
    }
}

export { getMoonAltitude, getMoonLuminosity, getMoonPhase };