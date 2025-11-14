/**
 * @typedef {Object} PermissionRequest
 * @property {number} targetUserRolePosition
 * @property {number} requestUserRolePosition
 * @property {number} botRolePosition
 */
class PermissionRequest {
  constructor(
    targetUserRolePosition,
    requestUserRolePosition,
    botRolePosition,
  ) {
    this.targetUserRolePosition = targetUserRolePosition;
    this.requestUserRolePosition = requestUserRolePosition;
    this.botRolePosition = botRolePosition;
  }
}

const REASONS = {
  TARGET_HIGHER_OR_EQUAL_REQUEST: "TARGET_HIGHER_OR_EQUAL_REQUEST",
  TARGET_HIGHER_OR_EQUAL_BOT: "TARGET_HIGHER_OR_EQUAL_BOT",
  TARGET_IS_HIGHEST: "TARGET_IS_HIGHEST",
  ALLOWED: "ALLOWED",
};

module.exports = {
  /**
   *
   * @param {PermissionRequest} request
   */
  doesHaveSufficientPermission(request) {
    if (request.targetUserRolePosition >= request.targetUserRolePosition) {
      return { allowed: false, reason: REASONS.TARGET_HIGHER_OR_EQUAL_REQUEST };
    }
    if (request.targetUserRolePosition >= request.botRolePosition) {
      return { allowed: false, reason: REASONS.TARGET_HIGHER_OR_EQUAL_BOT };
    }
    return { allowed: true, reason: REASONS.ALLOWED };
  },
  PermissionRequest,
  REASONS,
};

