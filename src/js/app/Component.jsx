import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import Validator from './Validator';

const STYLES = {

	clearfix: {
		styles: {
			display: 'block',
			clear: 'left'
		}
	},

	cart: {
		styles: {
			margin: '30px 0',
			borderBottom: '1px solid #aaa',
			paddingBottom: '30px'
		}
	},

	layout: {
		styles: {},
		header: {
			styles: {
				margin: '0 0 30px 0'
			}
		}
	},

	page: {
		styles: {
			border: '1px solid #aaa',
			padding: '15px'
		}
	},

	product: {
		styles: {
			padding: '5px',
			border: '1px solid #ddd',
			display: 'block',
			float: 'left',
			margin: '4px',
			height: '100px',
			width: '100px',
		}
	}
};

/**
 * Базовый класс
 */
class Component extends React.Component {

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

/**
 * Базовый класс для страницы
 */
class PageComponent extends Component {

}

class ProductItem extends Component {

	constructor(props) {
		super(props);
		this.state = this.createState();
		this.listenEvents();
	}

	componentWillReceiveProps(nextProps) {
		super.componentWillReceiveProps(nextProps);
		this.props = nextProps;
		this.updateState();
		this.listenEvents();
	}

	componentWillUnmount() {
		this.props.model.off(null, null, this);
	}

	updateState() {
		this.setState(this.createState());
	}

	createState() {
		let state = {};
		state.model = this.props.model.toJSON();
		state.inCart = state.model.inCart;
		return state;
	}

	listenEvents() {
		this.props.model.off(null, null, this);
		this.props.model.on('all', this.updateState, this);
	}

	handlerClickAddToCart(e) {
		e.preventDefault();
		var quantity = parseInt(prompt('Введите количество', '1'));
		var errors = Validator.checkErrors(quantity, ['required', 'integer', 'positive']);

		if (!errors) {
			this.props.model.addToCart(quantity);
			//this.getCart().addWidthQuantity(this.props.model, quantity);
		} else {
			alert('Error in console')
			console.warn(errors);
		}
	}

	handlerClickRemoveFromCart(e) {
		e.preventDefault();

		var product = this.getCart().find({id: this.props.model.id}, true);
		var quantity = this.getCart().find({id: product.model.id}, true)
			? parseInt(prompt('Введите количество', product.data.quantity))
			: 1;

		var errors = Validator.checkErrors(quantity, ['required', 'integer', 'positive']);

		if (!errors) {
			product.model.removeFromCart(quantity);
			//this.getCart().remove(productId, quantity);
		} else {
			alert('Error in console');
			console.warn(errors);
		}

	}

	handlerChangeQuantity(e){
		e.preventDefault();

		var product = this.getCart().find({id: this.props.model.id}, true);
		var quantity = this.getCart().find({id: product.model.id}, true)
			? parseInt(prompt('Введите количество', product.data.quantity))
			: 1;

		var errors = Validator.checkErrors(quantity, ['required', 'integer', 'positive']);

		if (!errors) {
			product.model.changeQuantity(quantity);
			//this.getCart().remove(productId, quantity);
		} else {
			alert('Error in console');
			console.warn(errors);
		}

	}

	render() {

		let model = this.props.model;
		let inCart = model.inCart;
		let upsellProduct = !model.isMainProduct();

		return (<div className='Product' style={STYLES.product.styles}>
			<span className='Product-title'>{model.get('name')}</span>
			{upsellProduct && <div>
				<small style={{color:'red'}}>upsell</small>
			</div>}

			<div>price:{model.get('price')}</div>

			<div className='Product-actions'>
				{inCart && <button onClick={this.handlerClickRemoveFromCart.bind(this)}>remove from cart</button>}
				{inCart && <button onClick={this.handlerChangeQuantity.bind(this)}>changeQuantity</button>}
				{!inCart && <button onClick={this.handlerClickAddToCart.bind(this)}>add to cart</button>}
			</div>
		</div>)
	}
}

class CartView extends Component {

	constructor(props) {
		super(props);
		this.state = this.createState();
		this.listenEvents();
	}

	componentWillReceiveProps(nextProps) {
		super.componentWillReceiveProps(nextProps);
		this.props = nextProps;
		this.updateState();
		this.listenEvents();
	}

	componentWillUnmount() {
		this.getCart().off(null, null, this);
	}

	updateState() {
		this.setState(this.createState());
	}

	createState() {
		var cart = this.getCart();
		var state = {};
		state.totalPrice = cart.getTotalPrice();
		state.items = cart.find();
		return state;
	}

	listenEvents() {
		this.getCart().off(null, null, this);
		this.getCart().on('add', this.updateState, this);
		this.getCart().on('remove', this.updateState, this);
	}

	handlerClickRemove(productId) {

		var product = this.getCart().find({id: productId}, true);
		if (product) {

			var quantity = (product.data.quantity > 1)
				? parseInt(prompt('Введите количество', product.data.quantity))
				: 1;

			var errors = Validator.checkErrors(quantity, ['required', 'integer']);

			if (!errors) {
				product.model.removeFromCart(quantity);
				//this.getCart().remove(productId, quantity);
			} else {
				alert('Error in console')
				console.warn(errors);
			}
			return this;
		}

		alert('Продукт не найден');
		return false;
	}

	render() {

		var state = this.state;
		var self = this;

		return (<div className='Cart' style={STYLES.cart.styles}>
			<h1>Cart</h1>

			<div className='Cart-info'>
				<ul>
					<li>totalPrice: {state.totalPrice}</li>
				</ul>

				{state.items.map(function (item, num) {
					return (<div key={num}>
						{item.model.get('name')},
						count: {item.data.quantity},
						<button onClick={self.handlerClickRemove.bind(self, item.model.id)}>remove</button>
					</div>);
				})}
			</div>
		</div>);
	}
}

/**
 * Класс страницы
 */
class IndexPage extends PageComponent {

	render() {
		//let products = this.getShop().getMainProducts();
		// получаю все продукты, в том числе и upsell (для возможности неправильного добавления)
		let products = this.getShop().find();

		return (<div className='Page' style={STYLES.page.styles}>
			<h1>Products
				<small>(count:{products.length})</small>
			</h1>

			<div>
				{products.map(function (product) {
					return (<ProductItem key={product.id} model={product}/>);
				})}

				<div style={STYLES.clearfix.styles}></div>
			</div>
		</div>);
	}
}

export default class Layout extends Component {

	render() {

		var PageComponent = (<IndexPage />);
		var Cart = (<CartView />);

		return (<div className='Layout' style={STYLES.layout.styles}>
			<div className='Layout-header' style={STYLES.layout.header.styles}>Layout Header</div>
			<div className='Layout-pageComponent'>
				{Cart}
				{PageComponent}
			</div>
		</div>);
	}
}

