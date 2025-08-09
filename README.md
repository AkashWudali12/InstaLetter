# Chrome Extension Local Installation Guide

## Demo

Watch the full demo here: [Loom Video Walkthrough](https://www.loom.com/share/13cc9ffcb43f4d08b055373960afea54?sid=72798dd2-65ad-4ad3-b205-aecb18688f4a)

## Installation Steps

1. **Download the Extension**
   - Clone this repository using:
     ```bash
     git clone https://github.com/AkashWudali12/InstaLetter.git
     ```
   - Or download the ZIP file by clicking the green "Code" button and selecting "Download ZIP"
   - If downloaded as ZIP, extract the files to a convenient location on your computer

2. **Load in Chrome**
   - Open Google Chrome browser
   - Type `chrome://extensions/` in the address bar and press Enter
   - Look for the "Developer mode" toggle in the top right corner
   - Click to enable Developer mode — the toggle should move to the right and turn blue
   - Click the "Load unpacked" button that appears in the top left
   - Navigate to the folder where you extracted/cloned the extension
   - Select the folder (make sure it contains the `manifest.json` file) and click "Select Folder"
   - The extension should now appear in your extensions list

## Usage

**Accessing the Extension**
   - After successful installation, look for the extension icon in your Chrome toolbar
   - If you don't see it, click the puzzle piece icon to see all extensions
   - You can pin the extension by clicking the pin icon next to it

## Features

- [Detailed description of Feature 1]
- [Detailed description of Feature 2]
- [Detailed description of Feature 3]

## Troubleshooting

If you encounter issues:

1. **Extension not appearing**
   - Verify that Developer mode is enabled
   - Check that the correct folder was selected
   - Ensure `manifest.json` is properly formatted

2. **Extension not working**
   - Right-click the extension icon and select "Options" to check settings
   - Click the refresh icon on the extension card in `chrome://extensions/`
   - Check the Chrome console for error messages:
     1. Right-click on the extension popup
     2. Select "Inspect"
     3. Look for red error messages in the Console tab

3. **Updates not reflecting**
   - After making changes to the code:
     1. Go to `chrome://extensions/`
     2. Find your extension
     3. Click the refresh icon
     4. Reload any open tabs where the extension is being used

## Development

To modify the extension:

1. **Setup**
   - Use a code editor like VS Code
   - Make sure you have Node.js installed if using npm packages

2. **Making Changes**
   - Edit the source files as needed
   - Test changes by reloading the extension
   - Use Chrome DevTools for debugging

3. **Best Practices**
   - Keep the `manifest.json` file up to date
   - Test on different Chrome versions
   - Follow Chrome's extension guidelines

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Submit a pull request

## License

MIT License

Copyright (c) 2025 Akash Wudali

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Version History

- v1.0.0 (Initial Release)
  - [List major features/changes]

## Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- awudali@umd.edu
