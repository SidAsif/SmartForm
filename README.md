# SmartForm Auto-Filler

A Chrome extension that auto-fills web forms and surveys with realistic random data or saved profile information.

## Features

### 🎯 Two Filling Modes
- **Profile Fill**: Save your personal information once and autofill forms instantly
- **Random Fill**: Generate realistic random data for testing and surveys

### 🧠 Smart Field Recognition
- Automatically detects field types: name, email, phone, address, company, job title, and more
- Context-aware generation for surveys: age ranges, gender, location, ratings, feedback
- Special handling for dates, times, and numeric inputs

### 📊 Survey & Feedback Optimization
- Natural, human-like responses for feedback fields
- Realistic rating distributions (70-85% positive skew)
- Support for Likert scales, NPS scores, satisfaction levels, and frequency questions

### ⚙️ User-Friendly
- Simple popup interface with one-click filling
- Profile management through settings page
- Real-time field detection and count display

## Installation

### From Source

1. Clone this repository:
```bash
git clone https://github.com/SidAsif/SmartForm.git
cd SmartForm
```

2. Build the extension:
```bash
npm install
npm run build
```

3. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

## Usage

### Random Fill
1. Navigate to any web form
2. Click the extension icon in your browser toolbar
3. Click "Random Fill" button
4. The form will be automatically filled with realistic random data

### Profile Fill
1. Click the extension icon
2. Click "Settings" to open the options page
3. Fill in your profile information
4. Save your profile
5. On any form, click "Profile Fill" to auto-fill with your saved data

## Architecture

This extension follows Clean Architecture principles with clear separation of concerns:

```
src/
├── domain/              # Business logic and entities
│   ├── entities/        # Core data models (FormField, Profile)
│   └── services/        # Domain services
├── application/         # Use cases
│   └── useCases/        # Application-specific business rules
├── infrastructure/      # External interfaces
│   ├── chrome/          # Chrome API wrappers
│   ├── content/         # Content script utilities
│   └── generators/      # Data generation services
└── presentation/        # UI layer
    ├── popup/           # Extension popup
    └── options/         # Settings page
```

## Development

### Prerequisites
- Node.js (v14 or higher)
- npm

### Build Commands

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# The built extension will be in the dist folder
```

## Technologies

- **Vanilla JavaScript** - No frameworks, pure ES6+ modules
- **Chrome Extension Manifest V3** - Latest extension platform
- **Clean Architecture** - Domain-Driven Design principles
- **CSS3** - Modern styling with animations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Privacy Policy

SmartForm Auto-Filler is committed to protecting your privacy. This privacy policy explains how we handle your data:

### Data Collection
- **We do NOT collect any user data**
- **We do NOT track your browsing activity**
- **We do NOT share any information with third parties**

### Data Storage
- **Local Storage Only**: All profile data (name, email, phone, address, etc.) is stored locally on your device using Chrome's storage API
- **No External Transmission**: Your data never leaves your device and is not sent to any external servers
- **No Analytics**: We do not use any analytics or tracking tools

### Permissions Explained
- **activeTab**: Required to detect and fill form fields on the current webpage when you click the extension
- **storage**: Required to save your profile data locally on your device
- **scripting**: Required to inject scripts that detect form fields and fill them with data
- **host_permissions (<all_urls>)**: Required to work on all websites with forms. The extension only accesses pages when you explicitly use it

### Your Control
- You can delete all stored profile data at any time through the extension settings
- Uninstalling the extension removes all locally stored data
- The extension only runs when you explicitly activate it

### Open Source
- Our code is open source and available for review on [GitHub](https://github.com/SidAsif/SmartForm)
- Anyone can verify that we're not collecting or transmitting data

### Contact
If you have any questions about this privacy policy:
- Email: your.email@example.com
- GitHub Issues: [https://github.com/SidAsif/SmartForm/issues](https://github.com/SidAsif/SmartForm/issues)

**Last Updated**: November 29, 2024

---

## License

MIT License - feel free to use this project for any purpose.

## Support

If you encounter any issues or have questions:
- Open an issue on [GitHub](https://github.com/SidAsif/SmartForm/issues)

---

**Note**: This extension is for testing and development purposes. Always ensure you have permission before auto-filling forms.
