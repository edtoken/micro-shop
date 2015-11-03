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

	shopItem: {
		styles: {
			float: 'left',
			display: 'block',
			width: '200px',
			height: '250px',
			border: '1px solid #ddd',
			margin: '7px',
			padding: '5px',
			fontSize: '11px',
			position: 'relative',
			overflowY: 'auto'
		}
	},

	notifications: {
		wrap: {
			styles: {
				position: 'fixed',
				left: 0,
				top: 0,
				right: 0,
				bottom: 0,
				width: '100%',
				height: '100%',
				zIndex: '1000',
				background: 'rgba(0,0,0,0.5)',
				overflowY: 'auto'
			}
		},

		content: {
			styles: {
				background: '#fff',
				width: '600px',
				margin: '60px auto',
				padding: '30px'
			}
		}
	}
};

class Component extends React.Component {

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

	/**
	 * get layout component
	 *
	 * @returns {*}
	 */
	getLayout() {
		return this.getApp().getLayout();
	}

	componentWillUnmount() {
	}

}

class CartView extends Component {

	constructor(props) {
		super(props);
		let cart = this.getCart();

		cart.on('all', this.handlerChangeCart, this);

		this.state = this.createState(props);
	}

	componentWillUnmount() {
		super.componentWillUnmount();
		this.getCart().off(null, null, this);
	}

	createState(props) {
		var cart = this.getCart();
		var state = {};
		state.totalPrice = cart.getTotalPrice();
		state.itemsInCart = cart.getItemsInCart();
		return state;
	}

	handlerChangeCart() {
		this.setState(this.createState(this.props));
	}

	handleClickResetCart(e) {
		e.preventDefault();
		this.getCart().clear();
	}

	render() {

		let state = this.state;

		return (<div className='CartView'>
			<h2>CartView
				{state.itemsInCart &&
				<button onClick={this.handleClickResetCart.bind(this)}>clear cart</button>
				}
			</h2>

			<div>totalPrice: {state.totalPrice}</div>
			<div>itemsInCart: {state.itemsInCart}</div>

		</div>);
	}
}

class PageComponent extends Component {

}

class ShopItem extends Component {

	constructor(props) {
		super(props);
		props.model.on('all', this.handleChangeModel, this);
	}

	componentWillUnmount() {
		super.componentWillUnmount();
		this.props.model.off(null, null, this);
	}

	handleChangeModel() {

		this.forceUpdate();
	}

	handlerClickAddToCart(e) {
		e.preventDefault();

		let count = parseInt(prompt('Введите количество', '1'));
		if (Validator.validate(count, ['integer', 'positive'])) {
			if(this.getCart().addWithQuantity(this.props.model, count, {})){
				alert('Добавлено')
			}
		} else {
			alert('Неверное количество')
		}

	}

	handleClickRemoveFromCart(e) {
		e.preventDefault();
		this.getCart().remove(this.props.model.id);
	}

