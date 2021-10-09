import { Component } from '@angular/core';
import { hotelData } from '../data/hotels';
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
  currentSearchQuery: string = "";
  toggleBookmarkFilter: boolean = false;

  constructor(private databaseService: DatabaseService) {}

  async ngOnInit() {
    this.hotels = await this.databaseService.getHotels();
    this.hotelsDisplayed = this.hotels;
  }

  toggleBookmark(hotel) {
    hotel.bookmarked = !hotel.bookmarked;
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
    this.hotelsDisplayed = await this.databaseService.filterData(hotelName);
  }
}
