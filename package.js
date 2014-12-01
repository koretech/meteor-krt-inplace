var client = 'client', server = 'server', both = ['client', 'server'];

Package.describe({
	name: 'krt:inplace',
	summary: 'Koretech Inplace Editor Package',
	version: '0.1.1',
	git: 'https://github.com/koretech/meteor-krt-inplace.git'
});

Package.onUse(function(api){

	api.versionsFrom('METEOR@1.0');

	api.use([
		'krt:core@0.1.0',
		'templating',
		'underscore',
		'less',
		'nooitaf:semantic-ui@1.0.1',
		'mquandalle:bower@0.1.11',
		'aldeed:simple-schema@1.1.0'
	], both);

	api.imply([
		'krt:core',
		'nooitaf:semantic-ui'
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
