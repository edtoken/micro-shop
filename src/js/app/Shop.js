import _ from 'underscore';
import Events from 'extensions/Events';
import Validator from './Validator';

/**
 * common utils
 */
const UTILS = {

	findObjectIndexFromArray(arr, object){
		var matches = _.matches(object);
		for (var i in arr) {
			if (!matches(arr[i])) {
				continue;
			}
			return parseInt(i);
		}
		return false;
	},

	isProduct: (object) => {
		return object instanceof Product;
	},

	isMainProduct: (object) => {
		return object instanceof MainProduct;
	},

	isUpsellProduct: (object) => {
		return object instanceof UpsellProduct;
	},

	isCartMainProduct: (object) => {
		return UTILS.isMainProduct(object.model);
	},

	//5) UpsellProduct может добавляться только с quantity = 1
	validateCartQUANTITY: function (value) {
		if (UTILS.isUpsellProduct(this.model)) {
			if (value > 1) {
				return false;
			}
		}
		return true;
	},

	sync: (method, data, options) => {

	}
};

/**
 * global shop options
 */
const OPTIONS = {
	ajaxSync: '/sync'
};

/**
 * global shop validators
 */
const VALIDATORS = {
	PRODUCT_ID: ['integer', 'positive'],
	PRODUCT_PRICE: ['floatOrInteger', 'positive'],
	PRODUCT_STOCKITEMS: ['integer', 'positive'],
	PRODUCT_NAME: ['string'],
	AVAILABALITYSPEC_UPSELL: [UTILS.isUpsellProduct],
	AVAILABALITYSPEC_MAIN: [UTILS.isMainProduct],
	AVAILABALITYSPEC_ITEMSINCART: ['integer'],
	AVAILABALITYSPEC_TOTALCARTPRICE: ['floatOrInteger'],
	CART_QUANTITY: ['integer', 'positive', UTILS.validateCartQUANTITY]
}

/**
 * Base class
 */
class Base extends Events {

	/**
	 * get global app object
	 *
	 * @returns {*}
	 */
	getApp() {
		return window.SPAAPP0001;
	}

	/**
	 * get global shop object
	 *
	 * @returns {*}
	 */
	getShop() {
		return this.getApp().shop;
	}

	/**
	 * get global cart object
	 *
	 * @returns {*}
	 */
	getCart() {
		return this.getShop().getCart();
	}

	getLayout() {
		return this.getApp().getLayout();
	}

}

/**
 * upsell popup
 *
 */
class ShowUpsellPopup extends Base {
	showUpsellInformation(upsells) {
		let description = 'Вам стали доступны для покупки следующие товары';
		let options = {type: 'showUpsellInformation', data: upsells};
		this.getLayout().renderNotification(description, options);
	}
}

/**
 * UpsellAvailabalitySpecification
 *
 */
class UpsellAvailabalitySpecification extends Base {

	constructor(data, options) {
		super();
		this.attributes = {};
		this.validationError = null;
		this.id = _.uniqueId('upsell-');
		this.set(data, options);
	}

	/**
	 * validate attributes
	 *
	 * @param {Object} attr
	 * @param {Object} options
	 * @returns {Boolean}
	 * @private
	 */
	_validate(attr, options) {

		let validationErrors = {};
		let validators = this.validators();

		let hasNotError = _.every(validators, function (v, key) {

			if (v.indexOf('required') < 0 && !attr[key]) {
				return true;
			}

			let errors = Validator.checkErrors(attr[key], v, this);

			// errors not found - return true
			if (!errors) {
				return true;
			}

			validationErrors[key] = errors;
			return false;

		}, this);


		if (_.isEmpty(validationErrors)) {
			this.validationError = null;
		} else {
			this.validationError = validationErrors;
			this.trigger('error');
		}

		return hasNotError;
	}

	/**
	 * upsell variable validators
	 *
	 */
	validators() {
		return {
			mainProduct: VALIDATORS.AVAILABALITYSPEC_MAIN,
			upsellProduct: VALIDATORS.AVAILABALITYSPEC_UPSELL,
			itemsInCart: VALIDATORS.AVAILABALITYSPEC_ITEMSINCART,
			totalCartPrice: VALIDATORS.AVAILABALITYSPEC_TOTALCARTPRICE
		};
	}

