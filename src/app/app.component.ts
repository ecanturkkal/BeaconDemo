import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MarkerTypeId, IMapOptions, IBox, IMarkerIconInfo } from 'angular-maps';
import Swal from 'sweetalert2';

//#region "Interfaces"

export interface ILocation {
  Id: number;
  Name: string;
  Latitude: number;
  Longitude: number;
}

export interface IVessel {
  Id: number;
  Name: string;
  Mac: string;
}

export interface IBeaconReader {
  Id: number;
  Name: string;
  LocationId: number;
  LocationName?: string;
  Mac: string;
}

export interface IBeaconData {
  TimeStamp: Date;
  Type: string;
  Mac: string;
  BleName: string;
  Rssi: number;
  RawData: string;
}

export interface IMapLocationInfo {
  Latitude: number;
  Longitude: number;
  VesselName: string;
  LocationName: string;
  Description?: string;
}

//#endregion

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  constructor(private httpClient: HttpClient, public dialog: MatDialog) {
  }

  //#region "Definitons"

  apiServiceUrl = 'http://192.168.1.164:44360/api/values';

  markerTypeId = MarkerTypeId;
  options: IMapOptions = {
    disableBirdseye: false,
    disableStreetside: false,
    navigationBarMode: 2,
    zoom: 6
  };

  box: IBox = {
    minLatitude: 36,
    maxLatitude: 42,
    minLongitude: 26,
    maxLongitude: 45
  };

  private iconInfo: IMarkerIconInfo = {
    markerType: MarkerTypeId.FontMarker,
    fontName: 'FontAwesome',
    fontSize: 48,
    color: '#00afea',
    markerOffsetRatio: { x: 0.5, y: 1 },
    text: '\uf21a'
  };

  locationColumns = ['Id', 'Name', 'Latitude', 'Longitude', 'Actions'];
  vesselColumns = ['Id', 'Name', 'Mac', 'Actions'];
  beaconReaderColumns = ['Id', 'Name', 'LocationId', 'LocationName', 'Mac', 'Actions'];

  newLocation: ILocation = {
    Id: 0,
    Name: "",
    Latitude: 0,
    Longitude: 0
  }

  newVessel: IVessel = {
    Id: 0,
    Name: "",
    Mac: ""
  }

  newBeaconReader: IBeaconReader = {
    Id: 0,
    Name: "",
    LocationId: 0,
    Mac: ""
  }

  locationTable: ILocation[] = [];
  vesselTable: IVessel[] = [];
  beaconReaderTable: IBeaconReader[] = [];
  beaconDataTable: IBeaconData[] = [];

  beaconGatewayData: IBeaconData;
  beaconReaderData: IBeaconReader;
  readerLocation: ILocation;
  beaconVesselData: IBeaconData[] = [];

  mapLocationInfos: IMapLocationInfo[] = [];
  beaconReaderDataTable: IBeaconReader[] = [];
  vesselInfo: IVessel;

  sayac: string = "";
  bIndex = 0;

  //#endregion

  ngOnInit() {
    this.fillInitializedData();
  }

  ngAfterViewInit() {
  }

  //#region "Location Actions"

  openLocationDialog(location: ILocation, title: string) {
    const locationDialog = this.dialog.open(LocationDialog, {
      data: { location, title }
    });
    locationDialog.disableClose = true;
    locationDialog.afterClosed().subscribe(result => {
      location = { Id: 0, Name: "", Latitude: 0, Longitude: 0 }
      this.newLocation = { Id: 0, Name: "", Latitude: 0, Longitude: 0 }
      this.fillLocationDataTable();
    });
  }

  deleteLocation(location: ILocation) {
    var isReaderLocation = this.beaconReaderDataTable.find(br => br.LocationId === location.Id)
    if (isReaderLocation === undefined) {
      Swal.fire({
        title: 'Are you sure?',
        text: "You will delete this location!",
        type: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.value) {
          const index: number = this.locationTable.indexOf(location);
          if (index !== -1) {
            this.locationTable.splice(index, 1);
          }
          localStorage.setItem('locationTable', JSON.stringify(this.locationTable));
          this.fillLocationDataTable();
        }
      })
    }
    else {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'The location information cannot be deleted because there is a reader on this location.'
      })
    }
  }

  //#endregion

  //#region "Vessel Actions"

  openVesselDialog(vessel: IVessel, title: string) {
    const vesselDialog = this.dialog.open(VesselDialog, {
      data: { vessel, title }
    });
    vesselDialog.disableClose = true;
    vesselDialog.afterClosed().subscribe(result => {
      vessel = { Id: 0, Name: "", Mac: "" }
      this.newVessel = { Id: 0, Name: "", Mac: "" }
      this.fillVesselDataTable();
      this.fillMapLocationInfo();
    });
  }

  deleteVessel(vessel: IVessel) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will delete this vessel!",
      type: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.value) {
        const index: number = this.vesselTable.indexOf(vessel);
        if (index !== -1) {
          this.vesselTable.splice(index, 1);
        }
        localStorage.setItem('vesselTable', JSON.stringify(this.vesselTable));
        this.fillVesselDataTable();
        this.fillMapLocationInfo();
      }
    })
  }

  //#endregion

  //#region "Beacon Reader Actions"

  openBeaconReaderDialog(bReader: IBeaconReader, title: string) {
    const bReaderDialog = this.dialog.open(BeaconReaderDialog, {
      data: { bReader, title }
    });
    bReaderDialog.disableClose = true;
    bReaderDialog.afterClosed().subscribe(result => {
      bReader = { Id: 0, Name: "", LocationId: 0, Mac: "" }
      this.newBeaconReader = { Id: 0, Name: "", LocationId: 0, Mac: "" }
      this.fillBeaconReaderDataTable();
      this.fillMapLocationInfo();
    });
  }

  deleteBeaconReader(beaconReader: IBeaconReader) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will delete this reader!",
      type: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.value) {
        const index: number = this.beaconReaderDataTable.indexOf(beaconReader);
        if (index !== -1) {
          this.beaconReaderTable.splice(index, 1);
        }
        localStorage.setItem('beaconReaderTable', JSON.stringify(this.beaconReaderTable));
        this.fillBeaconReaderDataTable();
        this.fillMapLocationInfo();
      }
    })
  }

  //#endregion

  //#region "Fill Methods"

  fillInitializedData() {
    this.fillLocationDataTable();
    this.fillVesselDataTable();
    this.fillBeaconReaderDataTable();
    //this.fillBeaconDataDataTable();
    //setTimeout(() => this.fillMapLocationInfo(), 500);
  }

  fillLocationDataTable() {
    const localLocations = localStorage.getItem('locationTable');
    if (localLocations) {
      this.locationTable = JSON.parse(localLocations);
    } else {
      this.httpClient.get<ILocation[]>('assets/Location.json').subscribe(d => {
        this.locationTable = d;
        localStorage.setItem('locationTable', JSON.stringify(d));
      });
    }
  }

  fillVesselDataTable() {
    const localVessels = localStorage.getItem('vesselTable');
    if (localVessels) {
      this.vesselTable = JSON.parse(localVessels);
    } else {
      this.httpClient.get<IVessel[]>('assets/Vessel.json').subscribe(d => {
        this.vesselTable = d;
        localStorage.setItem('vesselTable', JSON.stringify(d));
      });
    }
  }

  fillBeaconReaderDataTable() {
    const localReaders = localStorage.getItem('beaconReaderTable');
    if (localReaders) {
      this.beaconReaderTable = JSON.parse(localReaders);
      this.setBeaconReaderDataTable();
    } else {
      this.httpClient.get<IBeaconReader[]>('assets/BeaconReader.json').subscribe(d => {
        this.beaconReaderTable = d;
        localStorage.setItem('beaconReaderTable', JSON.stringify(d));
        this.setBeaconReaderDataTable();
      });
    }
  }

  private setBeaconReaderDataTable() {
    this.beaconReaderDataTable = [];
    for (let i = 0; i < this.beaconReaderTable.length; i++) {
      var brDataValue = {
        Id: this.beaconReaderTable[i].Id,
        Name: this.beaconReaderTable[i].Name,
        LocationId: this.beaconReaderTable[i].LocationId,
        LocationName: this.locationTable.find(l => l.Id === this.beaconReaderTable[i].LocationId).Name,
        Mac: this.beaconReaderTable[i].Mac
      };
      this.beaconReaderDataTable.push(brDataValue);
    }
  }

  fillBeaconDataDataTable()
  {
    this.bIndex += 1;
    this.httpClient.get<IBeaconData[]>(`assets/BeaconData.json?i=${this.bIndex}`).subscribe(d => {
      localStorage.setItem('beaconDataTable', JSON.stringify(d));
      this.beaconDataTable = JSON.parse(localStorage.getItem('beaconDataTable'));
    });
  }

  startToReadData() {
    var i: number = 1;
    const headers = { headers: new HttpHeaders({
      'Cache-Control': 'no-cache'
    }) };

    setInterval(() => {
      this.bIndex += 1;
      this.httpClient.get<IBeaconData[]>(`assets/BeaconData.json?i=${this.bIndex}`, headers).subscribe(d => {
        this.beaconDataTable = d;
        localStorage.setItem('beaconDataTable', JSON.stringify(d));
        setTimeout(() => this.fillMapLocationInfo(), 500);
        //this.sayac = i.toString() + " defa çalıştım.";
        i++;
      });
    }, 3000);
  }

  fillMapLocationInfo() {
    var latPlusValue = 0;
    this.mapLocationInfos = [];

    this.beaconGatewayData = this.beaconDataTable.find(b => b.Type === "Gateway");
    this.beaconVesselData = this.beaconDataTable.filter(b => b.Type !== "Gateway");
    this.beaconReaderData = this.beaconReaderTable.find(b => b.Mac === this.beaconGatewayData.Mac);
    this.readerLocation = this.locationTable.find(l => l.Id === this.beaconReaderData.LocationId);

    for (let i = 0; i < this.beaconVesselData.length; i++) {
      this.vesselInfo = this.vesselTable.find(v => v.Mac === this.beaconVesselData[i].Mac);
      if (this.vesselInfo != undefined) {
        var newMapLocation = {
          Latitude: this.readerLocation.Latitude + latPlusValue,
          Longitude: this.readerLocation.Longitude,
          VesselName: this.vesselInfo.Name,
          LocationName: this.readerLocation.Name,
          Description: 'Location: ' + this.readerLocation.Name + '</br>' +
            'Latitude: ' + this.readerLocation.Latitude + '</br>' +
            'Longitude: ' + this.readerLocation.Longitude + '</br>' +
            'Last Seen Date: ' + this.beaconVesselData[i].TimeStamp
        };
        latPlusValue += 0.000100;
        this.mapLocationInfos.push(newMapLocation);
      }
    }
  }

  //#endregion
}

