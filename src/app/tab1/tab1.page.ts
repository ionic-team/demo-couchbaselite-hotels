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
  hotelsDisplayed: Hotel[] = [];
  toggleBookmarkFilter: boolean = false;

  constructor(private databaseService: DatabaseService) {}

  async ngOnInit() {
    this.hotels = await this.databaseService.getHotels();
    this.hotelsDisplayed = this.hotels;
  }

  async toggleBookmark(hotel) {
    hotel.bookmarked = !hotel.bookmarked;

    await this.databaseService.bookmarkHotel(hotel.id);
  }

  toggleShowBookmarks() {
    this.toggleBookmarkFilter = !this.toggleBookmarkFilter;

    if (this.toggleBookmarkFilter) {
      const filtered = this.hotels.filter(h => h.bookmarked == true);
      this.hotelsDisplayed = filtered;
    }
    else {
      this.hotelsDisplayed = this.hotels;
    }
  }

  async searchQueryChanged(hotelName) {
    this.hotelsDisplayed = await this.databaseService.searchHotels(hotelName);
  }
}
