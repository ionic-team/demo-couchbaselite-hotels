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
  private DOC_TYPE_HOTEL = "hotel";
  private DOC_TYPE_BOOKMARKED_HOTELS = "bookmarked_hotels";
  private bookmarkDocument: MutableDocument;

  constructor() { }

  public async getHotels(): Promise<Hotel[]> {
    await this.initializeDatabase();

    return await this.retrieveHotelList();
  }

  private async initializeDatabase() {
    // When on iOS/Android & Windows, load the Couchbase Lite travel database used in many of their tutorials.
    if (Capacitor.isNativePlatform()) {
      await this.seedInitialData();

      // Create the "bookmarked_hotels" document if it doesn't exist
      this.bookmarkDocument = await this.findOrCreateBookmarkDocument();
    }
    else {
      // When running on the web, use hotel data from a file
      const hotelFile = await import("../data/hotels");
      this.hotels = hotelFile.hotelData;
    }
  }

  private async seedInitialData() { 
    /* Note about encryption: In a real-world app, the encryption key should not be hardcoded like it is here. 
       One strategy is to auto generate a unique encryption key per user on initial app load, then store it securely in the device's keychain for later retrieval.
       Ionic's Identity Vault (https://ionic.io/docs/identity-vault) plugin is an option. Using IV’s storage API, you can ensure that the 
       key cannot be read or accessed without the user being authenticated first. */
    let dc = new DatabaseConfiguration();
    dc.setEncryptionKey('8e31f8f6-60bd-482a-9c70-69855dd02c39');
    this.database = new Database("travel", dc);
    await this.database.open();

    const len = (await this.getAllHotels()).length;
    console.log(`Found ${len} hotels in database`);
    if (len === 0) {
      const hotelFile = await import("../data/hotels");

      for (let hotel of hotelFile.hotelData) {
        let doc = new MutableDocument()
          .setString('name', hotel.name)
          .setString('address', hotel.address)
          .setString('phone', hotel.phone)
          .setString('type', this.DOC_TYPE_HOTEL);
        
        this.database.save(doc);
      }
    }
  }


  private async retrieveHotelList(): Promise<Hotel[]> {
    // Get all hotels
    const hotelQuery = this.database.createQuery(`SELECT * FROM _ WHERE type = '${this.DOC_TYPE_HOTEL}' ORDER BY name`);
    const hotelResults = await (await hotelQuery.execute()).allResults();
    console.log(JSON.stringify(hotelResults));

    // Get all bookmarked hotels
    //const bookmarks = this.bookmarkDocument. bookmarkResults["hotels"] as number[];

    const bookmarks = this.bookmarkDocument.getArray("hotels");
    let hotelList: Hotel[] = [];
    for (let key in hotelResults) {
      // Couchbase can query multiple databases at once, so "_" is just this single database.
      // [ { "_": { id: "1", firstName: "Matt" } }, { "_": { id: "2", firstName: "Max" } }]
      let singleHotel = hotelResults[key]["_"] as Hotel;

      // Set bookmark status
      singleHotel.bookmarked = bookmarks.includes(singleHotel.id);

      hotelList.push(singleHotel);
    }

    return hotelList;
  }

  public async searchHotels(name) {
    const query = 
      this.database.createQuery(`SELECT * FROM _ WHERE name LIKE '%name%' AND type = '${this.DOC_TYPE_HOTEL}' ORDER BY name`);
    const results = await (await query.execute()).allResults();

    let filteredHotels = [];
    for (var key in results) {
      let singleHotel = results[key]["_"];

      filteredHotels.push(singleHotel);
    }

    return filteredHotels;
  }

  public async bookmarkHotel(hotelId: string) {
    let hotelArray = this.bookmarkDocument.getArray("hotels");
    hotelArray.addString(hotelId);
    this.bookmarkDocument.setArray("hotels", hotelArray);

    this.database.save(this.bookmarkDocument);
  }
  
  private async findOrCreateBookmarkDocument(): Promise<MutableDocument> {
    const bookmarkQuery = this.database.createQuery(`SELECT * FROM _ WHERE type = '${this.DOC_TYPE_BOOKMARKED_HOTELS}'`);
    const resultSet = await bookmarkQuery.execute();
    const resultList = await resultSet.allResults();
    console.log(JSON.stringify(resultList));

    if (resultList.length === 0) {
      const mutableDocument = new MutableDocument()
              .setString("type", this.DOC_TYPE_BOOKMARKED_HOTELS)
              .setArray("hotels", new Array());
      this.database.save(mutableDocument);

      return mutableDocument;
    } else {
      const result = resultList[0];
      const docId = result.getString("id");
      return MutableDocument.fromDocument(await this.database.getDocument(docId));
    }
  }

  private async getAllHotels() {
    const query = this.database.createQuery(`SELECT * FROM _ WHERE type = '${this.DOC_TYPE_HOTEL}' ORDER BY name`);
    const result = await query.execute();
    const results = await result.allResults();
    return results;
  }
}