	/**
	 * basic set upsell specification data
	 *
	 * @param {Object} data
	 * @param {Object} options
	 * @returns {*}
	 */
	set(data, options) {
		options || (options = {});
		if (!this._validate(data, options)) {
			return false;
		}
		this.attributes = data;
		return this;
	}

	// get attribute value
	get(key) {
		return this.attributes[key];
	}

	/**
	 * пофиксить
	 * проверка на то, что отдельный UpsellAvailabalitySpecification в данную секунду является возможным
	 *
	 * @returns {Boolean}
	 */
	check() {
		let cart = this.getCart();
		let mainProduct = this.get('mainProduct');
		let upsellProduct = this.get('upsellProduct');
		let cartItemMainProduct = cart.get(mainProduct.id);
		let totalPrice = cart.getTotalPrice();
		let upsellInCart = cart.itemInCart(upsellProduct.id);
		let mainInCart = cart.itemInCart(mainProduct.id);

		// если main товара нет в корзине - false
		if (!mainInCart) {
			return false;
		}

		// число конкретного товара в корзине >= this.itemsInCart
		let checkCount = (mainInCart && cartItemMainProduct.get('quantity') >= this.get('itemsInCart'));

		// сумма покупок в корзине >= this.totalCartPrice
		let checkTotalPrice = (totalPrice >= this.get('totalCartPrice'));

		if (checkCount || checkTotalPrice) {
			return true;
		}

		return false;
	}

	/**
	 * check current spec to ready
	 * 4) Корзина не должна давать возможности добавлять конкретный UpsellProduct
	 * до момента пока корзина не соответствует условиям соответствующего UpsellAvailabalitySpecification
	 *
	 */
	checkAdd() {

		let cart = this.getCart();
		let mainProduct = this.get('mainProduct');
		let upsellProduct = this.get('upsellProduct');
		let cartItemMainProduct = cart.get(mainProduct.id);
		let cartItemUpsellProduct = cart.get(upsellProduct.id);
		let totalPrice = cart.getTotalPrice();
		let upsellInCart = cart.itemInCart(upsellProduct.id);
		let mainInCart = cart.itemInCart(mainProduct.id);

		// если upsell уже в корзине
		// что-то тут не так
		if (upsellInCart) {
			return false;
		}

		// если main товара нет в корзине - false
		if (!mainInCart) {
			return false;
		}

		// число конкретного товара в корзине >= this.itemsInCart
		let checkCount = (mainInCart && cartItemMainProduct.get('quantity') >= this.get('itemsInCart'));

		// сумма покупок в корзине >= this.totalCartPrice
		let checkTotalPrice = (totalPrice >= this.get('totalCartPrice'));

		if (checkCount || checkTotalPrice) {
			return true;
		}

		return false;
	}

	/**
	 * check model is valid?
	 *
	 * @returns {Boolean}
	 */
	isValid() {
		return this._validate(this.attributes, {});
	}

	toJSON() {
		return _.clone(this.attributes);
	}
}

/**
 * Product class
 */
class Product extends Base {

	constructor(attrs, options) {
		super();

		options || (options = {});

		this.id = null;
		this.attributes = {};
		this._attributes = {};
		this.validationError = null;
		this.idAttribute = 'id';

		let attr = _.extend({}, this.defaults(), attrs);

		this.set(attr, options);
		this.trigger('initialize');
		return this;
	}

	/**
	 * default model attributes
	 *
	 * @returns {{}}
	 */
	defaults() {
		return {
			id: null,
			price: null,
			stockItems: null,
			_stockItems: null,
			name: null
		};
	}

	/**
	 * model attributes validators
	 *
	 * @returns {{}}
	 */
	validators() {
		return {
			id: VALIDATORS.PRODUCT_ID,
			price: VALIDATORS.PRODUCT_PRICE,
			stockItems: VALIDATORS.PRODUCT_STOCKITEMS,
			name: VALIDATORS.PRODUCT_NAME
		};
	}

