import AppIntents
import SwiftUI

/// Linked to main app + extension (_shared). Required for Control Center when openAppWhenRun is true.
/// https://github.com/EvanBacon/expo-apple-targets#control-widgets
@available(iOS 18.0, *)
struct OpenScanIntent: ControlConfigurationIntent {
    static let title: LocalizedStringResource = "Scan Equipment"
    static let description = IntentDescription(
        stringLiteral: "Open VetTrack and scan an equipment tag."
    )
    static let isDiscoverable = true
    static let openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult & OpensIntent {
        .result(opensIntent: OpenURLIntent(URL(string: "vettrack://scan")!))
    }
}
