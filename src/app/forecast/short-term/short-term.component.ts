import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexMarkers, ApexFill, ApexTooltip, ApexYAxis } from 'ng-apexcharts';

import { ApiService } from 'src/app/services/api.service';
import { getSunAltitude, getSunPhase } from 'src/app/utils/sun';
import { getMoonAltitude, getMoonLuminosity, getMoonPhase } from 'src/app/utils/moon';

@Component({
  selector: 'app-short-term',
  templateUrl: './short-term.component.html',
  styleUrls: ['./short-term.component.scss'],
  imports: [NgApexchartsModule]
})
export class ShortTermComponent implements OnInit {

  chartDetails: ApexChart = {
    type: 'line',
    height: 500,
    zoom: {
      enabled: false,
    },
  };

  chartSeries: ApexAxisChartSeries = [];

  colors: string[] = ['#9b4dcaaa', '#ffcc00aa', '#c0c0c0aa'];

  dataLabels: ApexDataLabels = {
    enabled: false,
  };

  fill: ApexFill = {
    image: {
      src: ['assets/aurora.jpg'],
    }
  };

  markers: ApexMarkers = {
    size: 0,
  };

  stroke: ApexStroke = {
    // curve: 'monotoneCubic',
  };

  tooltip: ApexTooltip = {
    x: {
      format: 'MMM d HH:mm',
    },
    followCursor: true,
  };

  xAxis: ApexXAxis = {
    type: 'datetime',
  };

  yAxis: ApexYAxis[] = [
    {
      title: {
        text: 'Aurora (KP Index)',
      },
      min: 0,
      max: 8,
      labels: {
        formatter: (value) => {
          if(value) {
            return value.toFixed(0);
          } else {
            return '';
          }
        },
      },
    },
    {
      show: false,
      min: -18,
      max: 90,
      labels: {
        formatter: (value) => {
          if(value) {
            return value.toFixed(0) + '° (' + getSunPhase(value) + ')';
          } else {
            return '';
          }
        }
      },
    },
    {
      show: false,
      min: -18,
      max: 90,
      labels: {
        formatter: (value,{ seriesIndex, dataPointIndex, w }) => {

          const time = w.globals.seriesX[seriesIndex][dataPointIndex];
          const luminosity = getMoonLuminosity(time);
          const moonPhase = getMoonPhase(time);

          if(value) {
            return value.toFixed(0) + '° (' + moonPhase + ', ' + luminosity.toFixed(0) + '%)';
          } else {
            return '';
          }
        }
      },
    }
  ]

  apiData: any;

  constructor(private apiService: ApiService) {
    this.loadShortTermForecast();
  }

  ngOnInit() {

  }


  async loadShortTermForecast() {
    const result: any = await this.apiService.get('/forecast/short-term');
    this.apiData = result;

    const kpIndexData = [];
    const sunAltitudeData = [];
    const moonAltitudeData = [];
    const moonLuminosityData = [];

    const lat = 52.8733;
    const lon = 118.0823;

    const startTime = new Date(this.apiData[0].time);
    const endTime = new Date(this.apiData[this.apiData.length - 1].time);
    let time = new Date(startTime);

    const interpolatedData = interpolateLine(this.apiData, 12);
    for(let data of interpolatedData) {
      time = new Date(data.time);
      kpIndexData.push({ x: time, y: data.kpIndex });
      sunAltitudeData.push({ x: time, y: getSunAltitude(lat, lon, time) });
      moonAltitudeData.push({ x: time, y: getMoonAltitude(lat, lon, time) });
      moonLuminosityData.push({ x: time, y: getMoonLuminosity(time) });
    }

    this.chartSeries = [
      {
        name: 'Aurora (KP Index)',
        data: kpIndexData,
        type: 'area',
      },
      {
        name: 'Sun',
        data: sunAltitudeData,
        type: 'line',
      },
      {
        name: 'Moon',
        data: moonAltitudeData,
        type: 'line',
      }
    ];
  }
}

type DataPoint = { time: string; kpIndex: number };

function interpolateLine(points: DataPoint[], resolution: number = 10): { time: string; kpIndex: number }[] {
    if (points.length < 2) return points;

    const interpolatedPoints: DataPoint[] = [];

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];

        const t0 = new Date(p0.time).getTime();
        const t1 = new Date(p1.time).getTime();

        for (let j = 0; j <= resolution; j++) {
            const t = j / resolution;
            const interpolatedKp = (1 - t) * p0.kpIndex + t * p1.kpIndex;
            const interpolatedTime = new Date(t0 + t * (t1 - t0)).toISOString();

            interpolatedPoints.push({ time: interpolatedTime, kpIndex: interpolatedKp });
        }
    }

    return interpolatedPoints;
}