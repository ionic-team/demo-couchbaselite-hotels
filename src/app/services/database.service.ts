import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import {
  Database,
  DatabaseConfiguration,
  DataSource,
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
  private hotels: Hotel[] = [];

  constructor() { }

  private async initializeDatabase(): Promise<Hotel[]> {
    // When on iOS/Android, load the Couchbase Lite travel database used in many of their tutorials.
    if (Capacitor.isNativePlatform()) {
      const config = new DatabaseConfiguration();
      
      /* Note about encryption: In a real-world app, the encryption key should not be hardcoded like it is here. 
         One strategy is to auto generate a unique encryption key per user on initial app load, then store it securely in the device's keychain for later retrieval.
         Ionic's Identity Vault (https://ionicframework.com/docs/enterprise/identity-vault) plugin is an option. Using IV’s storage API, you can ensure that the 
         key cannot be read or accessed without the user being authenticated first. */
      config.setEncryptionKey('8e31f8f6-60bd-482a-9c70-69855dd02c38');

      try {
        if (!this.database.exists("travel-sample", Directory.Data)) {
          const travelDbFile = await Filesystem.getUri({
            directory: Directory.Data,
            path: "db.sqlite3"
          });
  
          this.database.copy(travelDbFile.uri, 'travel-sample', config);
        } else {
          this.database = new Database("travel-sample", config);
        }
      } catch (e) {
        console.log('Could not load pre-built database.');
      }
    }
    else {
      // When running on the web, use hotel data from a file
      const hotelFile = await import("../data/hotels");
      this.hotels = hotelFile.hotelData;
    }

    return this.hotels;
  }

  public async getHotels() {
    return await this.initializeDatabase();
  }

  

  
  
  
  
  
  
  public async filterData(hotelName: string) {
    const filtered = this.hotels.filter(
      h => h.name.toLowerCase().includes(hotelName.toLowerCase()));

    return filtered;
  }
}
