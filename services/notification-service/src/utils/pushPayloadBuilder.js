/**
 * Tailors messaging structural frame formatting variations according to unique OS requirements
 */
class PushPayloadBuilder {
  static buildMutedPlatformPayload(title, body, priority, customMetadata = {}) {
    const payloadStringMap = JSON.parse(JSON.stringify(customMetadata));
    
    return {
      notification: {
        title,
        body
      },
      android: {
        priority: priority === 'HIGH' || priority === 'CRITICAL' ? 'high' : 'normal',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          channelId: priority === 'CRITICAL' ? 'justtap_emergency_alerts' : 'justtap_general_alerts'
        }
      },
      apns: {
        headers: {
          'apns-priority': priority === 'HIGH' || priority === 'CRITICAL' ? '10' : '5'
        },
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            badge: 1
          }
        }
      },
      data: {
        ...payloadStringMap,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        sent_timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = PushPayloadBuilder;