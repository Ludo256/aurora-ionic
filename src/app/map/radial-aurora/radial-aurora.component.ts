import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  ApexChart,
  ApexPlotOptions,
  ApexNonAxisChartSeries,
  ApexFill,
  ApexStroke,
  NgApexchartsModule,
  ChartComponent
} from "ng-apexcharts";
import { auroraGradients, colorToHex, colorToRgb, getGradientColorValue } from 'src/app/utils/colors';


@Component({
  selector: 'radial-aurora',
  templateUrl: './radial-aurora.component.html',
  styleUrls: ['./radial-aurora.component.scss'],
  imports: [NgApexchartsModule]
})
export class RadialAuroraComponent  implements OnInit {

  @ViewChild('chart') chart: ChartComponent | undefined;
  @Input() auroraValue: number = 0;

  chartOptions: ApexChart = {
    height: 120,
    type: "radialBar",
    toolbar: {
      show: false
    }
  };

  series: ApexNonAxisChartSeries = [this.auroraValue];

  plotOptions: ApexPlotOptions = {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      hollow: {
        size: "40%"
      },

      dataLabels: {
        name: {
          show: false,
        },
        value: {
          offsetY: 6,
          formatter: function(val) {
            return parseInt(val.toString(), 10).toString() + "%";
          },
          color: "#fff",
          fontSize: "18px"
        }
      }
    }
  }

  fill: ApexFill = {
    colors: [colorToHex(getGradientColorValue('ovation', this.auroraValue))]
  }

  stroke: ApexStroke = {
    lineCap: "round"
  };

  constructor() {

  }

  ngOnInit(): void {
    
  }

  ngOnChanges() {
    const color = colorToHex(getGradientColorValue('ovation', this.auroraValue));
    this.chart?.updateSeries([this.auroraValue]);
    this.chart?.updateOptions({
      fill: {
        colors: [color]
      }
    });
  
  }

}
