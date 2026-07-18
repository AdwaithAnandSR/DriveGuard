"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
// Use a dynamic import or simple require with the type fix
const pkg = require("../../../../package.json");
const withDriveCamManifest = config => {
    return (0, config_plugins_1.withAndroidManifest)(config, config => {
        const androidManifest = config.modResults;
        const mainApplication = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
        // 1. Inject Required Permissions
        config_plugins_1.AndroidConfig.Permissions.addPermission(androidManifest, "android.permission.CAMERA");
        config_plugins_1.AndroidConfig.Permissions.addPermission(androidManifest, "android.permission.RECORD_AUDIO");
        config_plugins_1.AndroidConfig.Permissions.addPermission(androidManifest, "android.permission.FOREGROUND_SERVICE");
        config_plugins_1.AndroidConfig.Permissions.addPermission(androidManifest, "android.permission.FOREGROUND_SERVICE_CAMERA");
        config_plugins_1.AndroidConfig.Permissions.addPermission(androidManifest, "android.permission.POST_NOTIFICATIONS");
        // 2. Inject the Foreground Service
        const serviceName = "expo.modules.drivecam.CameraForegroundService";
        // Prevent duplicate injections if prebuild is run multiple times
        const hasService = mainApplication.service?.some((s) => s.$["android:name"] === serviceName);
        if (!hasService) {
            if (!mainApplication.service) {
                mainApplication.service = [];
            }
            mainApplication.service.push({
                $: {
                    "android:name": serviceName,
                    "android:enabled": "true",
                    "android:exported": "false",
                    "android:foregroundServiceType": "camera"
                }
            });
        }
        return config;
    });
};
// createRunOncePlugin ensures the plugin is only executed once during prebuild
exports.default = (0, config_plugins_1.createRunOncePlugin)(withDriveCamManifest, pkg.name, pkg.version);
