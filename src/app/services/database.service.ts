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
    // await this.initializeDatabase();

    // return await this.retrieveHotelList();
    await this.seedInitialData();
    return await this.retrieveHotelList();
  }

  private async initializeDatabase() {
    // When on iOS/Android & Windows, load the Couchbase Lite travel database used in many of their tutorials.
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

        // Create the "bookmarked_hotels" document if it doesn't exist
        this.bookmarkDocument = await this.findOrCreateBookmarkDocument();
      } catch (e) {
        console.log('Could not load pre-built database.');
      }
    }
    else {
      // When running on the web, use hotel data from a file
      const hotelFile = await import("../data/hotels");
      this.hotels = hotelFile.hotelData;
    }
  }

  private async seedInitialData() { 
    let dc = new DatabaseConfiguration();
    dc.setEncryptionKey('8e31f8f6-60bd-482a-9c70-69855dd02c39');
    this.database = new Database("travel", dc);
    await this.database.open();

    let count = await this.getHotelCount();
    if (count === 0) {
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
    const hotelQuery = this.database.createQuery(`SELECT * FROM _ WHERE type = ${this.DOC_TYPE_HOTEL} ORDER BY name`);
    const hotelResults = await (await hotelQuery.execute()).allResults();

    // Get all bookmarked hotels
    const bookmarkQuery = this.database.createQuery(`SELECT * FROM _ WHERE type = ${this.DOC_TYPE_BOOKMARKED_HOTELS}`);
    const bookmarkResults = await (await hotelQuery.execute()).allResults();
    const bookmarks = bookmarkResults["hotels"] as number[];

    //let bookmarks = this.bookmarkDocument.getArray("hotels");
    let hotelList: Hotel[] = [];
    for (let key in hotelResults) {
      // Set bookmark status
      // SelectResult.all() returns all properties, but puts them into a seemingly odd JSON format:
      // [ { "_": { id: "1", firstName: "Matt" } }, { "_": { id: "2", firstName: "Max" } }]
      // Couchbase can query multiple databases at once, so "_" is just this single database.
      let singleHotel = hotelResults[key]["_"] as Hotel;
      singleHotel.bookmarked = bookmarks.includes(singleHotel.id);

      hotelList.push(singleHotel);
    }

    return hotelList;
  }

  public async searchHotels(name) {
    const quer = 
      this.database.createQuery("SELECT * FROM _ WHERE name LIKE '%name%' AND type = this.DOC_TYPE_HOTEL ORDER BY name");
    const t = await (await quer.execute()).allResults();

    const query = QueryBuilder.select(SelectResult.all())
      .from(DataSource.database(this.database))
      .where(Expression.property("name").like(name)
        .and(Expression.property("type").equalTo(Expression.string(this.DOC_TYPE_HOTEL))))
      .orderBy(Ordering.property('name').ascending());
    
    const results = await (await query.execute()).allResults();

    let filteredHotels = [];
    for (var key in results) {
      // SelectResult.all() returns all properties, but puts them into a seemingly odd JSON format:
      // [ { "*": { id: "1", firstName: "Matt" } }, { "*": { id: "2", firstName: "Max" } }]
      // Couchbase can query multiple databases at once, so "*" represents just this single database.
      let singleHotel = results[key]["*"];

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
    const query = QueryBuilder.select(SelectResult.expression(Meta.id))
      .from(DataSource.database(this.database))
      .where(Expression.property("type").equalTo(Expression.string(this.DOC_TYPE_BOOKMARKED_HOTELS)));

      const resultSet = await query.execute();
      const resultList = await resultSet.allResults();

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

  private async getHotelCount() {
    const hotelQuery = this.database.createQuery("SELECT * FROM _ WHERE type = 'hotel' ORDER BY name");
  
    const result = await hotelQuery.execute();
    const count = (await result.allResults()).length;
    return count;
  }
  
  public async filterData(hotelName: string) {
    const filtered = this.hotels.filter(
      h => h.name.toLowerCase().includes(hotelName.toLowerCase()));

    return filtered;
  }
}
