/**
 * VALIDATOR
 *
 *
 *
 */

/**
 * validator messages
 *
 * @type {{key:String}}
 */
const MESSAGES = {
	required: 'value is required',
	notInteger: 'value is not integer',
	notFloat: 'value is not float',
	notString: 'value is not string'
};

/**
 * class Validator
 */
class Validator {
}

/**
 * Validators list
 *
 * @type {{}}
 */
Validator.validators = {};

/**
 * value is not integer
 * return false if check done
 *
 * @param value
 * @returns {(false|{msg:String})}
 */
Validator.validators.integer = (value) => {
	return (typeof value === 'number' && value % 1 === 0) ? false : {msg: MESSAGES.notInteger};
};

/**
 * value is not float
 * return false if check done
 *
 * @param value
 * @returns {(false|{msg:String})}
 */
Validator.validators.float = (value) => {
	return (typeof value === 'number' && value % 1 !== 0) ? false : {msg: MESSAGES.notFloat};
};

/**
 * value is not string
 * return false if check done
 *
 * @param value
 * @returns {(false|{msg:String})}
 */
Validator.validators.string = (value) => {
	return (typeof value === 'string') ? false : {msg: MESSAGES.notString};
};

/**
 * value is empty
 * return false if check done
 *
 * @param value
 * @returns {(false|{msg:String})}
 */
Validator.validators.required = (value) => {
	return (value !== undefined && value !== '' && value !== null) ? false : {msg: MESSAGES.required};
};

/**
 * function check
 * check value by ValidatorName
 *
 * @param {String} value
 * @param {String} validatorName
 * @returns {(false|{error})}
 */
Validator.check = function(value, validatorName) {
	if (!Validator.validators[validatorName]) {
		throw 'validator [' + validatorName + '] not found';
	}
	return Validator.validators[validatorName](value);
};

module.exports = Validator