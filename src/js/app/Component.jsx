import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';

/**
 * base Component class
 *
 */
class Component extends React.Component {

}

/**
 * page component class
 *
 */
class Page extends Component {

	render() {

		return (<div className='Page'>
			Page
		</div>);
	}
}

/**
 * layout component class
 *
 */
export default class Layout extends Component {
	render() {

		return (<div className='Layout'>
			<div className='Layout-header'>LayoutHeader</div>
			<Page />
			<div className='Layout-header'>LayoutFooter</div>
		</div>);
	}
}
