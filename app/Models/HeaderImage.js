'use strict'

const Model = use('Model')

class HeaderImage extends Model {
    
    
	/**
	 * Override table name
	 */
	static get table () {
		return 'header_images';
	}
}

module.exports = HeaderImage