//#region "LocationDialog"

@Component({
  selector: 'app-root',
  templateUrl: 'app.addLocation.html',
  styleUrls: ['./app.component.css']
})

export class LocationDialog {
  constructor(public dialogRef: MatDialogRef<LocationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  locationTable: ILocation[] = JSON.parse(localStorage.getItem('locationTable'));
  updatedLocation: ILocation;

  saveLocation(location: ILocation) {
    if (location.Name === "" || location.Latitude <= 0 || location.Longitude <= 0) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'Missing or incorrect information input. Please check the inputs.'
      })
    }
    else {
      var isExistLocation = this.locationTable.find(l => l.Id !== location.Id && l.Latitude === location.Latitude && l.Longitude === location.Longitude);
      if (isExistLocation === undefined) {
        if (location.Id === 0) {
          location.Id = Math.max.apply(Math, this.locationTable.map(function (max) { return max.Id; })) + 1;
          this.locationTable.push(location);
        }
        else {
          this.updatedLocation = this.locationTable.find(l => l.Id === location.Id);
          this.updatedLocation.Name = location.Name;
          this.updatedLocation.Latitude = location.Latitude;
          this.updatedLocation.Longitude = location.Longitude;
        }
        localStorage.setItem('locationTable', JSON.stringify(this.locationTable));
        this.dialogRef.close();
      }
      else {
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'There is a location on same Latitude and Longitude! Plaese check tke Latitude and Longitude info!'
        })
      }
    }
  }
}

