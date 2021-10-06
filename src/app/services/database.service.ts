import { Injectable } from '@angular/core';
import {
  CordovaEngine,
  Database,
  DatabaseConfiguration,
  DataSource,
  IonicCBL,
  Meta,
  MutableDocument,
  Ordering,
  QueryBuilder,
  SelectResult,
  Expression
} from '@ionic-enterprise/couchbase-lite';
import { Hotel } from '../models/hotel';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private database: Database;
  private readyPromise: Promise<void>;
  public hotels: Hotel[] = [];

  constructor() {
    this.readyPromise = this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise(resolve => {
      IonicCBL.onReady(async () => {
        const config = new DatabaseConfiguration();
        //config.setEncryptionKey('8e31f8f6-60bd-482a-9c70-69855dd02c38');
        //this.database = new Database('travel-sample', config);
        // this.database.setEngine(
        //   new CordovaEngine({
        //     allResultsChunkSize: 9999
        //   })
        // );

        try {
        this.database.copy("assets/travel-sample.cblite2.zip", 'travel-sample', config);
        console.log("opened DB!");
        } catch (e) {
        console.log('Could not load pre-built database');
      }
      //await this.database.open();

        
        resolve();
      });
    });
  }

  public async getHotels() {
    return this.hotels;
  }

  public async filterData(hotelName) {
    return this.hotels;
  }

}
