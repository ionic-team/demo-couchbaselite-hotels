import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
// import {
//   Database,
//   DatabaseConfiguration,
//   DataSource,
//   Meta,
//   MutableDocument,
//   Ordering,
//   QueryBuilder,
//   SelectResult,
//   Expression
// } from '@ionic-enterprise/couchbase-lite';
import { hotelData } from '../data/hotels';
import { Hotel } from '../models/hotel';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  //private database: Database;
  public hotels: Hotel[] = [];

  constructor() {
    this.hotels = hotelData;
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    //const config = new DatabaseConfiguration();
    //config.setEncryptionKey('8e31f8f6-60bd-482a-9c70-69855dd02c38');
    //this.database = new Database('travel-sample', config);
    // this.database.setEngine(
    //   new CordovaEngine({
    //     allResultsChunkSize: 9999
    //   })
    // );

    // try {
    //   const file = await Filesystem.getUri({
    //     directory: Directory.Data,
    //     path: "db.sqlite3"
    //   });

    //   this.database.copy(file.uri, 'travel-sample', config);
    //   console.log("opened DB!");
    // } catch (e) {
    //   console.log('Could not load pre-built database');
    // }
  }

  /*
    Import static hotel data into a large JSON object (data/hotels.ts), then load into Couchbase.
    In future, a Couchbase Lite database zip file will be shipped with the app binary,
    then extracted and loaded upon first time app initialization.
  */
    private async seedInitialData() {
      // let count = await this.getDatabaseCount();
      // if (count === 0) {
      //   for (let hotel of hotelData) {
      //     let doc = new MutableDocument()
      //       .setString('name', hotel.name)
      //       .setString('address', hotel.address)
      //       .setString('phone', hotel.phone);
          
      //     this.database.save(doc);
      //   }
      // }
    }

  public async getHotels() {
    return this.hotels;
  }

  public async filterData(hotelName: string) {
    const filtered = this.hotels.filter(
      h => h.name.toLowerCase().includes(hotelName.toLowerCase()));

    return filtered;
  }

  // private async getDatabaseCount() {
  //   const query = QueryBuilder.select(SelectResult.all())
  //     .from(DataSource.database(this.database));
    
  //   const result = await query.execute();
  //   const count = (await result.allResults()).length;
  //   return count;
  // }

}
