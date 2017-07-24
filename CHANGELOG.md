# CheckIT Changelog

## [3.0.0] - 2017-07-24

### Added

- CHANGELOG.md. Content backdated to version 2.0.0.
- Setup and build scripts.
- Google Directory API endpoint and Google Directory User List endpoint.
- User lookup when checking out a device as an admin.

### Changed

- Updated content in README to include general project information and installation instructions.
- Resized history content so user's with long names are visible on the page.
- Updated Wiki to provide information about the application and a User Guide.
- Updated validation to be integrated into the page rather than use a popup modal.

### Removed
- The scan button from the webpage view.
- Unnecessary files from certs folder.

### Fixed

- Invalid ID modal now displays a single Okay button.
- "checkedouts" list page title now displays as "checked out".
- Fix styling errors in code noted by `gulp build-spa`.

## [2.0.0] - 2016-08-12

Initial public release for CheckIT.

### Added

- Check out and check in assets.
- Quick scan feature on home page to navigate to asset details.
- Admin users can add, edit, and remove devices.
- Admin users can check out and check in assets for someone else.

[Unreleased]: https://github.com/PointSource/checkit-blueoak/compare/v3.0.0...master
[3.0.0]: https://github.com/PointSource/checkit-blueoak/compare/v2.0.0...v3.0.0