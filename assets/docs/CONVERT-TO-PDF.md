# Converting Compliance Documentation to PDF

The compliance documentation is currently in HTML format. To convert it to PDF:

## Option 1: Browser Print to PDF
1. Open `compliance-documentation.html` in a web browser
2. Press `Ctrl+P` (Windows) or `Cmd+P` (Mac)
3. Select "Save as PDF" as the destination
4. Save as `compliance-documentation.pdf` in the same directory

## Option 2: Online Converters
- Use online HTML to PDF converters like:
  - https://www.ilovepdf.com/html-to-pdf
  - https://www.pdf24.org/en/html-to-pdf
  - https://htmlpdfapi.com/

## Option 3: Command Line Tools
- **wkhtmltopdf**: `wkhtmltopdf compliance-documentation.html compliance-documentation.pdf`
- **Puppeteer**: Use Node.js with Puppeteer to generate PDF
- **Chrome Headless**: `chrome --headless --print-to-pdf=compliance-documentation.pdf compliance-documentation.html`

## Option 4: Professional Tools
- Adobe Acrobat
- Microsoft Word (open HTML, save as PDF)

After conversion, update the link in `index.html` to point to `compliance-documentation.pdf` instead of `.html`.

