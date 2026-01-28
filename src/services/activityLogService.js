const ActivityLog = require('../models/ActivityLog');
const logger = require('../config/logger');

class ActivityLogService {
  /**
   * Log an activity
   * @param {Object} params
   * @param {number} params.userId - User ID who performed the action
   * @param {string} params.userRole - User role at the time of action
   * @param {string} params.actionType - create, update, delete, status_change, etc.
   * @param {string} params.entityType - user, lot, product, application, discrepancy
   * @param {number} params.entityId - ID of the entity
   * @param {Object} [params.oldData] - Data before change
   * @param {Object} [params.newData] - Data after change
   * @param {string} [params.description] - Human readable description
   * @param {Object} [params.metadata] - Additional metadata
   */
  async log({
    userId,
    userRole,
    actionType,
    entityType,
    entityId,
    oldData = {},
    newData = {},
    description,
    metadata = {}
  }) {
    try {
      // Mask sensitive data
      const maskedOldData = this._maskSensitiveData(oldData);
      const maskedNewData = this._maskSensitiveData(newData);

      const logId = await ActivityLog.create({
        user_id: userId,
        user_role: userRole,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        old_data: JSON.stringify(maskedOldData),
        new_data: JSON.stringify(maskedNewData),
        description,
        metadata: JSON.stringify(metadata)
      });

      return logId;
    } catch (error) {
      logger.error(`Error creating activity log: ${error.message}`);
      // We don't want to break the main flow if logging fails
      return null;
    }
  }

  /**
   * Get activity logs for an entity
   */
  async getEntityLogs(entityType, entityId) {
    return ActivityLog.findByEntity(entityType, entityId);
  }

  /**
   * Mask sensitive fields like pin_code or password
   */
  _maskSensitiveData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sensitiveFields = ['pin_code', 'password', 'token', 'pin'];
    const masked = { ...data };
    
    for (const field of sensitiveFields) {
      if (masked[field]) {
        masked[field] = '********';
      }
    }
    
    return masked;
  }
}

module.exports = new ActivityLogService();
