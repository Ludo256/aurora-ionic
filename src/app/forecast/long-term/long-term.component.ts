import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexMarkers, ApexFill, ApexTooltip, ApexYAxis } from 'ng-apexcharts';

import { ApiService } from 'src/app/services/api.service';
import { getSunAltitude, getSunPhase } from 'src/app/utils/sun';
import { getMoonAltitude, getMoonLuminosity, getMoonPhase } from 'src/app/utils/moon';

@Component({
  selector: 'app-long-term',
  templateUrl: './long-term.component.html',
  styleUrls: ['./long-term.component.scss'],
  imports: [NgApexchartsModule]
})
export class LongTermComponent  implements OnInit {

  chartDetails: ApexChart = {
    type: 'line',
    height: 500,
    zoom: {
      enabled: false,
    },
  };

  chartSeries: ApexAxisChartSeries = [];

  colors: string[] = ['#9b4dcaaa', '#c0c0c0aa'];

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
      min: 0,
      max: 100,
      labels: {
        formatter: (value,{ seriesIndex, dataPointIndex, w }) => {

          const time = w.globals.seriesX[seriesIndex][dataPointIndex];
          const moonPhase = getMoonPhase(time);

          if(value) {
            return moonPhase + ' (' + value.toFixed(0) + '%)';
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
    const result: any = await this.apiService.get('/forecast/long-term');
    this.apiData = result;

    const kpIndexData = [];
    const moonLuminosityData = [];

    const lat = 52.8733;
    const lon = 118.0823;

    const startTime = new Date(this.apiData[0].time);
    const endTime = new Date(this.apiData[this.apiData.length - 1].time);
    let time = new Date(startTime);

    const interpolatedData = interpolateLine(this.apiData, 4);
    for(let data of interpolatedData) {
      time = new Date(data.time);
      kpIndexData.push({ x: time, y: data.largestKpIndex });
      moonLuminosityData.push({ x: time, y: getMoonLuminosity(time) });
    }

    this.chartSeries = [
      {
        name: 'Aurora (KP Index)',
        data: kpIndexData,
        type: 'area',
      },
      {
        name: 'Moon',
        data: moonLuminosityData,
        type: 'line',
      }
    ];
  }
}

type DataPoint = { time: string; largestKpIndex: number };

function interpolateLine(points: DataPoint[], resolution: number = 10): { time: string; largestKpIndex: number }[] {
    if (points.length < 2) return points;

    const interpolatedPoints: DataPoint[] = [];

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];

        const t0 = new Date(p0.time).getTime();
        const t1 = new Date(p1.time).getTime();

        for (let j = 0; j <= resolution; j++) {
            const t = j / resolution;
            const interpolatedKp = (1 - t) * p0.largestKpIndex + t * p1.largestKpIndex;
            const interpolatedTime = new Date(t0 + t * (t1 - t0)).toISOString();

            interpolatedPoints.push({ time: interpolatedTime, largestKpIndex: interpolatedKp });
        }
    }

    return interpolatedPoints;
}