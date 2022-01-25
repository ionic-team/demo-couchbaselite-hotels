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

  constructor() { }

  public async getHotels(): Promise<Hotel[]> {
    await this.initializeDatabase();

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

  private async retrieveHotelList(): Promise<Hotel[]> {
    // Get all hotels
    const query = QueryBuilder.select(SelectResult.all())
      .from(DataSource.database(this.database))
      .where(Expression.property("type").equalTo(Expression.string(this.DOC_TYPE_HOTEL)));
  
    const hotelResults = await (await query.execute()).allResults();

    // Get all bookmarked hotels
    const bookmarkQuery = QueryBuilder.select(SelectResult.all())
      .from(DataSource.database(this.database))
      .where(Expression.property("type").equalTo(Expression.string(this.DOC_TYPE_BOOKMARKED_HOTELS)));
    
    const bookmarkResults = await (await query.execute()).allResults();
    const bookmarks = bookmarkResults["hotels"] as number[];

    let hotelList: Hotel[] = [];
    for (var key in hotelResults) {
      // Set bookmark status
      let singleHotel = hotelResults[key]["*"] as Hotel;
      singleHotel.bookmarked = bookmarks.includes(singleHotel.id);

      hotelList.push(singleHotel);
    }

    return hotelList;
  }

  public async searchHotels(name) {
    //const quer = 
      //this.database.createQuery("SELECT * FROM _ WHERE name LIKE '%name%' AND type = this.DOC_TYPE_HOTEL ORDER BY name");

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
    const bookmarkDoc = await this.findOrCreateBookmarkDocument();
    let hotelArray = bookmarkDoc.getArray("hotels");
    hotelArray.addString(hotelId);
    bookmarkDoc.setArray("hotels", hotelArray);

    this.database.save(bookmarkDoc);
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
  
  public async filterData(hotelName: string) {
    const filtered = this.hotels.filter(
      h => h.name.toLowerCase().includes(hotelName.toLowerCase()));

    return filtered;
  }
}
