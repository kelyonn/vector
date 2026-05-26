# Android Studio Setup & Build Guide

Complete guide to build and run Vector app in Android Studio.

## Prerequisites

1. **Android Studio** (latest version recommended)
   - Download from: https://developer.android.com/studio
   - Install Android SDK (API level 33 or higher recommended)

2. **Java Development Kit (JDK)**
   - JDK 17 or higher
   - Android Studio usually includes this

3. **Node.js & npm**
   - Node.js 18+ and npm installed
   - Verify: `node --version` and `npm --version`

> **Local notifications:** Task reminders and daily Iron Rule / goal notifications only work on a **native** Android or iOS build. They do not fire in `npm run dev` (browser).

## Migrating from `com.example.app`

If you previously installed Vector under the old package ID (`com.example.app`), Android treats `com.vector.app` as a **different app**.

1. Export your data from the old app (Settings → Export Backup) if you want to keep progress.
2. Uninstall the old `com.example.app` APK from your device.
3. From the project root:

```bash
npm run build
npx cap sync android
npm run open:android
```

4. Build and install the new APK from Android Studio.
5. Import your backup JSON in Settings if needed.

Web data in the browser is separate from the native app and is stored in IndexedDB (migrated automatically from localStorage when you update).

## Initial Setup (One-Time)

### 1. Install Dependencies

```bash
cd /path/to/vector
npm install
```

### 2. Build Web Assets

```bash
npm run build
```

This creates the `dist/` folder with optimized web assets.

### 3. Sync to Android

```bash
npx cap sync android
```

This copies web assets to `android/app/src/main/assets/public/` and updates native plugins.

## Opening in Android Studio

### Option 1: Command Line (Recommended)

```bash
npm run open:android
```

Or manually:
```bash
npx cap open android
```

### Option 2: Manual Open

1. Open Android Studio
2. Click **File** → **Open**
3. Navigate to `/path/to/vector/android`
4. Click **OK**
5. Wait for Gradle sync to complete (may take a few minutes on first open)

## Building the APK

### Method 1: Build APK (Debug)

1. In Android Studio, wait for Gradle sync to finish
2. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build to complete
4. Click **locate** in the notification to find your APK
5. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Method 2: Run on Emulator/Device

1. **Create/Start Emulator:**
   - Click **Device Manager** (phone icon in toolbar)
   - Click **Create Device** (or use existing)
   - Select a device (e.g., Pixel 6)
   - Select system image (API 33+ recommended)
   - Finish setup

2. **Run the App:**
   - Select your device/emulator from the dropdown (top toolbar)
   - Click the green **Run** button (▶️) or press `Shift + F10`
   - App will install and launch automatically

### Method 3: Build Release APK

1. **Generate Signing Key** (first time only):
   ```bash
   keytool -genkey -v -keystore vector-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias vector
   ```
   - Store the keystore file securely
   - Remember the password and alias

2. **Configure Signing:**
   - Edit `android/app/build.gradle`
   - Add signing config (see Android documentation)

3. **Build Release:**
   - In Android Studio: **Build** → **Generate Signed Bundle / APK**
   - Select **APK**
   - Choose your keystore
   - Build variant: **release**
   - APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Development Workflow

### Making Code Changes

1. **Edit your code** in `src/` directory
2. **Rebuild web assets:**
   ```bash
   npm run build
   ```
3. **Sync to Android:**
   ```bash
   npx cap sync android
   ```
   Or use the combined command:
   ```bash
   npm run sync:android
   ```
4. **In Android Studio:** Click **Run** again (or press `Shift + F10`)

### Hot Reload (Web Development)

For faster web development (not native):
```bash
npm run dev
```
This runs a local web server. Changes reflect immediately.

## Troubleshooting

### Gradle Sync Failed

**Error:** "Gradle sync failed"
- **Solution:** 
  - File → Invalidate Caches → Invalidate and Restart
  - Or: File → Sync Project with Gradle Files

### Build Errors

**Error:** "SDK location not found"
- **Solution:** 
  - File → Project Structure → SDK Location
  - Set Android SDK location (usually `~/Library/Android/sdk` on Mac)

**Error:** "Minimum SDK version"
- **Solution:** 
  - Edit `android/app/build.gradle`
  - Ensure `minSdkVersion` is 22 or higher

### App Crashes on Launch

1. Check **Logcat** in Android Studio (bottom panel)
2. Look for error messages
3. Common issues:
   - Missing permissions (check `AndroidManifest.xml`)
   - Plugin not synced (run `npx cap sync android`)

### Web Assets Not Updating

1. Ensure `npm run build` completed successfully
2. Run `npx cap sync android` again
3. Clean build: **Build** → **Clean Project**
4. Rebuild: **Build** → **Rebuild Project**

### Notification Permissions

If notifications don't work:
1. Check device settings: **Settings** → **Apps** → **Vector** → **Notifications**
2. Ensure app has notification permission
3. Test on a real device (emulators may have limitations)

## Project Structure

```
vector/
├── android/              # Android native project
│   ├── app/
│   │   ├── build.gradle  # App-level Gradle config
│   │   └── src/
│   │       └── main/
│   │           ├── AndroidManifest.xml
│   │           └── assets/
│   │               └── public/  # Web assets (auto-generated)
│   └── build.gradle      # Project-level Gradle config
├── src/                  # React/TypeScript source code
├── dist/                 # Built web assets
└── capacitor.config.ts  # Capacitor configuration
```

## Useful Commands

```bash
# Build and sync in one command
npm run sync:android

# Open Android Studio
npm run open:android

# Build web assets only
npm run build

# Run web dev server
npm run dev

# Check Capacitor version
npx cap --version

# List installed plugins
npx cap ls
```

## Testing on Real Device

1. **Enable Developer Options:**
   - Settings → About Phone → Tap "Build Number" 7 times

2. **Enable USB Debugging:**
   - Settings → Developer Options → USB Debugging

3. **Connect Device:**
   - Connect via USB
   - Accept debugging prompt on device

4. **Run in Android Studio:**
   - Select your device from dropdown
   - Click Run

## Performance Tips

- **First Build:** May take 5-10 minutes (downloads dependencies)
- **Subsequent Builds:** Usually 30-60 seconds
- **Incremental Sync:** `npx cap sync android` is fast (~1 second)
- **Clean Build:** If issues occur, try **Build** → **Clean Project**

## Next Steps

- Test all features (tasks, scheduling, notifications)
- Test on multiple Android versions if possible
- Build release APK for distribution
- Consider setting up CI/CD for automated builds

---

**Need Help?**
- Check Capacitor docs: https://capacitorjs.com/docs
- Android Studio docs: https://developer.android.com/studio
- Check `android/app/build.gradle` for build configuration
