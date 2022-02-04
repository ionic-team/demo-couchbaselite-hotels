import { Injectable } from '@angular/core';
import {
  Database,
  DatabaseConfiguration,
  MutableDocument
} from '@ionic-enterprise/couchbase-lite';
import { Hotel } from '../models/hotel';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private database: Database;
  private DOC_TYPE_HOTEL = "hotel";
  private DOC_TYPE_BOOKMARKED_HOTELS = "bookmarked_hotels";
  private bookmarkDocument: MutableDocument;

  constructor() { }

  public async getHotels(): Promise<Hotel[]> {
    await this.initializeDatabase();

    return await this.retrieveHotelList();
  }

  private async initializeDatabase() {
    await this.seedInitialData();

    this.bookmarkDocument = await this.findOrCreateBookmarkDocument();
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
    if (len === 0) {
      const hotelFile = await import("../data/hotels");

      for (let hotel of hotelFile.hotelData) {
        let doc = new MutableDocument()
          .setNumber('id', hotel.id)
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
    const hotelResults = this.getAllHotels();

    // Get all bookmarked hotels
    let bookmarks = this.bookmarkDocument.getArray("hotels") as number[];
    
    let hotelList: Hotel[] = [];
    for (let key in hotelResults) {
      // Couchbase can query multiple databases at once, so "_" is just this single database.
      // [ { "_": { id: "1", name: "Matt" } }, { "_": { id: "2", name: "Max" } }]
      let singleHotel = hotelResults[key]["_"] as Hotel;

      // Set bookmark status
      singleHotel.bookmarked = bookmarks.includes(singleHotel.id);

      hotelList.push(singleHotel);
    }

    return hotelList;
  }

  public async searchHotels(name): Promise<Hotel[]> {
    const query = this.database.createQuery(
        `SELECT * FROM _ WHERE name LIKE '%${name}%' AND type = '${this.DOC_TYPE_HOTEL}' ORDER BY name`);
    const results = await (await query.execute()).allResults();

    let filteredHotels: Hotel[] = [];
    for (var key in results) {
      let singleHotel = results[key]["_"] as Hotel;

      filteredHotels.push(singleHotel);
    }

    return filteredHotels;
  }

  public async bookmarkHotel(hotelId: number) {
    let hotelArray = this.bookmarkDocument.getArray("hotels") as number[];
    hotelArray.push(hotelId); 
    this.bookmarkDocument.setArray("hotels", hotelArray);

    this.database.save(this.bookmarkDocument);
  }

  // Remove bookmarked hotel from bookmark document
  public async unbookmarkHotel(hotelId: number) {
    let hotelArray = this.bookmarkDocument.getValue("hotels") as number[];
    hotelArray = hotelArray.filter(id => id !== hotelId);
    this.bookmarkDocument.setArray("hotels", hotelArray);

    this.database.save(this.bookmarkDocument);
  }
  
  private async findOrCreateBookmarkDocument(): Promise<MutableDocument> {
    // Meta().id is a GUID like e15d1aa2-9be3-4e02-92d8-82bd9d05d8e3
    const bookmarkQuery = this.database.createQuery(
      `SELECT META().id AS id FROM _ WHERE type = '${this.DOC_TYPE_BOOKMARKED_HOTELS}'`);
    const resultSet = await bookmarkQuery.execute();
    const resultList = await resultSet.allResults();

    if (resultList.length === 0) {
      const mutableDocument = new MutableDocument()
              .setString("type", this.DOC_TYPE_BOOKMARKED_HOTELS)
              .setArray("hotels", new Array());
      this.database.save(mutableDocument);

      return mutableDocument;
    } else {
      const docId = resultList[0]["id"]; 
      const doc = await this.database.getDocument(docId);
      const mutable = MutableDocument.fromDocument(doc);
      return mutable;
    }
  }

  private async getAllHotels() {
    const query = this.database.createQuery(`SELECT * FROM _ WHERE type = '${this.DOC_TYPE_HOTEL}' ORDER BY name`);
    const result = await query.execute();
    return await result.allResults();
  }
}
