import { Component } from '@angular/core';
import { Hotel } from '../models/hotel';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  hotels: Hotel[] = [];
  currentSearchQuery: string = "";

  constructor(private databaseService: DatabaseService) {}

  async ngOnInit() {
    //this.hotels = await this.databaseService.getHotels();

    this.hotels = [
      {
        name: "Hotel California", address: "123 Fake Street", phone: "444-111-3333", bookmarked: false
      },
      {
        name: "Hotel Madison", address: "456 Fear Street", phone: "666-777-8888", bookmarked: true
      }
    ]

  }

  toggleBookmark(hotel) {
    hotel.bookmarked = !hotel.bookmarked;
  }

  async searchQueryChanged(newQuery) {
    this.hotels = await this.databaseService.filterData(newQuery);
  }

}