//#endregion

//#region "VesselDialog"

@Component({
  selector: 'app-root',
  templateUrl: 'app.addVessel.html',
  styleUrls: ['./app.component.css']
})

export class VesselDialog {
  constructor(public dialogRef: MatDialogRef<VesselDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  vesselTable: IVessel[] = JSON.parse(localStorage.getItem('vesselTable'));
  updatedVessel: IVessel;

  saveVessel(vessel: IVessel) {
    if (vessel.Name === "" || vessel.Mac === "") {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'Missing or incorrect information input. Please check the inputs.'
      })
    }
    else {
      var isExistVessel = this.vesselTable.find(v => v.Id !== vessel.Id && v.Mac === vessel.Mac);
      if (isExistVessel === undefined) {
        if (vessel.Id === 0) {
          vessel.Id = Math.max.apply(Math, this.vesselTable.map(function (max) { return max.Id; })) + 1;
          this.vesselTable.push(vessel);
        }
        else {
          this.updatedVessel = this.vesselTable.find(v => v.Id === vessel.Id);
          this.updatedVessel.Name = vessel.Name;
          this.updatedVessel.Mac = vessel.Mac;
        }
        localStorage.setItem('vesselTable', JSON.stringify(this.vesselTable));
        this.dialogRef.close();
      }
      else {
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'There is a vessel with same Mac! Plaese check tke Mac info!'
        })
      }
    }
  }
}

