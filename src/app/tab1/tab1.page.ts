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

  constructor(private databaseService: DatabaseService) {}

  async ngOnInit() {
    this.hotels = await this.databaseService.getHotels();
  }

  async searchQueryChanged(newQuery) {
    this.hotels = await this.databaseService.filterData(newQuery);
  }

}
