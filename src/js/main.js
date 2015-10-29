import App from 'app/App';

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

new App({development: __DEVELOPMENT__, node: node}).run();

console.log('RUN', __DEVELOPMENT__, ':', __LIVERELOAD_PORT__);