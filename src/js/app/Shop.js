import _ from 'underscore';
import Events from 'extensions/Events';
import Validator from './Validator';

const UPSELL_ADD_COUNT = 1;

var UTILS = {

	getObjectIndexFromArray: (arr, object) => {
		var matches = _.matches(object);
		for (var i = 0; i < arr.length; i++) {
			if (!matches(arr[i])) continue;
			return i;
		}
		return false;
	}
};

/**
 * BaseClass
 *
 */
class Base extends Events {

	/**
	 * get global App obj
	 *
	 * @returns {Object}
	 */
	getApp() {
		return window.SPAAPP0001;
	}

	getShop() {
		return this.getApp().shop;
	}

	getCart() {
		return this.getShop().getCart();
	}
}

class ShowUpsellPopup extends Base {

	showUpsellInformation(upsell) {
		alert('upsell:' + JSON.stringify(upsell));
	}
}

class CartItem extends Base {
	constructor(model, data, options) {
		super();
		this.model = model;
		this.data = data;
		this.options = options;
		this.id = this.model.id;
	}
}
//export class UpsellSpecification extends Base {
//
//}

export class UpsellAvailabalitySpecification extends Base {

	//upsellProduct: UpsellProduct,
	//mainProduct: MainProduct
	//itemsInCart: integer, //items in cart of the mainProduct after upsell become available to be added in this cart
	//totalCartPrice: float //total cart amount of all product after upsell become available to be added in cart

	constructor(mainProduct, upsellProduct, options) {
		super();
		this.mainProduct = mainProduct;
		this.upsellProduct = upsellProduct;
		this.itemsInCart = options.itemsInCart;
		this.totalCartPrice = options.totalCartPrice;
	}
}

/**
 * Product class
 *
 */
class Product extends Base {
	//id: integer,
	//price: float,
	//stockItems: integer,
	//name: string

	constructor(data, options) {
		super();

		var attrs = data || {};
		options || (options = {});

		this.id = null;
		this.attributes = {};
		this._attributes = {};
		this.validationError = null;
		this.idAttribute = 'id';
		this.inCart = options.inCart || false;

		attrs = _.extend({}, this.defaults(), data);
		this.set(attrs, options);
		this.initialize(data, options);
		this.trigger('initialize');
		return this;
	}

	validators() {
		return {}
	}

	defaults() {
		return {};
	}

	initialize() {
	}

	_validate() {
		return true;
	}

	validate() {

	}

	isMainProduct() {
		return (this instanceof MainProduct);
	}

	addToCart(quantity, options) {
		var add = this.getCart().addWidthQuantity(this, quantity, options);
		if (add) {
			this.trigger('addToCart');
		}
	}

	removeFromCart(quantity, options) {
		var remove = this.getCart().remove(this.id, quantity, options);
		if (remove) {
			this.trigger('removeFromCart');
		}
	}

	changeQuantity(quantity, options) {
		var change = this.getCart().changeQuantity(this.id, quantity, options);
		if (change) {
			this.trigger('changeQuantity');
		}
	}

	set(key, val, options) {

		if (!key) {
			return false;
		}

		var attrs;

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

	get(key) {
		return this.attributes[key];
	}

	getCartProduct() {
		return this.getCart().find({id: this.id}, true);
	}

	toJSON() {
		return _.clone(this.attributes);
	}
}

/**
 * MainProduct class
 * Основной продукт, который продается самостоятельно (или вместе с upsell)
 */
export class MainProduct extends Product {
	//upsellSpecification:{},
	constructor(data, options) {
		super(data, options);

		// массив ID upsellProducts
		this.upsellSpecification = {};
		return this;
	}

	addUpsellSpecification(upsellProduct) {
		if (!this.upsellSpecification[upsellProduct.id]) {
			this.upsellSpecification[upsellProduct.id] = upsellProduct;
		}
	}
}

/**
 * UpsellProduct class
 * Продукт который продается вместе с main (+условия)
 */
export class UpsellProduct extends Product {
	//upsellSpecifications: [UpsellAvailabalitySpecification]

	constructor(data, options) {
		super(data, options);
		this.upsellSpecifications = [];
		return this;
	}

	addSpecification(mainProduct, upsellProduct, options) {
		if (!this.getSpecification(mainProduct.id, upsellProduct.id)) {
			var specification = new UpsellAvailabalitySpecification(mainProduct, upsellProduct, options);
			this.upsellSpecifications.push(specification);
		}
	}

	getSpecification(mainProductId, upsellProductId) {
		return _.find(this.upsellSpecifications,
				item => (item.mainProduct.id === mainProductId && item.upsellProduct.id === upsellProductId)
		);
	}

