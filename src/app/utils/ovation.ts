import { inflateSync } from 'fflate';

type Ovation = {
    time: Date,
    filePath: string,
    issued: Date,
    data: any,
    coordinates: number[][],
    image: string
}

const inflateCoordinates = (ovation: Ovation) => {
    const binaryString = window.atob(ovation.data);
    let uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }

    // remove the first 2 bytes and last 4 bytes (because of the zip format)
    uint8Array = uint8Array.slice(2, -4);
    const decompressed = inflateSync(uint8Array);

    const metadataLength = new DataView(decompressed.buffer).getUint32(0, false);
    const metadataString = new TextDecoder().decode(decompressed.slice(4, 4 + metadataLength));
    const metadata = JSON.parse(metadataString);

    ovation.coordinates = Array.from({ length: 360 }, () => Array(181).fill(0))

    const offset = 4 + metadataLength;
    for (let lon = 0; lon < 360; lon++) {
        for (let lat = 0; lat < 181; lat++) {
            const value = decompressed[offset + lon * 181 + lat];
            ovation.coordinates[lon][lat] = value;
        }
    }

    return ovation;
};

const createOvationImage = (ovation: Ovation) => {
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 181;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const imageData = ctx.createImageData(360, 181);

    for (let lat = 0; lat < 181; lat++) {
        for (let lon = 0; lon < 360; lon++) {
            let value = ovation.coordinates[lon][lat];

            // Fix the equator, NOAA SWPC seems to have a bug in their data
            if(lat > 85 && lat < 95) {
                value = 0;
            }

            const index = ((181 - lat) * 360 + (lon + 180) % 360) * 4;
            imageData.data[index] = value * 2;
            imageData.data[index + 1] = value * 8;
            imageData.data[index + 2] = value * 4;
            imageData.data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    ovation.image = canvas.toDataURL();
    canvas.remove();
};

const upscaleImage = (dataUrlImage: string, factor: number) => {
    const image = new Image();
    image.src = dataUrlImage;

    const canvas = document.createElement('canvas');
    canvas.width = image.width * factor;
    canvas.height = image.height * factor;
    const ctx = canvas.getContext('2d');
    console.log(ctx);

    if (!ctx) return;

    console.log(image.width, image.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL();
}

export { Ovation, inflateCoordinates, createOvationImage };