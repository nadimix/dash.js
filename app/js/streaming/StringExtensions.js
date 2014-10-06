String.isNullOrEmpty = function (str, _undefined) {
	return str === null || str === _undefined || str === 'undefined' || str === '';
};