	/**
	 * validate attributes
	 *
	 * @param {Object} attr
	 * @param {Object} options
	 * @returns {Boolean}
	 * @private
	 */
	_validate(attr, options) {

		let validationErrors = {};
		let validators = this.validators();

		let hasNotError = _.every(validators, function (v, key) {

			if (v.indexOf('required') < 0 && !attr[key]) {
				return true;
			}

			let errors = Validator.checkErrors(attr[key], v, this);

			// errors not found - return true
			if (!errors) {
				return true;
			}

			validationErrors[key] = errors;
			return false;

		}, this);

		if (_.isEmpty(validationErrors)) {
			this.validationError = null;
		} else {
			this.validationError = validationErrors;
			this.trigger('error');
		}

		return hasNotError;
	}

	set(key, val, options) {
		if (!key) {
			return false;
		}

		let attrs;

		// Handle both `"key", value` and `{key: value}` -style arguments.
		if (typeof key === 'object') {
			attrs = key;
			options = val;
		} else {
			(attrs = {})[key] = val;
		}
		options || (options = {});

		// Run validation.
		if (!this._validate(attrs, options)) {
			return false;
		}

		var unset = options.unset;
		var current = this.attributes;
		this._attributes = _.clone(current);

		for (var attr in attrs) {
			unset ? delete current[attr] : current[attr] = attrs[attr];
		}

		this.id = current[this.idAttribute];

		this.trigger('change');
		return this;
	}

	/**
	 * get model attribute
	 *
	 * @param {String} name
	 * @returns {*}
	 */
	get(name) {
		return this.attributes[name];
	}

	/**
	 * get productType
	 *
	 * @returns {*}
	 */
	getType() {
		return UTILS.isMainProduct(this) ? 'main'
			: UTILS.isUpsellProduct(this) ? 'upsell' : false;
	}

	/**
	 * item in cart?
	 * todo need perf
	 *
	 * @returns {Boolean}
	 */
	inCart() {
		return (this.getCart().itemInCart(this.id));
	}

	/**
	 * check model is valid?
	 *
	 * @returns {Boolean}
	 */
	isValid() {
		return this._validate(this.attributes, {});
	}

	/**
	 * remove product from cart
	 * @returns {*}
	 */
	removeFromCart() {
		return this.getCart().remove(this.id);
	}

	/**
	 * synchronize product with server
	 */
	sync() {

	}

	toJSON() {
		return _.clone(this.attributes);
	}
}

/**
 * MainProduct class
 */
export class MainProduct extends Product {
	constructor(data, options) {
		super(data, options);
		this.upsellSpecification = {};
	}

	/**
	 * add upsell specification to main product
	 *
	 * @param {UpsellProduct} product
	 * @param {Object} options
	 * @returns {*}
	 */
	addSpecification(product, options) {

		if (!UTILS.isUpsellProduct(product)) {
			return false;
		}
		if (!Validator.validate(product.id, VALIDATORS.PRODUCT_ID)) {
			return false;
		}

		this.upsellSpecification[product.id] = product;
		this.trigger('addSpecification', this.upsellSpecification[product.id]);
		return this;
	}

	/**
	 * remove upsell specification from main product
	 *
	 * @param {UpsellProduct} product
	 * @param {Object} options
	 * @returns {*}
	 */
	removeSpecification(product, options) {

		if (!UTILS.isUpsellProduct(product)) {
			return false;
		}
		if (!Validator.validate(product.id, VALIDATORS.PRODUCT_ID)) {
			return false;
		}
		if (!this.upsellSpecification[product.id]) {
			return false;
		}

		delete this.upsellSpecification[product.id];
		this.trigger('removeSpecification', product);
		return this;
	}

	/**
	 * return all upsellProducts
	 * with upsellSpecification is done
	 *
	 */
	getActiveUpsells() {
		let upsells = this.upsellSpecification;
		let activeUpsells = _.compact(_.map(upsells, upsell => (upsell.checkSpecification(this))));
		return (activeUpsells && activeUpsells.length) ? activeUpsells : false;
	}
}