	render() {

		let model = this.props.model;
		let json = model.toJSON();
		let type = model.getType();
		let upsell = (type == 'upsell');
		let inCart = model.inCart();
		let stockItems = json.stockItems;
		let price = json.price;
		let canAddToCart = (stockItems > 0);

		let upsellSpecifications;
		let canAddUpsell;

		if (upsell) {
			canAddUpsell = model.checkSpecifications();
			upsellSpecifications = (<div>
				{model.getSpecifications().map(function (item, num) {
					let mainProduct = item.get('mainProduct')
					return (<div key={num} style={{margin:'3px 0'}}>
						<div>{mainProduct.get('name')} (id:{mainProduct.id})</div>
						<div>total:{item.get('totalCartPrice')}</div>
						<div>itemsCount:{item.get('itemsInCart')}</div>
					</div>);
				})}
			</div>);
		}

		return (<div style={STYLES.shopItem.styles}>

			<div><b>{json.name}</b> id:{model.id}</div>

			{!canAddToCart && <div>Закончился на складе</div>}
			{canAddToCart &&
			<div>
				{!inCart && <div>
					<button onClick={this.handlerClickAddToCart.bind(this)}>add to cart</button>
				</div>}

				{inCart && <div>
					<button onClick={this.handleClickRemoveFromCart.bind(this)}>remove from cart</button>
				</div>}
			</div>
			}

			<div>stockItems: {stockItems}</div>
			<div>price: {price}</div>

			{upsell &&
			<div>
				<div style={{position:'absolute', top:'0', left:'0', color:'red'}}>
					upsell&nbsp;
					{canAddUpsell && <span>МОЖНО ДОБАВИТЬ</span>}
					{!canAddUpsell && <span>НЕЛЬЗЯ ДОБАВИТЬ</span>}
				</div>
				<h4 style={{margin:'0'}}>нужно купить:</h4>
				{upsellSpecifications}
			</div>
			}

		</div>);
	}
}


class ShopItemPopUp extends ShopItem {

}

class ShopBlock extends Component {

	render() {

		let shopItems = this.getShop().where();
		let renderItems = shopItems.map(function (model, num) {
			return (<ShopItem key={num} model={model}/>);
		});

		return (<div>
			{renderItems}
			<div style={STYLES.clearfix.styles}></div>
		</div>);
	}
}


class IndexPage extends PageComponent {

	render() {

		return (<div className='Page Page-index'>
			<ShopBlock />
		</div>);
	}
}

class ShowUpsellInformationPopUp extends Component {

	render() {

		let items = this.props.items;
		let renderCarts = [];

		_.each(items, (item, num) => (renderCarts.push(<ShopItemPopUp key={'popup-' + num } model={item.get('upsellProduct')}/>)));

		return (<div className=''>
			{renderCarts}
			<div style={STYLES.clearfix.styles}></div>
		</div>);
	}
}
class LayoutNotifications extends Component {

	constructor() {
		super();
		this.state = {notifications: []};
	}

	hide() {
		this.setState({notifications:[]});
	}

	handlerClickClose(e) {
		this.hide();
	}

	renderNotification(title, description, options) {
		let notifications = this.state.notifications;

		let t = false; // title
		let d = false; // description
		let o = false; // options

		if (!title) {
			return false;
		}

		if (!options) {

			if (_.isObject(description)) {
				t = title;
				o = description;
			} else {
				t = title;
				d = description;
			}

			if (!description) {
				d = title;
			}

		}

		if (!description) {
			d = title;
		}

		notifications.push({title: t, description: d, options: o});
		this.setState({notifications: notifications});
		return this;
	}

	render() {

		if (!this.state.notifications.length) {
			return false;
		}

		let notification = this.state.notifications[this.state.notifications.length - 1];
		let options = notification.options || ({type: ''});
		var component = false;

		switch (options.type) {
			case 'showUpsellInformation':
				component = (<ShowUpsellInformationPopUp items={options.data}/>);
				break;

			default:
				component = (options && options.component) ? options.component : false;
				break;
		}

		return (<div style={STYLES.notifications.wrap.styles}>
			<div style={STYLES.notifications.content.styles}>
				<span onClick={this.handlerClickClose.bind(this)}>CLOSE</span>

				<div>
					{notification.title && <h3>{notification.title}</h3>}
					{notification.description && <div>{notification.description}</div>}
					{component}
				</div>
			</div>
		</div>);
	}
}

export default class Layout extends Component {

	constructor() {
		super();
	}

	renderNotification(title, description, options) {
		this.refs.LayoutNotifications.renderNotification(title, description, options);
	}

	render() {

		let PageComponent = (<IndexPage />);
		let CartComponent = (<CartView />);

		return (<div>
			<LayoutNotifications ref="LayoutNotifications"/>
			{CartComponent}
			{PageComponent}
		</div>);
	}
}