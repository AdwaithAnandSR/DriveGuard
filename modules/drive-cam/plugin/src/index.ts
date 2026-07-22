import {
    ConfigPlugin,
    withAndroidManifest,
    AndroidConfig,
    createRunOncePlugin
} from "expo/config-plugins";

// Use a dynamic import or simple require with the type fix
const pkg = require("../../../../package.json");


const withDriveCamManifest: ConfigPlugin = config => {
    return withAndroidManifest(config, config => {
        const androidManifest = config.modResults;
        const mainApplication =
            AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);

        // 1. Inject Required Permissions
        AndroidConfig.Permissions.addPermission(
            androidManifest,
            "android.permission.CAMERA"
        );
        AndroidConfig.Permissions.addPermission(
            androidManifest,
            "android.permission.RECORD_AUDIO"
        );
        AndroidConfig.Permissions.addPermission(
            androidManifest,
            "android.permission.FOREGROUND_SERVICE"
        );
        AndroidConfig.Permissions.addPermission(
            androidManifest,
            "android.permission.FOREGROUND_SERVICE_CAMERA"
        );
        AndroidConfig.Permissions.addPermission(
            androidManifest,
            "android.permission.POST_NOTIFICATIONS"
        );

        // 2. Inject the Foreground Service
        const serviceName = "expo.modules.drivecam.CameraForegroundService";

        // Prevent duplicate injections if prebuild is run multiple times
        const hasService = mainApplication.service?.some(
            (s: any) => s.$["android:name"] === serviceName
        );

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
export default createRunOncePlugin(withDriveCamManifest, pkg.name, pkg.version);
