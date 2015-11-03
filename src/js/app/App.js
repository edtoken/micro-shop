import _ from 'underscore';
import React from 'react';
import ReactDOM from 'react-dom';
import Layout from './Component';
import Shop from './Shop';

/**
 * core App class
 */
export default class App {

	constructor(config) {
		this.config = config;
		this.shop = new Shop({items: this.config.items});

		if(this.isDev()){
			console.log('App.constructor', this);
		}
	}

	isDev(){
		return (__DEVELOPMENT__);
	}

	getLayout(){
		return this.layout;
	}

	run() {
		this.layout = ReactDOM.render(<Layout />, this.config.node);
	}
}
