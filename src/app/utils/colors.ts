const gradients: any = {};

type Color = {
    r: number;
    g: number;
    b: number;
    a: number;
}

const auroraGradients: [number, Color][] = [
    [0.00, {r: 0, g: 0, b: 0, a: 0}],
    [0.02, {r: 10, g: 20, b: 40, a: 0.2}],
    [0.05, {r: 30, g: 60, b: 90, a: 0.4}],   
    [0.15, {r: 50, g: 150, b: 100, a: 1.0}],
    [0.20, {r: 80, g: 200, b: 120, a: 1.0}],
    [0.35, {r: 180, g: 50, b: 250, a: 1.0}],
    [0.7, {r: 255, g: 0, b: 0, a: 1.0}],
];

const initGradients = () => {
    initGradient('ovation', auroraGradients);
}

const colorToRgb = (color: Color) => {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

const colorToRgba = (color: Color) => {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

const colorToHex = (color: Color) => {
    return '#' + ((1 << 24) + (color.r << 16) + (color.g << 8) + color.b).toString(16).slice(1);
}

const initGradient = (key: string, stops: [number, Color][]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 1;

    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    if(!ctx) {
        throw new Error('Could not create canvas context');
    }

    const gradient = ctx.createLinearGradient(0, 0, 100, 0);
    stops.forEach(([stop, color]) => gradient.addColorStop(stop, colorToRgba(color)));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 100, 1);

    gradients[key] = {};

    for(let i = 0; i < 100; i++) {
        const pixelData = ctx.getImageData(i, 0, 1, 1);
        gradients[key][i] = {
            r: pixelData.data[0],
            g: pixelData.data[1],
            b: pixelData.data[2],
            a: pixelData.data[3]
        }
    }
}

const getGradientColorValue = (key: string, value: number) => {
    if(!gradients[key]) {
        initGradients();
    }

    return gradients[key][Math.round(value)];
}


export {
    auroraGradients,
    colorToHex,
    colorToRgb,
    colorToRgba,
    getGradientColorValue
}