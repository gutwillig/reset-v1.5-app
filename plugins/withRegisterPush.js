const { withAppDelegate } = require("expo/config-plugins");

/**
 * Config plugin that adds registerForRemoteNotifications to AppDelegate.
 * This is needed because we removed expo-notifications (which was doing this
 * natively) but the Braze SDK still needs the APNs token to be requested.
 * Braze's enableBrazeIosPush handles the delegate callback to receive the token.
 */
module.exports = function withRegisterPush(config) {
  return withAppDelegate(config, (config) => {
    const contents = config.modResults.contents;

    if (!contents.includes("registerForRemoteNotifications")) {
      config.modResults.contents = contents.replace(
        /return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/,
        `UIApplication.shared.registerForRemoteNotifications()\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`
      );
    }

    return config;
  });
};
