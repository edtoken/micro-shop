/**
 * VALIDATOR
 *
 *
 *
 */

import _ from 'underscore';

/**
 * validator messages
 *
 * @type {{key:String}}
 */
const MESSAGES = {
	notBool: 'value is not bool',
	required: 'value is required',
	notInteger: 'value is not integer',
	notFloat: 'value is not float',
	notString: 'value is not string',
	notPositive: 'value is not positive number'
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
 * valus is not boole
 * return false if check done
 *
 * @param value
 * @returns {(false|{msg:String})}
 */
Validator.validators.boolean = (value) => {
	return (typeof value === 'boolean') ? false : {msg: MESSAGES.notBool};
};

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
 * value is not positive number
 * return false if check done
 *
 * @param value
 * @returns {*}
 */
Validator.validators.positive = (value) => {
	return (typeof value === 'number' && value > 0) ? false : {msg: MESSAGES.notPositive}
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
 * value is integer or float
 *
 * @param value
 * @returns {(false|{msg:String})}
 */
Validator.validators.floatOrInteger = (value) => {
	let integer = Validator.checkError(value, 'integer');
	let float = Validator.checkError(value, 'float');

	if (!integer || !float) {
		return false;
	}

	return integer ? integer : float;
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
 * check value by validator
 *
 * @param {String} value
 * @param {String|Function} validator (string name or validate function)
 * @returns {(false|{error})}
 */
Validator.checkError = (value, validator, context) => {

	let ctx = context || this;
	// custom validator
	if (_.isFunction(validator)) {
		return !validator.call(ctx, value);
	}

	if (!Validator.validators[validator]) {
		throw 'validator [' + validator + '] not found';
	}
	return Validator.validators[validator].call(ctx, value);
};

/**
 * function check validators list
 *
 * @param {*} value
 * @param {Array} validatorsList
 * @returns {false|{Array}}
 */
Validator.checkErrors = (value, validatorsList, context) => {
	var errors = _.compact(_.map(validatorsList.slice(0), function (validator) {
		return Validator.checkError(value, validator, context);
	}));
	return errors.length ? errors : false;
};

/**
 * simply validate
 *
 * @param {*} value
 * @param {String} validator
 * @returns {Boolean}
 */
Validator.validate = (value, validator, context) => {
	let checkMethod = _.isArray(validator)
		? Validator.checkErrors
		: Validator.checkError;

	return (checkMethod(value, validator, context) === false);
};

module.exports = Validator