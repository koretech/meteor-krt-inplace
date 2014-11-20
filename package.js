var client = 'client', server = 'server', both = ['client', 'server'];

Package.describe({
	name: 'krt:inplace',
	summary: 'Koretech Inplace Editor Package',
	version: '0.1.0',
	git: 'https://github.com/koretech/meteor-krt-inplace.git'
});

Package.onUse(function(api){

	api.versionsFrom('METEOR@0.9.4');

	api.use([
		'krt:core@0.1.0',
		'templating',
		'underscore',
		'less',
		'nooitaf:semantic-ui-less@0.19.3',
		'mquandalle:bower@0.1.11',
		'aldeed:simple-schema@0.7.0'
	], both);

	api.imply([
		'krt:core@0.1.0',
		'nooitaf:semantic-ui-less'
	]);

	api.addFiles([
		'namespaces.js'
	], both);

	api.addFiles([
		'smart.json',
		'lib/inplace.js',
		'lib/inplace.less',
		'lib/inplace.html'
	], client);

});
