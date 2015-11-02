import _ from 'underscore';
import App from 'app/App';
import {
	MainProduct,
	UpsellProduct,
	UpsellSpecification,
	UpsellAvailabalitySpecification
} from './app/Shop';

if (__DEVELOPMENT__) {
	(function () {
		var node = document.getElementsByTagName('head').item(0) || document.documentElement;
		var tag = document.createElement('script');
		tag.src = '//localhost:' + __LIVERELOAD_PORT__ + '/livereload.js';
		node.appendChild(tag);
	})();
}

/**
 * core dom app element
 *
 * @type {Element|*}
 */
const node = document.getElementById('App');

// количество автосгенерированных продуктов (main)
const MAIN_PRODUCTS_COUNT = 5000;

// возможные mainProducts
const mainProductsNames = [
	'Кеды',
	'Кроссовки',
	'Футболка',
	'Свитшот',
	'Джинсы',
	'Леггинсы',
	'Шорты',
	'Платье',
	'Сумка',
	'Свитер',
	'Пайта',
	'Майка',
	'Кардиган'
];

// upsell продукты, доступные после покупки main (вместе)
const upsellProductsNames = [
	'Шетка для чистки',
	'Средство для стирки',
	'Стельки',
	'Спрей для обуви',
	'Краска',
	'Шнурки',
	'Липучки',
	'Наклейки',
	'Крутая пацанская кепка',
	'Стиральная машина'
];

// create shop items
const ITEMS = [];

var s = new Date();
(function () {

	/**
	 * Сгенерировать рандомное число
	 *
	 * @param {Number} min
	 * @param {Number} max
	 * @returns {Number}
	 */
	function getRandom(min, max) {
		return Math.round(min + Math.random() * (max - min));
	}

	/**
	 * Найти продукт по id в ITEMS
	 *
	 * @param {Number} id
	 * @returns {Object}
	 */
	function getItemById(id) {
		return _.find(ITEMS, item => (item.id === id));
	}

	/**
	 * Создаст базовые данные для любого продукта с id
	 *
	 * @param {Number} id
	 * @returns {{id: Number, price: Number, stockItems: Number}}
	 */
	function genProductData(id) {
		return {
			id: parseInt(id),
			price: +(getRandom(100, 1000) + Math.random()).toFixed(2),
			stockItems: getRandom(1, 100)
		}
	}

	/**
	 * Сгенерирует mainProductData
	 *
	 * @param {Nunber} id
	 * @returns {{id, price, stockItems}|{id: Number, price: Number, stockItems: Number}}
	 */
	function genMainProductData(id) {
		return genProductData(id);
	}

	/**
	 * сгенерирует upsellProduct data
	 *
	 * @param {Number} id
	 * @returns {{id, price, stockItems}|{id: Number, price: Number, stockItems: Number}}
	 */
	function genUpsellProductData(id) {
		return genProductData(id);
	}

	let count = MAIN_PRODUCTS_COUNT;

	while (count > 0) {
		// basic main product data
		let productData = genMainProductData(count);
		productData.name = mainProductsNames[getRandom(0, mainProductsNames.length - 1)];

		// main product object
		let mainProduct = new MainProduct(productData);

		// add main product to items
		ITEMS.push(mainProduct);

		// GENERATE UPSELLS
		let upsellProductsCount = upsellProductsNames.length / 6;

		while (upsellProductsCount > 0) {
			// generate upsell
			let upsellProductId = MAIN_PRODUCTS_COUNT + getRandom(1, (MAIN_PRODUCTS_COUNT / 4) / upsellProductsCount);
			let upsellProduct = getItemById(upsellProductId);
			if (!upsellProduct) {
				let upsellProductData = genUpsellProductData(upsellProductId);
				upsellProductData.name = upsellProductsNames[getRandom(0, upsellProductsNames.length - 1)];
				upsellProduct = new UpsellProduct(upsellProductData);
				ITEMS.push(upsellProduct);
			}

			// add link mainProduct -> upsell
			mainProduct.addSpecification(upsellProduct);

			// add link upsell -> mainproduct
			upsellProduct.addSpecification(mainProduct, upsellProduct, {
				itemsInCart: getRandom(2, mainProductsNames.length),
				totalCartPrice: +(mainProduct.get('price') * getRandom(2, 5).toFixed(2))
			});

			upsellProductsCount--;
		}

		// # GENERATE UPSELLS

		count--;
	}

})();
//#create shop items
var e = new Date();
console.log('generate process:', e - s, '.ms', 'ITEMS.length:', ITEMS.length, 'MAIN_PRODUCTS_COUNT:', MAIN_PRODUCTS_COUNT);
//console.log('All App ITEMS', ITEMS);

window.SPAAPP0001 = new App({development: __DEVELOPMENT__, node: node, items: ITEMS});
window.SPAAPP0001.run();

console.log(
	'development:', __DEVELOPMENT__,
	',livereload port:', __LIVERELOAD_PORT__,
	'run time:', new Date() - s, '.ms');