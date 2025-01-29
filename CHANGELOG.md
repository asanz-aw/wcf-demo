# Changelog

## [3.2.1] - 2024-12-04

### Changed

- Update dependencies
- Update to w-cf 10.0.2

## [3.2.0] - 2024-11-12

### Changed

- Update dependencies (requires NodeJS >=20 now)
- Update to w-cf 10.0.1

## [3.1.0] - 2024-06-06

### Changed

- Update dependencies (requires NodeJS >=18.12 now)
- Update to w-cf 9.1.1


## [3.0.0] - 2023-10-27

### Added

- possibility to start EAIWS session with startup
- Support for unselectable property values
- showing ofmlVariantCode and variantCode in basket

### Fixed

- not working import of basket .obk

### Changed

- Update dependencies
- Update to w-cf 9.0.0 (used from npm now)

### Removed

- w-cf documentation (now available via our download center: <https://download-center.pcon-solutions.com/?cat=7>)
- IE11 support (we now build for ES2017)

## [2.4.0] - 2023-04-27

### Changed

- Use new gatekeeper API v3 with support for locale
- Update dependencies
- Update to w-cf 8.4.1

## [2.3.0] - 2022-11-07

### Fixed

- insertion of initial article (the internal catalog id of egr-test data changed from `egr:0` to `egroffice:0`)

### Changed

- Update to w-cf 8.3.0
- Update dependencies

## [2.2.0] - 2022-10-04

### Added

- OAP 1.4 message handling

### Fixed

- Not showing of planning articles in catalog

### Changed

- Update to w-cf 8.2.0
- Update dependencies

### Removed

- dom4 polyfill
- special handling of BabylonJS in webpack.config.js (not needed anymore, because of a BabylonJS update)

## [2.1.1] - 2022-05-16

### Fixed

- Not showing of oap interactor if no image is given
- Missing catalog search bar

## [2.1.0] - 2022-04-05

### Changed

- Update to w-cf 8.1.0
- Update dependencies

## [2.0.1] - 2021-11-29

### Added

- OAP back button

### Changed

- Update to w-cf 8.0.2
- Update dependencies
- Minor refactoring

## [2.0.0] - 2021-11-03

### Added

- AR-Export for iOS and Android

### Changed

- Update (and migrate) to w-cf 8.0.0
- Update dependencies
- Refactoring (naming, eslint)

## [1.4.5] - 2021-06-11

### Changed

- Update to w-cf 7.1.4
- Update dependencies

### Fixed

- add missing core (fallback) lib sha.js in index.html

## [1.4.4] - 2021-06-04

### Changed

- Update to w-cf 7.1.3
- Update dependencies (requires now NodeJS >=12.13)
- Update readme
- Remove clean-webpack-plugin (we now use webpacks 'clean' output option)

## [1.4.3] - 2021-04-20

### Changed

- Update to w-cf 7.1.2
- Update dependencies
