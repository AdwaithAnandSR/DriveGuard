# DriveGuard -- Master Development Plan

## Vision

DriveGuard is a professional dashcam application focused on:

-   Reliability over flashy features
-   Low battery consumption
-   Low device temperature
-   Privacy-first design
-   Intelligent cloud synchronization
-   Modern React Native user experience

The application should be capable of recording long journeys with
minimal user interaction while remaining stable even on mid-range
Android devices.

------------------------------------------------------------------------

# High-Level Architecture

``` text
React Native (Expo Development Build)
        │
        ├── UI
        ├── Settings
        ├── Gallery
        ├── Cloud
        └── Analytics
                │
        Native Bridge (Turbo Module / JSI)
                │
        CameraX Recording Engine
                │
        Android MediaCodec Hardware Encoder
                │
        MP4 Segments
                │
        Storage Manager
                │
        Upload Queue
                │
        Cloud
```

------------------------------------------------------------------------

# Why a Native Camera Module?

A dashcam records continuously for hours.

General camera APIs are optimized for capturing short videos.

A dashcam requires:

-   uninterrupted recording
-   background execution
-   loop recording
-   hardware encoding
-   automatic recovery
-   battery efficiency

Keeping the recording pipeline inside native Android code avoids
unnecessary work on the JavaScript thread.

## Comparison

### React Native Camera Flow

``` text
Camera
 ↓
Native
 ↓
Bridge
 ↓
JavaScript
 ↓
UI Updates
 ↓
Storage
```

### Native CameraX Flow

``` text
Camera
 ↓
CameraX
 ↓
MediaCodec Hardware Encoder
 ↓
MP4 Writer
 ↓
Storage
```

React Native only sends commands like:

-   Start
-   Stop
-   Pause
-   Lock Clip
-   Change Resolution

The video never travels through JavaScript.

Benefits:

-   Lower CPU usage
-   Better battery life
-   Reduced heat
-   Stable long recordings
-   Fewer dropped frames

------------------------------------------------------------------------

# Native Camera Module Responsibilities

The native module should expose only a clean API.

Example API:

``` ts
startRecording(options)

stopRecording()

pause()

resume()

takeSnapshot()

lockCurrentSegment()

switchCamera()

setTorch()

getStatus()
```

Internally it manages:

-   CameraX
-   MediaCodec
-   Audio Recorder
-   Segment rotation
-   Error recovery
-   Background execution

------------------------------------------------------------------------

# Recording Engine

Supports:

-   480p
-   720p
-   1080p
-   1440p
-   4K (device support)

FPS:

-   24
-   30
-   60

Codec:

-   H264
-   HEVC (optional)

Segment Length:

-   1
-   3
-   5
-   10 minutes

------------------------------------------------------------------------

# Loop Recording

When storage reaches a user-defined limit:

1.  Delete oldest unlocked clip.
2.  Never delete locked clips.
3.  Continue recording without interruption.

------------------------------------------------------------------------

# Storage Manager

Folders

-   Normal
-   Locked
-   Parking
-   Emergency
-   Snapshots

The storage manager should work independently of the UI.

------------------------------------------------------------------------

# Cloud Engine

Uploads should never occur directly from the recorder.

Pipeline:

Recording → Local Storage → Upload Queue → Wi-Fi Check → Cloud

Supported providers:

-   Google Drive
-   Dropbox
-   OneDrive
-   S3-compatible storage
-   Custom Node.js backend

Rules:

-   Wi-Fi only
-   Charging only
-   Locked clips only
-   Emergency clips immediately

------------------------------------------------------------------------

# Battery Optimization

Optional toggles:

-   GPS
-   Speed overlay
-   Audio
-   Screen preview
-   Cloud sync
-   Analytics

Extreme Battery Mode:

-   Preview disabled
-   720p
-   24 FPS
-   GPS off
-   Upload paused

------------------------------------------------------------------------

# Heat Management

Monitor:

-   Battery temperature
-   Charging state
-   Thermal status

Adaptive behavior:

Normal → 1080p

Warm → lower bitrate

Hot → 720p

Critical → notify user and optionally stop recording

------------------------------------------------------------------------

# Privacy

Optional:

-   Disable GPS
-   Disable microphone
-   Disable speed overlay

Cloud uploads are encrypted in transit.

------------------------------------------------------------------------

# Roadmap

## Phase 1

-   Native CameraX recorder
-   Loop recording
-   Gallery
-   Settings

## Phase 2

-   Bluetooth auto-start
-   GPS
-   Clip locking
-   Notifications

## Phase 3

-   Cloud sync
-   Upload queue
-   User accounts

## Phase 4

-   Crash detection
-   Parking mode
-   Driving analytics
-   Voice commands

## Phase 5

-   AI features
-   Web dashboard
-   Multi-device synchronization

------------------------------------------------------------------------

# Guiding Principle

The JavaScript layer should control the experience.

The native layer should control recording.

This separation keeps the UI responsive while ensuring reliable
recording during long drives.