//#endregion

//#region "BeaconReaderDialog"

@Component({
  selector: 'app-root',
  templateUrl: 'app.addBeaconReader.html',
  styleUrls: ['./app.component.css']
})

export class BeaconReaderDialog {
  constructor(public dialogRef: MatDialogRef<BeaconReaderDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  locations: ILocation[] = JSON.parse(localStorage.getItem('locationTable'));
  beaconReaderTable: IBeaconReader[] = JSON.parse(localStorage.getItem('beaconReaderTable'));
  updatedBeaconReader: IBeaconReader;

  saveBeaconReader(beaconReader: IBeaconReader) {
    if (beaconReader.Name === "" || beaconReader.LocationId <= 0 || beaconReader.Mac === "") {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'Missing or incorrect information input. Please check the inputs.'
      })
    }
    else {
      var isExistReader = this.beaconReaderTable.find(b => b.Id !== beaconReader.Id && b.Mac === beaconReader.Mac);
      if (isExistReader === undefined) {
        if (beaconReader.Id === 0) {
          beaconReader.Id = Math.max.apply(Math, this.beaconReaderTable.map(function (max) { return max.Id; })) + 1;
          this.beaconReaderTable.push(beaconReader);
        }
        else {
          this.updatedBeaconReader = this.beaconReaderTable.find(br => br.Id === beaconReader.Id);
          this.updatedBeaconReader.Name = beaconReader.Name;
          this.updatedBeaconReader.LocationId = beaconReader.LocationId;
          this.updatedBeaconReader.Mac = beaconReader.Mac;
        }
        localStorage.setItem('beaconReaderTable', JSON.stringify(this.beaconReaderTable));
        this.dialogRef.close();
      }
      else {
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'There is a reader with same Mac! Plaese check tke Mac info!'
        })
      }
    }
  }

  //#endregion
}