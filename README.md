Demo app for the "Build Offline-Enabled Mobile Apps With Ionic and Couchbase Lite" talk at Couchbase Connect 2021. The app allows users to search and bookmark hotels using data loaded from a Couchbase Lite database.

> Building mobile apps that require offline data storage capabilities? Using Ionic’s open source development kit, web development teams can now build fast, offline-enabled apps using JavaScript and Ionic's Couchbase Lite integration. This app runs on iOS, Android, and native Windows all from one codebase.

## Features

* Data from a Couchbase Lite database: The database is embedded into the Android and iOS apps.

* UI components powered by Ionic Framework: search bar, bookmarks, icons, list items, and more.

* Bookmarked hotels: Saved in a Couchbase Lite database.

* Cross-platform: Create iOS, Android, and native Windows apps all from the same codebase.

## Tech Details

- UI: [Ionic Framework 6](https://ionicframework.com) and [Angular 12](https://angular.io)
- Native runtime: [Capacitor 3](https://capacitorjs.com)
- Database: Couchbase Lite v3.0 powered by [Ionic's CBL integration](https://ionic.io/docs/couchbase-lite)

## How to Run

Note: Installing and running this app, which uses Ionic's Couchbase Lite integration, requires a subscription to [Ionic Enterprise](https://ionicframework.com/enterprise). For details, pricing info, and a live demo, please reach out [here](https://ionic.io/contact/sales).

- Sign up for [a free trial](https://dashboard.ionicframework.com/personal/apps?native_trial=1) of Ionic's Couchbase Lite integration.
- Install the Ionic CLI: `npm install -g @ionic/cli`
- Clone this repository
- Register your native trial key: `ionic enterprise register`
- Build the app: `ionic build` then `npx cap sync`
- Run the app on your device. Either `npx cap open android` or `npx cap open ios`
