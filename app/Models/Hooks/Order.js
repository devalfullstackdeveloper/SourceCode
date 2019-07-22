'use strict'

const OrderHook = module.exports = {}

/**
 * Hash using password as a hook.
 *
 * @method
 *
 * @param  {Object} userInstance
 *
 * @return {void}
 */
OrderHook.createdAt = async (orderInstance) => {
    orderInstance.created_at = new Date()
}
