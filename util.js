/**
 * copy an array
 */
Array.prototype.copy = (function () {
	var f = function (o) {
		return o;
	};
	return function () {
		return this.map(f);
	};
}());
