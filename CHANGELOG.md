# Changelog

## 1.1.0

- Upgrade to Node v24 [#143](https://github.com/DEFRA/rod-catch-returns-api-js/pull/143) (Iris Faraway)
- Update river names for the River Esk [#141](https://github.com/DEFRA/rod-catch-returns-api-js/pull/141) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Unit tests failing for JS API when Airbrake env values are empty [#140](https://github.com/DEFRA/rod-catch-returns-api-js/pull/140) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 1.0.0

- Update the RCR CRM Activity if the submission has been marked as submitted [#138](https://github.com/DEFRA/rod-catch-returns-api-js/pull/138) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Create an RCR CRM Activity if a new submission is started [#137](https://github.com/DEFRA/rod-catch-returns-api-js/pull/137) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Migrate GetContactByLicenceAndPostcode in CRM to an OData query [#136](https://github.com/DEFRA/rod-catch-returns-api-js/pull/136) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add logging for query parameters [#135](https://github.com/DEFRA/rod-catch-returns-api-js/pull/135) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Don't log error if you have released more fish than you have caught [#134](https://github.com/DEFRA/rod-catch-returns-api-js/pull/134) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Move from node-fetch to native fetch [#133](https://github.com/DEFRA/rod-catch-returns-api-js/pull/133) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Performance improvement - POST /smallCatches [#131](https://github.com/DEFRA/rod-catch-returns-api-js/pull/131) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Update README for integration tests [#132](https://github.com/DEFRA/rod-catch-returns-api-js/pull/132) (Phil Benson)
- Performance improvement - POST /catches [#129](https://github.com/DEFRA/rod-catch-returns-api-js/pull/129) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Fix missing parameter in performance improvement [#130](https://github.com/DEFRA/rod-catch-returns-api-js/pull/130) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Performance improvement - POST /activities [#128](https://github.com/DEFRA/rod-catch-returns-api-js/pull/128) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 0.11.0

- Pin API packages to current patch version [#124](https://github.com/DEFRA/rod-catch-returns-api-js/pull/124) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 0.10.0

- Log info if RCR activity already exists for a user [#119](https://github.com/DEFRA/rod-catch-returns-api-js/pull/119) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Meaningful Error message is not displayed for duplicate submission [#122](https://github.com/DEFRA/rod-catch-returns-api-js/pull/122) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Delete grilse probablity by id [#118](https://github.com/DEFRA/rod-catch-returns-api-js/pull/118) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get all grilse probabilities [#116](https://github.com/DEFRA/rod-catch-returns-api-js/pull/116) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add logging to all requests except health check [#123](https://github.com/DEFRA/rod-catch-returns-api-js/pull/123) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add logging to all requests [#121](https://github.com/DEFRA/rod-catch-returns-api-js/pull/121) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 0.9.0

- Update Sonarcloud GitHub Action [#117](https://github.com/DEFRA/rod-catch-returns-api-js/pull/117) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get Jenkins environment variables from AWS [#115](https://github.com/DEFRA/rod-catch-returns-api-js/pull/115) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Adding multiple small catches for the same month displays page not fo… [#113](https://github.com/DEFRA/rod-catch-returns-api-js/pull/113) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Incorrect error message for mandatory release date during leap years [#114](https://github.com/DEFRA/rod-catch-returns-api-js/pull/114) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Separate integration and unit tests [#112](https://github.com/DEFRA/rod-catch-returns-api-js/pull/112) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Delete submission by id [#110](https://github.com/DEFRA/rod-catch-returns-api-js/pull/110) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 0.8.0

- No Error message, when trying to upload an empty age-weight key [#109](https://github.com/DEFRA/rod-catch-returns-api-js/pull/109) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Don't log validation as errors [#108](https://github.com/DEFRA/rod-catch-returns-api-js/pull/108) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 0.7.0

- Error message missing when invalid month entered on both small and la… [#106](https://github.com/DEFRA/rod-catch-returns-api-js/pull/106) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add missing PUT endpoints [#105](https://github.com/DEFRA/rod-catch-returns-api-js/pull/105) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Error when displaying a submission with 40 large catches in the admin… [#104](https://github.com/DEFRA/rod-catch-returns-api-js/pull/104) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add Liquibase Rollback migration to Jenkins [#103](https://github.com/DEFRA/rod-catch-returns-api-js/pull/103) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add Liquibase Update migration to Jenkins [#102](https://github.com/DEFRA/rod-catch-returns-api-js/pull/102) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Review logging [#100](https://github.com/DEFRA/rod-catch-returns-api-js/pull/100) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add Liquibase Initialise migration to Jenkins [#101](https://github.com/DEFRA/rod-catch-returns-api-js/pull/101) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Update Swagger API documentation [#99](https://github.com/DEFRA/rod-catch-returns-api-js/pull/99) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Investigate and resolve deprecation warnings in JS API [#98](https://github.com/DEFRA/rod-catch-returns-api-js/pull/98) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Admin and fmt users to add or update small catches with internal methods [#96](https://github.com/DEFRA/rod-catch-returns-api-js/pull/96) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Admin and fmt users to add or update catches with internal methods [#95](https://github.com/DEFRA/rod-catch-returns-api-js/pull/95) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Admin and fmt user can enter 0 for days fished [#94](https://github.com/DEFRA/rod-catch-returns-api-js/pull/94) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Only allow admin and fmt users to add or update activities with inter… [#93](https://github.com/DEFRA/rod-catch-returns-api-js/pull/93) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Account disabled and role required screens [#91](https://github.com/DEFRA/rod-catch-returns-api-js/pull/91) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Fix acceptance tests [#92](https://github.com/DEFRA/rod-catch-returns-api-js/pull/92) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add accessToken middleware [#90](https://github.com/DEFRA/rod-catch-returns-api-js/pull/90) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 0.6.0

- Refactor NODE_ENV for airbrake [#88](https://github.com/DEFRA/rod-catch-returns-api-js/pull/88) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add /profile endpoint [#87](https://github.com/DEFRA/rod-catch-returns-api-js/pull/87) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Initialise cache [#86](https://github.com/DEFRA/rod-catch-returns-api-js/pull/86) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Logging to AirBrake [#83](https://github.com/DEFRA/rod-catch-returns-api-js/pull/83) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add missing rollback scripts [#85](https://github.com/DEFRA/rod-catch-returns-api-js/pull/85) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Review logging in the external user api [#82](https://github.com/DEFRA/rod-catch-returns-api-js/pull/82) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 0.5.0

- Get Grilse Probability [#81](https://github.com/DEFRA/rod-catch-returns-api-js/pull/81) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Grilse validation for rows [#80](https://github.com/DEFRA/rod-catch-returns-api-js/pull/80) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Grilse validation for headers [#79](https://github.com/DEFRA/rod-catch-returns-api-js/pull/79) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Upload Grilse Probability Validation [#78](https://github.com/DEFRA/rod-catch-returns-api-js/pull/78) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get submission by contact id endpoint [#76](https://github.com/DEFRA/rod-catch-returns-api-js/pull/76) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Upload Grilse Probability endpoint [#73](https://github.com/DEFRA/rod-catch-returns-api-js/pull/73) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get contact by licence number endpoint [#75](https://github.com/DEFRA/rod-catch-returns-api-js/pull/75) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get submission for activity [#72](https://github.com/DEFRA/rod-catch-returns-api-js/pull/72) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 0.4.0

- Fix issue with mass in kg and oz less than 0 [#74](https://github.com/DEFRA/rod-catch-returns-api-js/pull/74) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get all Grilse Weight Gates [#69](https://github.com/DEFRA/rod-catch-returns-api-js/pull/69) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Validate species when updating a catch [#70](https://github.com/DEFRA/rod-catch-returns-api-js/pull/70) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Validate method when updating a small catch [#71](https://github.com/DEFRA/rod-catch-returns-api-js/pull/71) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Update small catch by id [#68](https://github.com/DEFRA/rod-catch-returns-api-js/pull/68) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Update salmon and large adult sea trout [#66](https://github.com/DEFRA/rod-catch-returns-api-js/pull/66) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Update an existing activity [#61](https://github.com/DEFRA/rod-catch-returns-api-js/pull/61) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Delete a small catch by id [#65](https://github.com/DEFRA/rod-catch-returns-api-js/pull/65) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Delete a catch by id [#63](https://github.com/DEFRA/rod-catch-returns-api-js/pull/63) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 0.3.0

- Tests fail and migrations won't run [#62](https://github.com/DEFRA/rod-catch-returns-api-js/pull/62) (Phil Benson)
- Delete an activity by id [#56](https://github.com/DEFRA/rod-catch-returns-api-js/pull/56) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Update activity in CRM when a submission is submitted [#57](https://github.com/DEFRA/rod-catch-returns-api-js/pull/57) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add links for rivers and clean up error messages [#55](https://github.com/DEFRA/rod-catch-returns-api-js/pull/55) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get small catch by id [#60](https://github.com/DEFRA/rod-catch-returns-api-js/pull/60) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get catch by id [#59](https://github.com/DEFRA/rod-catch-returns-api-js/pull/59) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get activity by id [#58](https://github.com/DEFRA/rod-catch-returns-api-js/pull/58) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get fishing method associated with a catch [#54](https://github.com/DEFRA/rod-catch-returns-api-js/pull/54) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get species associated with a catch [#53](https://github.com/DEFRA/rod-catch-returns-api-js/pull/53) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get activity associated with a small catch [#51](https://github.com/DEFRA/rod-catch-returns-api-js/pull/51) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get activity associated with a catch [#48](https://github.com/DEFRA/rod-catch-returns-api-js/pull/48) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Update submission by ID [#47](https://github.com/DEFRA/rod-catch-returns-api-js/pull/47) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 0.2.0

- Fix small catch integration test [#49](https://github.com/DEFRA/rod-catch-returns-api-js/pull/49) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get fishing method by id [#46](https://github.com/DEFRA/rod-catch-returns-api-js/pull/46) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get all salmon and large adult sea trout associated with an activity [#45](https://github.com/DEFRA/rod-catch-returns-api-js/pull/45) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Validation for add salmon and large adult sea trout to an activity [#44](https://github.com/DEFRA/rod-catch-returns-api-js/pull/44) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add salmon and large adult sea trout to an activity [#42](https://github.com/DEFRA/rod-catch-returns-api-js/pull/42) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Create activity in CRM when a submission is created [#40](https://github.com/DEFRA/rod-catch-returns-api-js/pull/40) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get small catches associated with an an activity [#39](https://github.com/DEFRA/rod-catch-returns-api-js/pull/39) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- fix upload to ECR version [#43](https://github.com/DEFRA/rod-catch-returns-api-js/pull/43) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 0.1.0

- Add small catch to an activity [#38](https://github.com/DEFRA/rod-catch-returns-api-js/pull/38) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add small catch to an activity [#37](https://github.com/DEFRA/rod-catch-returns-api-js/pull/37) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get river associated with an activity [#35](https://github.com/DEFRA/rod-catch-returns-api-js/pull/35) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Fix for daysFishedWithMandatoryRelease [#36](https://github.com/DEFRA/rod-catch-returns-api-js/pull/36) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get all fishing methods [#34](https://github.com/DEFRA/rod-catch-returns-api-js/pull/34) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get activities for a submission [#33](https://github.com/DEFRA/rod-catch-returns-api-js/pull/33) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Create activity for a submission [#32](https://github.com/DEFRA/rod-catch-returns-api-js/pull/32) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get submission by id [#31](https://github.com/DEFRA/rod-catch-returns-api-js/pull/31) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get submission by contact id and season [#30](https://github.com/DEFRA/rod-catch-returns-api-js/pull/30) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Create submissions for a user [#29](https://github.com/DEFRA/rod-catch-returns-api-js/pull/29) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get all species [#28](https://github.com/DEFRA/rod-catch-returns-api-js/pull/28) ([@ScottDormand96](https://github.com/ScottDormand96))
- Get all regions [#27](https://github.com/DEFRA/rod-catch-returns-api-js/pull/27) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Get all catchments [#26](https://github.com/DEFRA/rod-catch-returns-api-js/pull/26) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Ensure we have 100% code coverage [#25](https://github.com/DEFRA/rod-catch-returns-api-js/pull/25) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Endpoint to get all rivers [#24](https://github.com/DEFRA/rod-catch-returns-api-js/pull/24) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add validation to environment variables [#23](https://github.com/DEFRA/rod-catch-returns-api-js/pull/23) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add endpoint to allow angler to login [#20](https://github.com/DEFRA/rod-catch-returns-api-js/pull/20) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Make database name to connect to configurable [#22](https://github.com/DEFRA/rod-catch-returns-api-js/pull/22) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Modify GitHub Actions to deploy image to ECR [#19](https://github.com/DEFRA/rod-catch-returns-api-js/pull/19) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Create connection to CRM [#18](https://github.com/DEFRA/rod-catch-returns-api-js/pull/18) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Swagger API Docs [#17](https://github.com/DEFRA/rod-catch-returns-api-js/pull/17) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Docker prod build [#16](https://github.com/DEFRA/rod-catch-returns-api-js/pull/16) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add Sonar checks to GitHub Actions [#15](https://github.com/DEFRA/rod-catch-returns-api-js/pull/15) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Liquibase migrations [#14](https://github.com/DEFRA/rod-catch-returns-api-js/pull/14) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add tests to GitHub actions [#13](https://github.com/DEFRA/rod-catch-returns-api-js/pull/13) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Setup tagging for release using GitHub actions [#8](https://github.com/DEFRA/rod-catch-returns-api-js/pull/8) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## 0.0.2

- Setup tagging for release using GitHub actions (Nabeel Amir)
- Setup Docker infrastructure for local [#7](https://github.com/DEFRA/rod-catch-returns-api-js/pull/7) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Connect to PostgreSQL Database [#6](https://github.com/DEFRA/rod-catch-returns-api-js/pull/6) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add Husky [#5](https://github.com/DEFRA/rod-catch-returns-api-js/pull/5) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Add linting [#4](https://github.com/DEFRA/rod-catch-returns-api-js/pull/4) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Setup jest [#3](https://github.com/DEFRA/rod-catch-returns-api-js/pull/3) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- Setup Hapi [#2](https://github.com/DEFRA/rod-catch-returns-api-js/pull/2) ([@nabeelamir-defra](https://github.com/nabeelamir-defra))
- pr comment - fixed contributing page (Nabeel Amir)
- initialised project (Nabeel Amir)
- Initialise project (Nabeel Amir)
- initial commit (Nabeel Amir)
