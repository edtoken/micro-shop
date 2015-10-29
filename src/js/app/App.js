import _ from 'underscore';
import React from 'react';
import ReactDOM from 'react-dom';
import Layout from './Component';

/**
 * core App class
 */
export default class App {

	constructor(config) {
		this.config = config;
	}

	run() {
		ReactDOM.render(<Layout />, this.config.node);
	}
}
