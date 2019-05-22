import { NgModule } from '@angular/core';
import { AppComponent, LocationDialog, VesselDialog, BeaconReaderDialog } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule, MatSelectModule, MatIconModule, MatTableModule, MatButtonToggleModule, MatDialogModule, MatFormFieldModule, MatButtonModule,
          MatInputModule, MatRadioModule, MatCardModule, MatProgressSpinnerModule
} from '@angular/material';

import {MapModule, MapAPILoader, WindowRef, DocumentRef, BingMapAPILoaderConfig, BingMapAPILoader
} from 'angular-maps';

export function MapServiceProviderFactory(){
  let bc: BingMapAPILoaderConfig = new BingMapAPILoaderConfig();
  bc.apiKey ="Aox51cMgjTNL-RBif8iVJ4kWufcyFIpPzI6o60A10mtlSN1CE2rqdMhxX6FLy4bl"; // your bing map key
  //bc.branch = "experimental"; 
      // to use the experimental bing brach. There are some bug fixes for
      // clustering in that branch you will need if you want to use 
      // clustering.
  return new BingMapAPILoader(bc, new WindowRef(), new DocumentRef());
}

@NgModule({
  declarations: [
    AppComponent,
    LocationDialog,
    VesselDialog,
    BeaconReaderDialog
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule, MatSelectModule, MatIconModule, MatTableModule, MatButtonToggleModule, MatDialogModule, MatFormFieldModule, MatButtonModule, MatInputModule,
    MatRadioModule, MatCardModule, MatProgressSpinnerModule,
    MapModule.forRoot()
  ],
  providers: [
    {
      provide: MapAPILoader, deps: [], useFactory: MapServiceProviderFactory
    }
  ],
  bootstrap: [AppComponent],
  entryComponents: [LocationDialog, VesselDialog, BeaconReaderDialog]
})

export class AppModule { } 