/**
 * UpsellProduct class
 */
export class UpsellProduct extends Product {
	//upsellSpecifications: [UpsellAvailabalitySpecification]

	constructor(data, options) {
		super(data, options);
		this.upsellSpecifications = [];
	}

	/**
	 * get upsellSpecification
	 *
	 * @param {MainProduct} mainProduct
	 * @param {UpsellProduct} upsellProduct
	 * @param {Object} specificationData
	 * @returns {UpsellAvailabalitySpecification}
	 */
	getSpecification(mainProduct, upsellProduct) {
		var match = _.matches({mainProduct: mainProduct, upsellProduct: upsellProduct});
		return _.find(this.upsellSpecifications, item => (match(item.toJSON())));
	}

	/**
	 * get all upsell specifications
	 *
	 * @returns {Array.<T>}
	 */
	getSpecifications() {
		return this.upsellSpecifications.slice(0);
	}

	getSpecificationsByMainProduct(mainProduct) {
		let specs = this.upsellSpecifications;
		return _.filter(specs, item => (item.attributes.mainProduct.id === mainProduct.id));
	}

	/**
	 * add upsellSpecification
	 *
	 * @param {MainProduct} mainProduct
	 * @param {UpsellProduct} upsellProduct
	 * @param {Object} specificationData
	 * @param {Object} options
	 * @returns {Boolean}
	 */
	addSpecification(mainProduct, upsellProduct, specificationData, options) {
		if (UTILS.isMainProduct(mainProduct) && UTILS.isUpsellProduct(upsellProduct)) {
			if (!this.getSpecification(mainProduct, upsellProduct, specificationData)) {

				let specData = _.extend({}, {
					mainProduct: mainProduct,
					upsellProduct: upsellProduct
				}, specificationData);

				let spec = new UpsellAvailabalitySpecification(specData);

				if (spec.isValid()) {
					this.upsellSpecifications.push(spec);
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * remove upsell specification
	 */
	removeSpecification() {
	}

	/**
	 * check specifications (can add to cart)
	 *
	 */
	checkSpecifications() {
		let specList = this.upsellSpecifications.slice(0);
		let activeSpec = _.compact(_.filter(specList, item => item.checkAdd()));
		return (activeSpec && activeSpec.length) ? activeSpec : false;
	}

	checkSpecification(mainProduct) {
		let specList = this.getSpecificationsByMainProduct(mainProduct);
		return _.find(specList, item => (item.check()));
	}

}

/**
 * Один элемент корзины
 */
class CartItem extends Base {
	/**
	 * @param {Product} product
	 * @param {Object} data product options (quantity)
	 * @param {Object} options
	 */
	constructor(product, data, options) {
		super();
		options || (options = {});

		if (!UTILS.isProduct(product)) {
			throw 'invalid product';
		}

		this.attributes = {};
		this.validationError = null;
		this.model = product;
		this.id = this.model.id;
		let attrs = _.extend({}, this.defaults(), data);
		this.set(attrs, options);
	}

	/**
	 * default cart item attributes
	 *
	 * @returns {{quantity: Number}}
	 */
	defaults() {
		return {
			quantity: 1
		};
	}

	/**
	 * cart options validators
	 *
	 * @returns {{}}
	 */
	validators() {
		return {
			quantity: VALIDATORS.CART_QUANTITY
		};
	}

	/**
	 * validate attributes
	 *
	 * @param {Object} attr
	 * @param {Object} options
	 * @returns {Boolean}
	 * @private
	 */
	_validate(attr, options) {

		options || (options = {});
		let validationErrors = {};
		let validators = this.validators();

		let hasNotError = _.every(validators, function (v, key) {

			if (v.indexOf('required') < 0 && !attr[key]) {
				return true;
			}

			let errors = Validator.checkErrors(attr[key], v, this);

			// errors not found - return true
			if (!errors) {
				return true;
			}

			validationErrors[key] = errors;
			return false;

		}, this);

		// невозможно добавить столько в корзину
		// лучше бы перенести эту валидацию в validators
		if (attr.quantity && this.model.get('_stockItems') - attr.quantity < 0) {
			validationErrors['stockItemsError'] = true;
			hasNotError = false;
		}

		// еслим хотя бы одно upsellSpecification сработает - я могу добавить продукт
		if (UTILS.isUpsellProduct(this.model)) {
			if (!this.model.checkSpecifications()) {
				validationErrors['upsellSpecificationError'] = true;
				hasNotError = false;
			}
		}

		if (!options.notReplaceErrors) {
			if (_.isEmpty(validationErrors)) {
				this.validationError = null;
			} else {
				this.validationError = validationErrors;
				this.trigger('error');
			}
		}

		return hasNotError;
	}

	/**
	 * basic set cart item data
	 *
	 * @param {Object} data
	 * @param {Object} options
	 * @returns {*}
	 */
	set(data, options) {
		options || (options = {});
		if (!this._validate(data, options)) {
			return false;
		}

		// изменяю количество товаров на складе
		let modelStockItems = this.model.get('stockItems');
		let newStockItems = modelStockItems - data.quantity;
		this.model.set('_stockItems', newStockItems);

		this.attributes = data;
		return this;
	}

	/**
	 * check item is valid?
	 *
	 * @returns {Boolean}
	 */
	isValid() {
		return (this.validationError === null);
	}

	get(name) {
		return this.attributes[name];
	}

	/**
	 * validate will attributes
	 *
	 * @param {Object} attr
	 * @param {Object} options
	 */
	validate(attrs, options) {
		var attr = _.extend({}, this.toJSON(), attrs);
		return this._validate(attr, {notReplaceErrors: true});
	}

	/**
	 * clear item from cart
	 * need restore values
	 *
	 */
	removeFromCart() {

		let cart = this.getCart();
		let index = UTILS.findObjectIndexFromArray(cart.where(), {id: this.id});
		let modelStockItems = this.model.get('_stockItems');
		let quantity = this.get('quantity');
		let newStockItems;

		if (quantity) {
			newStockItems = modelStockItems + this.get('quantity');
		}

		if (newStockItems) {
			this.model.set('_stockItems', newStockItems);
		}

		if (index !== false) {
			cart.models.splice(index, 1);
			delete cart.byId[this.id];
			cart.trigger('remove', this);
		}

	}

	toJSON() {
		return _.clone(this.attributes);
	}
}

/**
 * Cart class
 */
class Cart extends Base {

	constructor() {
		super();
		this._reset();
		this.on('add', this.handlerCartCheckSpecifications, this);
		this.on('change', this.handlerCartCheckSpecifications, this);
		this.on('remove', this.handlerCartCheckSpecifications, this);
	}

	/**
	 * reset shop
	 *
	 * @private
	 */
	_reset() {
		this.byId = {};
		this.models = [];
		this.activUpsells = [];
	}

	/**
	 * clear cart
	 *
	 */
	clear() {
		_.each(this.where(), item => (item.removeFromCart()));
		this._reset();
		this.trigger('clear');
		return this;
	}

	/**
	 * where items from models
	 *
	 * @param {Array} models
	 * @param {Object} attrs
	 * @param {Boolean} first
	 * @param {Object} options ({validators:[]}) для проверки особых правил выборки
	 * @returns {*}
	 * @private
	 */
	_where(models, attrs, first, options) {

		options || (options = {});

		let method = first ? _.find : _.filter;


		if (!attrs || _.isEmpty(attrs)) {

			return options.validators ?
				method(models, (item => (Validator.validate(item, options.validators, item))))
				: models.slice(0);
		}

		// CartItem.Product.attributes
		let matches = _.matches({model: {attributes: attrs}});

		return options.validators ?
			method(models, item => (Validator.validate(item, options.validators, item) && matches(item)))
			: method(models, matches);
	}

	/**
	 * find first model by attributes
	 *
	 * @param {Array} models
	 * @param {Object} attrs
	 * @returns {*}
	 * @private
	 */
	_findWhere(models, attrs, options) {
		return this._where(models, attrs, true, options);
	}

	where(attrs, first, options) {
		return this._where(this.models, attrs, first, options);
	}

	findWhere(attrs, options) {
		return this._findWhere(this.models, attrs, options);
	}

	/**
	 * add item to cart
	 *
	 * @param {UpsellProduct|MainProduct} model
	 * @param {Object} data
	 * @param {Object} options
	 */
	add(model, data, options) {

		if (!model) {
			return false;
		}

		if (!model.get('_stockItems')) {
			alert('ошибка 1 ');
			return false;
		}

		let cartItem = this.get(model);

		if (!cartItem) {
			cartItem = new CartItem(model, data, options);
			if (!cartItem.isValid()) {
				// sonsructor изменяет атрибуты модели
				// пофиксить это
				cartItem.removeFromCart();
				alert('Ошибка 2');
				return false;
			}

			this.models.push(cartItem);
			this.byId[cartItem.id] = cartItem;
			cartItem.model.trigger('addToCart');
			this.trigger('add', cartItem);
			return this;
		}

		if (!cartItem.validate(data)) {
			alert('Ошибка 3');
			return false;
		}

		cartItem.set(data);
		this.byId[cartItem.id] = cartItem;
		cartItem.model.trigger('changeFromCart');
		this.trigger('change', cartItem);
		this.trigger('add', cartItem);
		return this;
	}

	/**
	 * add item to cart with quantity
	 * 1) Метод добавления продукта в корзину с указанием quantity.
	 *
	 * @param {UpsellProduct|MainProduct} model
	 * @param {Number} quantity
	 * @param {Object} options
	 */
	addWithQuantity(model, quantity, options) {
		return this.add(model, {quantity: quantity}, options);
	}

	/**
	 * 2) Метод удаления продукта
	 *
	 * @param {Product} product
	 * @returns {*}
	 */
	remove(product) {
		let id = product;
		if (product instanceof Product) {
			id = product.id;
		}

		if (Validator.validate(id, VALIDATORS.PRODUCT_ID)) {
			if (this.itemInCart(id)) {
				return this.get(id).removeFromCart();
			}
			return true;
		}

		throw 'invalid product id [' + id + ']';
	}

	/**
	 * change cart item options
	 *
	 * @param {Product} model
	 * @param {Object} data
	 * @param {Object} options
	 */
	change(model, data, options) {
		return this.add(model, data, options);
	}

	/**
	 * change cart item quantity
	 * 3) Метод изменения quantity продукта.
	 *
	 * @param {Product} model
	 * @param {Number} quantity
	 * @param {Object} options
	 * @returns {*}
	 */
	changeQuantity(model, quantity, options){
		return this.change(model, {quantity: quantity}, options);
	}

	/**
	 * get product by id
	 *
	 * @param {Number|MainProduct|UpsellProduct} product
	 * @returns {MainProduct|UpsellProduct}
	 */
	get(product) {

		let id = product;
		if (product instanceof Product) {
			id = product.id;
		}

		if (Validator.validate(id, VALIDATORS.PRODUCT_ID)) {
			return this.byId[id];
		}

		throw 'invalid product id [' + id + ']';
	}

	/**
	 * get total cart price
	 *
	 */
	getTotalPrice() {
		return _.reduce(this.where(), (memo, item) => (memo + item.model.get('price') * item.attributes.quantity), 0);
	}

	/**
	 * get count items in cart
	 */
	getItemsInCart() {
		return _.reduce(this.where(), (memo, item) => (memo + item.attributes.quantity), 0);
	}

	/**
	 * check if item in cart
	 *
	 * @param {Product} product
	 */
	itemInCart(product) {
		return (this.get(product) !== undefined);
	}

	/**
	 * check all upsells
	 *
	 */
	handlerCartCheckSpecifications() {
		let cartItems = this.where(false, false, {validators: [UTILS.isCartMainProduct]});
		let activeUpsellSpecificationsGroups = _.compact(_.map(cartItems, cartItem => (cartItem.model.getActiveUpsells())));
		let activeUpsellSpecifications = _.compact(_.reduce(activeUpsellSpecificationsGroups, (memo, items) => (memo.concat(items)), []));
		let activeUpsellSpecificationsIds = _.pluck(activeUpsellSpecifications, 'id');

		let currentActivUpsells = this.activUpsells.slice(0);

		if (currentActivUpsells.length) {
			for (var i = 0; i < currentActivUpsells.length; i++) {

				if (activeUpsellSpecificationsIds.indexOf(currentActivUpsells[i].id) >= 0) {
					continue;
				}
				// если upsell продукт более не может находится в корзине (например удален main)
				if (!currentActivUpsells[i].check()) {
					currentActivUpsells[i].get('upsellProduct').removeFromCart()
				}
				currentActivUpsells[i].get('upsellProduct').trigger('canNotBuy');
			}
		}

		this.activUpsells = activeUpsellSpecifications;
		_.each(this.activUpsells, item => (item.get('upsellProduct').trigger('canBuy')));

		//6) При достижении Cart требований одного из UpsellAvailabalitySpecification,
		// должен срабатывать триггер и вызываться подписчик ShowUpsellPopup.showUpsellInformation(upsell), но только
		//если upsell еще не добавлен в Cart
		if (this.activUpsells.length) {
			this.trigger('changeUpsellInformation');
			this.trigger('showUpsellInformation');
		}
	}

	/**
	 * synchronize cart with server
	 */
	sync() {

	}
}

/**
 * Shop class
 */
export default class Shop extends Base {

	constructor(data, options) {
		super();
		this._reset();
		this.cart = new Cart();

		this.showUpsellPopup = new ShowUpsellPopup();
		this.reset(data.items, options);

		this.listenTo(this.cart, 'showUpsellInformation', this.showUpsellInformation);
	}

	showUpsellInformation() {
		this.getShop().showUpsellPopup.showUpsellInformation(this.getCart().activUpsells);
	}

	/**
	 * reset shop
	 *
	 * @private
	 */
	_reset() {
		this.byId = {};
		this.models = [];
	}

	/**
	 * reset all items
	 *
	 * @param {Array} models
	 * @param {Object} options
	 * @returns {Array}
	 */
	reset(models, options) {
		this._reset();
		let opt = _.extend({}, options, {silent: true});
		_.each(models, model => (this.add(model, opt)));
		this.trigger('reset');
		return this.models;
	}

	/**
	 * add product item to shop
	 *
	 * @param {MainProduct|UpsellProduct} model
	 * @param {Object} options
	 */
	add(model, options) {
		options = options || {};

		let silent = options.silent;
		let currentModel = this.get(model.id);

		if (!currentModel) {
			this.byId[model.id] = model;
			this.models.push(model);
		} else {
			currentModel.set(model.attributes, options);
		}

		if (!silent) {
			this.trigger('add', this.byId[model.id]);
		}
	}

	/**
	 * remove product from shop
	 * if product removed from shop -> need remove from cart
	 *
	 * @param {Number} id
	 * @param {Object} options
	 */
	remove(id, options) {
	}

	/**
	 * get product by id
	 *
	 * @param {Number|MainProduct|UpsellProduct} product
	 * @param {Object} options
	 * @returns {MainProduct|UpsellProduct}
	 */
	get(product, options) {

		let id = product;
		if (product instanceof Product) {
			id = product.id;
		}

		if (Validator.validate(id, VALIDATORS.PRODUCT_ID)) {
			return this.byId[id];
		}

		throw 'invalid product id [' + id + ']';
	}

	/**
	 * get shop cart
	 *
	 * @returns {*}
	 */
	getCart() {
		return this.cart;
	}

	where(attrs, first) {

		if (!attrs || _.isEmpty(attrs)) {
			return this.models.slice(0);
		}

		var matches = _.matches({attributes: attrs});
		return first ? _.first(this.models, matches) : _.filter(this.models, matches);
	}

	findWhere(attrs) {
		return this.where(attrs, true);
	}

	/**
	 * synchronize shop products with server
	 */
	sync() {

	}
}
