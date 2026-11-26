# BIDA Hong Kong Event

Extract the entire ZIP into one folder. Open index.html in Chrome or Edge. Keep the css, js and assets folders alongside both HTML files. Opening a file in a ZIP viewer can omit its companion files.

## Files

- index.html — landing page, download previews and booth registration form.
- registered.html — confirmation ticket. Open it by submitting the form in index.html.
- css/ — responsive page and ticket styles.
- js/ — activity selection, form validation, registration, ticket display and PNG export.
- assets/images/ — the site’s original bundled graphics, including logos, feature icons, badges and backgrounds.
- assets/fonts/ — Inter, its license and an embedded web-font stylesheet for local browser use.

## Running locally

No installation, build, CDN connection or server is required. The live version uses plain CSS. Its store buttons open preview dialogs. Registration saves a demo record in the current tab’s session storage. Use a sample name and keep both pages in the same tab. Browser policies that block local storage can prevent registration. The saved code image is generated locally.

For local-file compatibility, the font stylesheet includes the bundled Inter font and the PNG export code includes a copy of the original BIDA logo. The site uses raster graphics for its branded headline and store badges.