	getSpecifications() {
		return this.upsellSpecifications;
	}

	removeSpecification() {
	}

	//4) Корзина не должна давать возможности добавлять конкретный UpsellProduct
	// до момента пока корзина не соответствует условиям
	// соответствующего UpsellAvailabalitySpecification
	checkSpecifications() {

		var specifications = this.getSpecifications();
		var cart = this.getCart();
		var totalPrice = cart.getTotalPrice();

		return _.every(specifications, function (spec) {
			let mainProduct = cart.find({id: spec.mainProduct.id});
			if (!mainProduct) return false;
			if (totalPrice < spec.totalCartPrice) return false;
			if (!mainProduct.count < spec.itemsInCart) return false;
			return true;
		});
	}
}

class Cart extends Base {

	constructor() {
		super();
		this.items = [];
		this.byId = {};
	}

	find(attrs, first) {
		var attr = attrs || {};
		var find = first ? _.find : _.filter;
		var match = _.matches(attr);
		return find(this.items, item => (match(item.model.attributes)));
	}

	getTotalPrice() {
		return _.reduce(this.find(), (memo, item) => (memo + item.model.get('price') * item.data.quantity), 0) || 0;
	}

	_validateChangeProduct(product, data) {

		if (_.isEmpty(data)) {
			return false;
		}

		for (var n in data) {
			switch (n) {
				case 'quantity':
					if (Validator.checkErrors(data[n], ['required', 'integer', 'positive'])) {
						return false;
						break;
					}
			}
		}

		// valid true
		return true;
	}

	_validateAddProduct(product, data) {

		if (!data.quantity) {
			alert('Не указан quantity');
			return false;
		}

		if (product instanceof UpsellProduct) {
			//5) UpsellProduct может добавляться только с quantity = 1
			if (data.quantity !== UPSELL_ADD_COUNT) {
				alert('upsell product может добавляться только с quantity = ' + UPSELL_ADD_COUNT);
				return false;
			}
			if (!product.checkSpecifications()) {
				alert('недопустимые upsellSpecifications');
				return false;
			}
		}

		return true;
	}

	add(product, data, options) {
		if (!product) return false;

		data = data || {};
		options = data || {};

		var cartItem = this.find({id: product.id}, true);

		if (this._validateAddProduct(product, data)) {

			if (!cartItem) {
				cartItem = new CartItem(product, data, options);
				cartItem.model.inCart = true;
				this.items.push(cartItem);
			} else {
				cartItem.data.quantity += data.quantity;
			}

			alert('Продукт добавлен');
			this.trigger('add', cartItem);
			return true;
		}

		return false;
	}

	//3) Метод изменения quantity продукта.
	changeQuantity(productId, quantity, options) {

		let product = this.find({id: productId}, true);

		if (product) {
			if (this._validateChangeProduct(product, {quantity: quantity})) {
				if (product.data.quantity >= quantity) {
					return this.remove(productId, quantity, options);
				} else {
					product.options.quantity = quantity;
				}
				this.trigger('change');
				return true;
			}

			alert('Ошибка валидации')
			return false;
		}

		alert('Продукт не найден')
		return false;
	}

	//1) Метод добавления продукта в корзину с указанием quantity.
	addWidthQuantity(product, quantity, options) {
		return this.add(product, {quantity: quantity}, options)
	}

	//2) Метод удаления продукта
	remove(id, quantity, options) {
		var product = this.find({id: id}, true);
		quantity = quantity || 'all';

		if (quantity > product.data.quantity) {
			quantity = 'all';
		}

		if (product) {
			// todo:optimize
			let index = UTILS.getObjectIndexFromArray(this.find(), {id: id});

			// удаление продукта
			// если удаляется полностью
			// надо так же установить inCart
			let item = (quantity == 'all' || product.data.quantity === quantity)
				? ((product.model.inCart = false), this.items.splice(index, 1)[0])
				: (product.data.quantity -= quantity, quantity);

			this.trigger('remove', item);
			return true;
		}

		return false;
	}

	sync() {

	}
}

export default class Shop extends Base {

	constructor(data) {
		super();
		// all shop products
		this.items = data.items;
		this.cart = new Cart();
	}

	getCart() {
		return this.cart;
	}

	find(attrs, first) {
		var attr = attrs || {};
		var find = first ? _.find : _.filter;
		var match = _.matches(attr);
		return find(this.items, item => (match(item.attributes)));
	}

	getMainProducts() {
		return _.filter(this.find(), item => (item instanceof MainProduct));
	}

	sync() {

	}
}