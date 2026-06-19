/** @type {import("@bacons/apple-targets/app.plugin").Config} */
module.exports = {
  type: "widget",
  name: "VetTrackControl",
  displayName: "VetTrack Scan",
  deploymentTarget: "18.0",
  bundleIdentifier: ".control",
  frameworks: ["SwiftUI", "WidgetKit", "AppIntents"],
};
