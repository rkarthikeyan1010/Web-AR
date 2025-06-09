# WebAR Cube Demo

A simple WebAR application that displays a rotating 3D cube when the HIRO marker is detected.

## Requirements

- A modern web browser (Chrome, Safari, or Firefox) on Android or iOS
- Camera access
- HIRO marker (you can print it from [here](https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/HIRO.jpg))

## How to Use

1. Open the `index.html` file in your web browser
2. Allow camera access when prompted
3. Print or display the HIRO marker on another device
4. Point your camera at the HIRO marker
5. A red rotating cube should appear above the marker

## Features

- Uses A-Frame and AR.js for WebAR functionality
- Displays a semi-transparent red cube
- Cube rotates continuously
- Works on both Android and iOS devices
- Uses the HIRO marker for tracking

## Technical Details

- Built with A-Frame 1.4.0
- Uses AR.js for marker detection
- Implements continuous rotation animation
- Includes basic marker detection events

## Deployment

This project is deployed using GitHub Pages. To deploy your own version:

1. Fork this repository
2. Go to your repository's Settings
3. Scroll down to the "GitHub Pages" section
4. Under "Source", select "main" branch
5. Click "Save"
6. Your site will be published at `https://<your-username>.github.io/<repository-name>/`

Note: Make sure your repository is public for GitHub Pages to work with the free tier.

## Local Development

To run this project locally:

1. Clone the repository
2. Due to security restrictions, you'll need to serve the files through a local web server
3. You can use Python's built-in server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
4. Open `http://localhost:8000` in your browser 