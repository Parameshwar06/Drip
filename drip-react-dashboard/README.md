# Smart Drip Irrigation Dashboard - React Version

A modern, responsive IoT dashboard built with React for monitoring and controlling smart drip irrigation systems.

## Features

- **User Authentication**: Secure login/register with Firebase Auth
- **Real-time Data**: Live sensor data monitoring (moisture, temperature, humidity)
- **Valve Control**: Remote valve operation (open/close)
- **Data Visualization**: Interactive moisture history chart using Chart.js
- **Multi-user Support**: Separate data for each user account
- **Responsive Design**: Beautiful, modern UI that works on all devices

## Tech Stack

- **Frontend**: React, CSS3
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **Charts**: Chart.js with react-chartjs-2
- **Styling**: Custom CSS with modern gradients and animations

## Project Structure

```
src/
├── components/
│   ├── Dashboard.js      # Main dashboard component
│   ├── Login.js          # Login form component
│   ├── Register.js       # Registration form component
│   ├── SensorCard.js     # Individual sensor display card
│   ├── ValveCard.js      # Valve control card
│   └── MoistureChart.js  # Chart component for moisture history
├── config/
│   └── firebase.js       # Firebase configuration
├── App.js                # Main app component
├── App.css               # Global styles
└── index.js              # App entry point
```

## Setup Instructions

1. **Clone and Install**:
   ```bash
   cd drip-react-dashboard
   npm install
   ```

2. **Firebase Setup**:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Realtime Database and Authentication (Email/Password)
   - Update `src/config/firebase.js` with your Firebase config
   - Add your domain to Firebase Authentication > Authorized domains

3. **Run the App**:
   ```bash
   npm start
   ```

## Firebase Database Structure

```json
{
  "SensorData": {
    "user-uid-1": {
      "node1": {
        "moisture": 512,
        "temperature": 26.4,
        "humidity": 62.1,
        "valveStatus": "OFF",
        "timestamp": 1691234567
      }
    },
    "user-uid-2": {
      "node1": {
        // Separate data for different users
      }
    }
  }
}
```

## Features in Detail

### Authentication
- Secure user registration and login
- Separate data storage per user
- Session persistence

### Dashboard
- Real-time sensor monitoring
- Interactive charts showing moisture trends
- Valve control with immediate feedback
- Professional, dark-themed UI

### Charts
- Last 20 moisture readings
- Auto-refresh every 10 seconds
- Responsive design
- Custom styling to match theme

## Deployment

To deploy to production:

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting** (optional):
   ```bash
   npm install -g firebase-tools
   firebase init hosting
   firebase deploy
   ```

## Development

- The app uses Firebase v9+ modular SDK
- All components are functional components with hooks
- Real-time updates using Firebase onValue listeners
- Error handling for network and authentication issues

## Customization

- Modify colors in `App.css`
- Add new sensor types in `Dashboard.js`
- Customize chart options in `MoistureChart.js`
- Add new features by creating components in `components/`

## License

MIT License - feel free to use this project for your IoT applications!

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
