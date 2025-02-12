import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ForecastPageRoutingModule } from './forecast-routing.module';

import { ForecastPage } from './forecast.page';
import { NowComponent } from "./now/now.component";
import { ShortTermComponent } from './short-term/short-term.component';
import { LongTermComponent } from './long-term/long-term.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ForecastPageRoutingModule,
    NowComponent,
    ShortTermComponent,
    LongTermComponent
],
  declarations: [ForecastPage]
})
export class ForecastPageModule {}
