const { GEOFENCE_STATES } = require('../constants/tracking.constants');

class StateMachineService {
  constructor() {
    // Structural state transition ordering map rules definition
    this.STATE_RANKINGS = Object.freeze({
      [GEOFENCE_STATES.NONE]: 0,
      [GEOFENCE_STATES.NEARBY]: 1,
      [GEOFENCE_STATES.ARRIVED]: 2,
      [GEOFENCE_STATES.COMPLETED]: 3
    });
  }

  /**
   * Asserts validity of proposed operational boundary modifications
   * @param {string} currentState 
   * @param {string} proposedState 
   * @returns {boolean} True if the modification step progresses forward legally
   */
  isValidTransition(currentState, proposedState) {
    const currentRank = this.STATE_RANKINGS[currentState] || 0;
    const proposedRank = this.STATE_RANKINGS[proposedState] || 0;

    // Fixed Bug 3: Block backward progression anomalies explicitly
    return proposedRank > currentRank;
  }
}

module.exports = new StateMachineService();