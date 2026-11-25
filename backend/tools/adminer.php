<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Adminer - Database management in a single PHP file</title>
		<link rel="stylesheet" type="text/css" href="/static/style.css?v=1795196292" />
		<script defer src="/static/lightbox.js?v=1795196292"></script>
		<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
		<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
		<link rel="alternate" type="application/rss+xml" href="https://github.com/vrana/adminer/releases.atom" title="News" />
		<link rel="canonical" href="/en/" />

			<link rel="alternate" lang="cs" href="/cs/" title="Čeština" />
			<link rel="alternate" lang="de" href="/de/" title="Deutsch" />
			<link rel="alternate" lang="pl" href="/pl/" title="Polski" />
			<link rel="alternate" lang="ro" href="/ro/" title="Română" />
			<link rel="alternate" lang="sk" href="/sk/" title="Slovenčina" />
			<link rel="alternate" lang="ja" href="/ja/" title="日本語" />
		<meta property="og:url" content="https://www.adminer.org/en/" />
		<meta name="description" content="Adminer is available for: MySQL, MariaDB, PostgreSQL, CockroachDB, SQLite, MS SQL, Oracle. Others can be added via plugin: Elasticsearch, SimpleDB, MongoDB, Redis, Firebird, ClickHouse." />
		<meta property="og:description" content="Adminer is available for: MySQL, MariaDB, PostgreSQL, CockroachDB, SQLite, MS SQL, Oracle. Others can be added via plugin: Elasticsearch, SimpleDB, MongoDB, Redis, Firebird, ClickHouse." />
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="Adminer" />
		<meta property="og:title" content="Adminer - Database management in a single PHP file" />
		<meta property="og:image" content="https://www.adminer.org/static/screenshots/select.webp" />
		<meta property="og:image:type" content="image/webp" />
		<meta property="og:image:width" content="2049" />
		<meta property="og:image:height" content="1167" />
		<meta property="og:image:alt" content="Adminer – Select data" />
		<meta name="twitter:card" content="summary_large_image" />

	</head>
	<body>
		<div id="container">
			<div id="header">
				<h1><a href="/en/">Adminer <span>&shy;</span></a></h1>
				<div id="slogan">Database management in a single PHP file</div>
					<ul id="languages">
						<li><img src="/static/images/flags/en.gif" width="16" height="11" alt="" title="English"></li>
						<li><a href="/cs/"><img src="/static/images/flags/cs.gif" width="16" height="11" alt="" title="Čeština"></a></li>
						<li><a href="/de/"><img src="/static/images/flags/de.gif" width="16" height="11" alt="" title="Deutsch"></a></li>
						<li><a href="/pl/"><img src="/static/images/flags/pl.gif" width="16" height="11" alt="" title="Polski"></a></li>
						<li><a href="/ro/"><img src="/static/images/flags/ro.gif" width="16" height="11" alt="" title="Română"></a></li>
						<li><a href="/sk/"><img src="/static/images/flags/sk.gif" width="16" height="11" alt="" title="Slovenčina"></a></li>
						<li><a href="/ja/"><img src="/static/images/flags/ja.gif" width="16" height="11" alt="" title="日本語"></a></li>
					</ul>
			</div>

			<div id="navbar">
				<ul>
					<li><a href="/en/" class="current"><em><span class="icon adminer">Adminer</span></em></a></li>
					<li><a href="/en/editor/"><em><span class="icon editor">Adminer Editor</span></em></a></li>
					<li><a href="/en/plugins/"><em><span class="icon plugin">Plugins</span></em></a></li>
					<li><a href="https://github.com/vrana/adminer/releases"><em><span class="icon news">News</span></em></a></li>
					<li><a href="https://github.com/vrana/adminer/discussions"><em><span class="icon forums">Forums</span></em></a></li>
					<li><a href="https://github.com/vrana/adminer/issues"><em><span class="icon bugs">Bugs</span></em></a></li>
					<li><a href="https://github.com/vrana/adminer/"><em><span class="icon github">Code</span></em></a></li>
				</ul>
			</div>




<div id="info-block">
	<div id="screen">
		<img src="/static/images/adminer.webp" alt="Adminer – screenshot" width="266" height="157" />
	</div>

	<div id="title">
		<p>Adminer is available for:
			<br><span class="drivers">MySQL &middot; MariaDB &middot; PostgreSQL &middot; SQLite &middot; MS SQL &middot; Oracle</span>
			<br><a href="/en/plugins/#driver">more via plugins</a>
		</p>
		<div class="more">See:
			<a href="#features">Features</a>,
			<a href="#requirements">Requirements</a>,
			<a href="#extras">Skins</a>,
			<a href="#references">References</a>
		</div>
	</div>

	<div class="buttons">
		<div id="demo">
			<div class="content">
				<a href="https://demo.adminer.org/adminer.php?username=" target="_blank">
					<strong>Online demo</strong>
				</a>
			</div>
		</div>
		<div id="downloads" onclick="location.href = '#download';">
			<div class="download">
				<div class="content">
					<a href="#download"><strong>Download</strong></a><br />
					v 6.3.1, 2026-11-20
				</div>
			</div>
		</div>
	</div>
</div>

<h3><a name="screenshots"></a>Screenshots</h3>
<p class="screenshots">
<a rel="screenshot" href="/static/screenshots/auth.webp" title="Login"><img width="100" height="100" alt="" src="/static/screenshots/preview/auth.webp" /></a>
<a rel="screenshot" href="/static/screenshots/db.webp" title="Database overview"><img width="100" height="100" alt="" src="/static/screenshots/preview/db.webp" /></a>
<a rel="screenshot" href="/static/screenshots/table.webp" title="Table overview"><img width="100" height="100" alt="" src="/static/screenshots/preview/table.webp" /></a>
<a rel="screenshot" href="/static/screenshots/create.webp" title="Alter table"><img width="100" height="100" alt="" src="/static/screenshots/preview/create.webp" /></a>
<a rel="screenshot" href="/static/screenshots/select.webp" title="Select data"><img width="100" height="100" alt="" src="/static/screenshots/preview/select.webp" /></a>
<a rel="screenshot" href="/static/screenshots/edit.webp" title="Edit data"><img width="100" height="100" alt="" src="/static/screenshots/preview/edit.webp" /></a>
<a rel="screenshot" href="/static/screenshots/database.webp" title="Server overview"><img width="100" height="100" alt="" src="/static/screenshots/preview/database.webp" /></a>
<a rel="screenshot" href="/static/screenshots/schema.webp" title="Database schema"><img width="100" height="100" alt="" src="/static/screenshots/preview/schema.webp" /></a>
<a rel="screenshot" href="/static/screenshots/dump.webp" title="Export"><img width="100" height="100" alt="" src="/static/screenshots/preview/dump.webp" /></a>
<a rel="screenshot" href="/static/screenshots/sql.webp" title="SQL command"><img width="100" height="100" alt="" src="/static/screenshots/preview/sql.webp" /></a>
<a rel="screenshot" href="/static/screenshots/mobile.gif" title="Mobile version"><img width="100" height="100" alt="" src="/static/screenshots/preview/mobile.webp" /></a>
<a rel="screenshot" href="/static/screenshots/dark.webp" title="Dark mode"><img width="100" height="100" alt="" src="/static/screenshots/preview/dark.webp" /></a>
</p>
<p><a href="https://www.youtube.com/watch?v=r0e2ovhC_Gs">Screencast</a> about Adminer features and using plugins (19:31, by <a href="https://www.srigi.dev/">Srigi</a>)</p>

<h3 id="download">Downloads</h3>
<ul class="platforms">
<li class="php">PHP:
	<a href="https://github.com/vrana/adminer/releases/download/v6.3.1/adminer-6.3.1.php">adminer-6.3.1.php</a> (573 kB),
	<a href="https://github.com/vrana/adminer/releases/download/v6.3.1/adminer-6.3.1-en.php" title="adminer-6.3.1-en.php">English only</a> (425 kB)<br>
	MySQL only: <a href="https://github.com/vrana/adminer/releases/download/v6.3.1/adminer-6.3.1-mysql.php">adminer-6.3.1-mysql.php</a> (433 kB),
	<a href="https://github.com/vrana/adminer/releases/download/v6.3.1/adminer-6.3.1-mysql-en.php" title="adminer-6.3.1-mysql-en.php">English only</a> (290 kB)
</li>
<li class="donate"><a href="/en/donation/">Donate</a>: <a href="https://github.com/sponsors/vrana" target="_blank">GitHub</a>, <a href="https://www.paypal.com/donate/?hosted_button_id=6PK5VNUCFT3FG" target="_blank">Paypal</a>, <a href="https://www.patreon.com/jakubvrana" target="_blank">Patreon</a></li>
<li class="docker">Docker: <code>docker run -p 8080:8080 adminer</code> (<a href="https://hub.docker.com/_/adminer/" target="_blank">Docker Hub</a>)</li>
<li class="windows">Windows:
	<a href="https://github.com/vrana/adminer-desktop/releases/download/v6.3.1/adminer-6.3.1-x64.exe">adminer-6.3.1-x64.exe</a> (7 MB, Intel/AMD 64-bit, <small>signature by <a href="https://signpath.org/" target="_blank">SignPath Foundation</a> pending</small>)
</li>
<li class="macos">macOS:
	<a href="https://github.com/vrana/adminer-desktop/releases/download/v6.3.1/adminer-6.3.1-macos-arm64.zip" title="Adminer.app">adminer-6.3.1-macos-arm64.zip</a> (7 MB, Apple Silicon)
</li>
<li class="linux">Linux:
	<a href="https://github.com/vrana/adminer-desktop/releases/download/v6.3.1/adminer-6.3.1-linux-x86_64.tar.xz">adminer-6.3.1-linux-x86_64.tar.xz</a> (5 MB, Intel/AMD 64-bit)
</li>
</ul>
<p>The downloads for Windows, Linux and macOS contain PHP, so they need no web server: start Adminer and it opens in a window of its own (<a href="https://github.com/vrana/adminer-desktop">more</a>).</p>
<ul class="more-downloads">
<li><a href="https://github.com/vrana/adminer/releases/download/v6.3.1/adminer-6.3.1.zip">Source codes</a> (.zip, 1.2 MB), <a href="https://github.com/vrana/adminer/">Current development version</a></li>
<li>Latest stable version (use e.g. by <code>wget</code>): <code>https://www.adminer.org/latest[-mysql][-en].php</code></li>
<li><a href="https://github.com/vrana/adminer/blob/main/CHANGELOG.md">Change log</a>, <a href="https://php.vrana.cz/-adminer.php">blog</a></li>
<li>User contributed packages:
	<a class="icon wordpress" href="https://wordpress.org/plugins/pexlechris-adminer/" target="_blank">Wordpress plugin</a>,
	<a class="icon cpanel" href="https://github.com/vrana/adminer-cpanel" target="_blank">cPanel</a>,
	<a class="icon mcp" href="https://github.com/landsman/adminer-desktop" target="_blank">desktop + MCP</a>,
	<a class="icon moodle" href="https://moodle.org/plugins/view.php?plugin=local_adminer" target="_blank">Moodle plugin</a>,
	<a class="icon debian" href="https://packages.debian.org/sid/adminer" target="_blank">Debian package</a>,
	<a class="icon archlinux" href="https://aur.archlinux.org/packages/adminer/" target="_blank">Arch Linux package</a>,
	<a class="icon dockette" href="https://github.com/dockette/adminer" target="_blank">Dockette</a>,
	<a class="icon easypanel" href="https://easypanel.io/templates/adminer" target="_blank">Easypanel</a>,
	<a class="icon laravel" href="https://packagist.org/packages/onecentlin/laravel-adminer" target="_blank">Laravel</a>,
	<a class="icon omeka" href="https://omeka.org/s/modules/Adminer/">Omeka</a>,
	<a class="icon cmsms" href="http://dev.cmsmadesimple.org/projects/btadminer/" target="_blank">CMS Made Simple Module</a>, 
	<a class="icon electron" href="https://github.com/lusingander/eledminer" target="_blank">Electron</a>, 
	<a class="icon drupal" href="https://www.drupal.org/project/adminer" target="_blank">Drupal module</a> 
	<!--
	<a href="http://extensions.joomla.org/extensions/hosting-a-servers/database-management/9886" target="_blank">Joomla extension</a>,
	<a href="http://typo3.org/extensions/repository/view/t3adminer/current/" target="_blank">TYPO3 extension</a>,
	<a href="https://github.com/robinflyhigh/laravel-adminer" target="_blank">Laravel</a>,
	<a href="https://github.com/dotzero/Laravel-Adminer" target="_blank">Laravel</a>,
	<a href="http://www.ampps.com/apps/dbtools/Adminer" target="_blank">AMPPS</a>,
	<a href="https://github.com/lagdo/jaxon-adminer" target="_blank">Jaxon</a>,
	 -->
</li>
<li><a href="https://github.com/vrana/adminer/releases/">Older versions</a></li>
</ul>

<h3 id="features">Features</h3>
<ul>
	<li><strong>Connect</strong> to a database server with username and password</li>
	<li>Select an existing <strong>database</strong> or create a new one</li>
	<li>List fields, indexes, foreign keys and triggers of table</li>
	<li>Change name, engine, collation, auto_increment and comment of <strong>table</strong></li>
	<li>Alter name, type, collation, comment and default values of <strong>columns</strong></li>
	<li>Add and drop tables and columns</li>
	<li>Create, alter, drop and search by <strong>indexes</strong> including fulltext</li>
	<li>Create, alter, drop and link lists by <strong>foreign keys</strong></li>
	<li>Create, alter, drop and select from <strong>views</strong></li>
	<li>Create, alter, drop and call <strong>stored procedures and functions</strong></li>
	<li>Create, alter and drop <strong>triggers</strong></li>
	<li><strong>List data</strong> in tables with search, aggregate, sort and limit results</li>
	<li>Insert new <strong>records</strong>, update and delete the existing ones</li>
	<li>Supports all <strong>data types</strong>, blobs through file transfer</li>
	<li>Execute any <strong>SQL command</strong> from a text field or a file</li>
	<li><strong>Export</strong> table structure, data, views, routines, databases to SQL or CSV</li>
	<li>Print <strong>database schema</strong> connected by foreign keys</li>
	<li>Show <strong>processes</strong> and kill them</li>
	<li>Display <strong>users and rights</strong> and change them</li>
	<li>Display <strong>variables</strong> with links to documentation</li>
	<li>Support <strong>generated columns</strong>, <strong>check constraints</strong></li>
	<li>Manage <strong>events</strong> and <strong>table partitions</strong> (MySQL 5.1)</li>
	<li>Schemas, sequences, user types (PostgreSQL)</li>
	<li><a href="/en/extension/">Extensive <strong>customization</strong> options</a></li>
</ul>
<p><a href="/en/tips/">Tips for the features which are easy to miss</a></p>

<h3 id="requirements">Requirements</h3>
<ul>
	<li>Works with
		<acronym title="5.1+ through extensions: mysql, mysqli, pdo_mysql">MySQL</acronym>,
		MariaDB,
		<acronym title="9.1+ through extensions: pgsql, pdo_pgsql">PostgreSQL</acronym> (<a href="https://demo.adminer.org/adminer.php?pgsql=&amp;username=" target="_blank">demo</a>),
		CockroachDB,
		<acronym title="3+ through extensions: sqlite3, pdo_sqlite">SQLite</acronym> (<a href="/static/download/6.3.1/adminer-6.3.1-sqlite.php">download</a>),
		<acronym title="2005+ through extensions: sqlsrv, pdo_sqlsrv, pdo_dblib">MS SQL</acronym>,
		<acronym title="through extensions: oci8, pdo_oci" lang="en">Oracle</acronym>
	</li>
	<li><a href="/en/plugins/#driver">Plugins</a>: Elasticsearch, SimpleDB, MongoDB, Redis, Firebird, ClickHouse, IGDB, IMAP, DuckDB, Parquet</li>
	<li>Supports PHP 5.4+, 7 and 8 with enabled sessions</li>
	<li>
    Available in many languages
    
    <a href="https://github.com/vrana/adminer/blob/main/adminer/lang/README.md#leaderboard">(47)</a>
    - <a href="/en/translation/">Create a new translation</a>
  </li>
	<li>Free for commercial and non-commercial use (<a href="https://www.apache.org/licenses/LICENSE-2.0.html">Apache License</a> or <a href="https://www.gnu.org/licenses/old-licenses/gpl-2.0.html#SEC1">GPL 2</a>)</li>
</ul>

<p id="security">Security is #1 priority in development of Adminer. Adminer does not allow connecting to databases without a password and it rate-limits the connection attempts to protect against brute-force attacks. Still, consider making Adminer inaccessible to public by whitelisting IP addresses allowed to connect to it, password-protecting the access in your web server, enabling security <a href="/en/plugins/">plugins</a> (e.g. to require an <acronym title="One Time Password" lang="en">OTP</acronym>) or by <a href="/en/extension/">customizing</a> the <code>login</code> method. You can also delete Adminer if not needed anymore, it is just one file which is easy to upload in the future. Adminer had some security bugs in the past so update whenever Adminer tells you there is a new version available (ask your administrator if you could not update yourself). <a href="/en/security/">More information</a></p>

<h3 id="sponsors">Sponsors</h3>
<ul class="extras">
	<li><a href="https://www.vas-hosting.com/?ref=3000" rel="sponsored" target="_blank"><img src="/static/images/sponsors/vas-hosting.svg" width="100" height="100" alt="logo" title="Váš Hosting"></a></li>
	<li><a href="https://www.pikapods.com/?ref=adminer" rel="sponsored" target="_blank"><img src="/static/images/sponsors/pikapods.webp" width="100" height="100" alt="logo" title="PikaPods"></a></li>

	<li><a href="https://www.domsys.cz/" rel="sponsored" target="_blank"><img src="/static/images/sponsors/domsys.svg" width="100" height="100" alt="logo" title="DOMSYS property management software"></a></li>
</ul>
<p class="clear"><a href="https://github.com/sponsors/vrana">Become a sponsor</a></p>

<h3 id="phpmyadmin">Why is Adminer better than phpMyAdmin?</h3>
<p>Replace <strong>phpMyAdmin</strong> with <strong>Adminer</strong> and you will get a single file instead of thousands, support for seven database systems and pages several times smaller and faster. <a href="/en/phpmyadmin/">See detailed comparison</a>.</p>
<p>Adminer development priorities are: 1. Security, 2. User experience, 3. Performance, 4. Feature set, 5. Size.</p>

<h3 id="extras">Alternative designs</h3>
<ul class="extras">
	<li><a rel="design" href="/static/designs/hever/screenshot.webp" title="hever (Martin Hořínek)"><img width="100" height="100" alt="screenshot" src="/static/designs/hever/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/hever/adminer.css">hever</a></li>
	<li><a rel="design" href="/static/designs/cpanel/screenshot.webp" title="cpanel (Jakub Vrána)"><img width="100" height="100" alt="screenshot" src="/static/designs/cpanel/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/cpanel/adminer.css">cpanel</a></li>
	<li><a rel="design" href="/static/designs/nette/screenshot.webp" title="nette (David Grudl)"><img width="100" height="100" alt="screenshot" src="/static/designs/nette/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/nette/adminer.css">nette</a></li>
	<li><a rel="design" href="/static/designs/brade/screenshot.webp" title="brade (Brad Garrett)"><img width="100" height="100" alt="screenshot" src="/static/designs/brade/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/brade/adminer.css">brade</a></li>
	<li><a rel="design" href="/static/designs/ng9/screenshot.webp" title="ng9 (Lukáš Brandejs)"><img width="100" height="100" alt="screenshot" src="/static/designs/ng9/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/ng9/adminer.css">ng9</a></li>
	<li><a rel="design" href="/static/designs/pepa-linha/screenshot.webp" title="pepa-linha"><img width="100" height="100" alt="screenshot" src="/static/designs/pepa-linha/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/pepa-linha/adminer.css">pepa-linha</a></li>
	<li><a rel="design" href="/static/designs/lucas-sandery/screenshot.webp" title="lucas-sandery"><img width="100" height="100" alt="screenshot" src="/static/designs/lucas-sandery/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/lucas-sandery/adminer.css">lucas-sandery</a></li>
	<li><a rel="design" href="/static/designs/win98/screenshot.webp" title="win98 (Maxim Milovanov)"><img width="100" height="100" alt="screenshot" src="/static/designs/win98/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/win98/adminer.css">win98</a></li>
	<li><a rel="design" href="/static/designs/pappu687/screenshot.webp" title="pappu687 (M. Mahbubur Rahman)"><img width="100" height="100" alt="screenshot" src="/static/designs/pappu687/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/pappu687/adminer.css">pappu687</a></li>
	<li><a rel="design" href="/static/designs/mvt/screenshot.webp" title="mvt (M. Mahbubur Rahman)"><img width="100" height="100" alt="screenshot" src="/static/designs/mvt/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/mvt/adminer.css">mvt</a></li>
	<li><a rel="design" href="/static/designs/lavender-light/screenshot.webp" title="lavender-light (Alex Yu)"><img width="100" height="100" alt="screenshot" src="/static/designs/lavender-light/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/lavender-light/adminer.css">lavender-light</a></li>
	<li><a rel="design" href="/static/designs/rmsoft/screenshot.webp" title="rmsoft (Robert Mesaros)"><img width="100" height="100" alt="screenshot" src="/static/designs/rmsoft/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/rmsoft/adminer.css">rmsoft</a></li>
	<li><a rel="design" href="/static/designs/rmsoft_blue/screenshot.webp" title="rmsoft-blue (Robert Mesaros)"><img width="100" height="100" alt="screenshot" src="/static/designs/rmsoft_blue/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/rmsoft_blue/adminer.css">rmsoft-blue</a></li>
	<li><a rel="design" href="/static/designs/rmsoft_blue-dark/screenshot.webp" title="rmsoft-dark (Robert Mesaros)"><img width="100" height="100" alt="screenshot" src="/static/designs/rmsoft_blue-dark/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/rmsoft_blue-dark/adminer.css">rmsoft-dark</a></li>
	<li><a rel="design" href="/static/screenshots/dark.webp" title="adminer-dark (Robert Mesaros)"><img width="100" height="100" alt="screenshot" src="/static/screenshots/preview/dark.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/adminer-dark/adminer-dark.css">adminer-dark</a></li>
	<li><a rel="design" href="/static/designs/michael-grznar/screenshot.webp" title="(Michael Grznar)"><img width="100" height="100" alt="screenshot" src="/static/designs/michael-grznar/preview.webp" /></a><br /><a href="https://raw.githubusercontent.com/MichaelGrznar/adminer-dark-css/main/adminer-dark.css">michael-grznar</a></li>
 	<li><a rel="design" href="/static/designs/pepa-linha-dark/screenshot.webp" title="(Pepa Linha)"><img width="100" height="100" alt="screenshot" src="/static/designs/pepa-linha-dark/preview.webp" /></a><br /><a href="https://raw.githubusercontent.com/pepa-linha/Adminer-Design-Dark/master/adminer-dark.css">pepa-linha-dark</a></li>
 	<li><a rel="design" href="/static/designs/ichier/screenshot.webp" title="ichier"><img width="100" height="100" alt="screenshot" src="/static/designs/ichier/preview.webp" /></a><br /><a href="https://raw.githubusercontent.com/ichier/adminer-pepa-linha-dark-ichier/main/adminer.pepa-linha-dark_ichier.css">ichier</a></li>
 	<li><a rel="design" href="/static/designs/filamentish/screenshot.webp" title="filamentish"><img width="100" height="100" alt="screenshot" src="/static/designs/filamentish/preview.webp" /></a><br /><a href="https://raw.githubusercontent.com/m-ristau/adminer-filamentish/main/adminer.css">filamentish</a></li>
 	<li><a rel="design" href="/static/designs/mancave/screenshot.webp" title="mancave (MonolithForge)"><img width="100" height="100" alt="screenshot" src="/static/designs/mancave/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/mancave/adminer-dark.css">mancave</a></li>
	<li><a rel="design" href="/static/designs/galkaev/screenshot.webp" title="galkaev (Peter Galkaev)"><img width="100" height="100" alt="screenshot" src="/static/designs/galkaev/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/galkaev/adminer-dark.css">galkaev</a></li>
 	<li><a rel="design" href="/static/designs/hydra/screenshot.webp" title="hydra (Niyko)"><img width="100" height="100" alt="screenshot" src="/static/designs/hydra/preview.webp" /></a><br /><a href="https://raw.githubusercontent.com/Niyko/Hydra-Dark-Theme-for-Adminer/master/adminer.css">hydra</a></li>
	<li><a rel="design" href="/static/designs/dracula/screenshot.webp" title="dracula (Douglas Damasio)"><img width="100" height="100" alt="screenshot" src="/static/designs/dracula/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/dracula/adminer-dark.css">dracula</a></li>
	<li><a rel="design" href="/static/designs/cocoa/screenshot.webp" title="cocoa (Sótanyi Bálint)"><img width="100" height="100" alt="screenshot" src="/static/designs/cocoa/preview.webp" /></a><br /><a href="https://raw.githubusercontent.com/bsotanyi/Cocoa-Adminer/refs/heads/master/adminer.css">cocoa</a></li>
	<li><a rel="design" href="/static/designs/simple-theme/screenshot.webp" title="Simple Theme (Hassan Azzi)"><img width="100" height="100" alt="screenshot" src="/static/designs/simple-theme/preview.webp" /></a><br /><a href="https://raw.githubusercontent.com/devknown/simple-theme/master/adminer.css">simple-theme</a></li>
	<li><a rel="design" href="/static/designs/arcs-material/screenshot.webp" title="arcs-material (Patrick Stillhart)"><img width="100" height="100" alt="screenshot" src="/static/designs/arcs-material/preview.webp" /></a><br /><a href="https://raw.githubusercontent.com/arcs-/Adminer-Material-Theme/master/adminer.css">arcs-material</a></li>
	<li><a rel="design" href="/static/designs/price/screenshot.webp" title="price (James Price)"><img width="100" height="100" alt="screenshot" src="/static/designs/price/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/price/adminer.css">price</a></li>
	<li><a rel="design" href="/static/designs/flat/screenshot.webp" title="flat (Israel Viana)"><img width="100" height="100" alt="screenshot" src="/static/designs/flat/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/flat/adminer.css">flat</a></li>
	<li><a rel="design" href="/static/designs/haeckel/screenshot.webp" title="haeckel (Klemens Häckel)"><img width="100" height="100" alt="screenshot" src="/static/designs/haeckel/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/haeckel/adminer.css">haeckel</a></li>
	<li><a rel="design" href="/static/designs/pokorny/screenshot.webp" title="pokorny (Miroslav Pokorný)"><img width="100" height="100" alt="screenshot" src="/static/designs/pokorny/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/pokorny/adminer.css">pokorny</a></li>
	<li><a rel="design" href="/static/designs/paranoiq/screenshot.webp" title="paranoiq (Vlasta Neubauer)"><img width="100" height="100" alt="screenshot" src="/static/designs/paranoiq/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/paranoiq/adminer.css">paranoiq</a></li>
	<li><a rel="design" href="/static/designs/bueltge/screenshot.webp" title="bueltge (Frank Bültge)"><img width="100" height="100" alt="screenshot" src="/static/designs/bueltge/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/bueltge/adminer.css">bueltge</a></li>
	<li><a rel="design" href="/static/designs/esterka/screenshot.webp" title="esterka (Petr Esterka)"><img width="100" height="100" alt="screenshot" src="/static/designs/esterka/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/esterka/adminer.css">esterka</a></li>
	<li><a rel="design" href="/static/designs/nicu/screenshot.webp" title="nicu (Iordachescu Nicu)"><img width="100" height="100" alt="screenshot" src="/static/designs/nicu/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/nicu/adminer.css">nicu</a></li>
	<li><a rel="design" href="/static/designs/arcs-/screenshot.webp" title="arcs- (Patrick Stillhart)"><img width="100" height="100" alt="screenshot" src="/static/designs/arcs-/preview.webp" /></a><br /><a href="https://raw.githubusercontent.com/arcs-/adminer.css/master/adminer.css">arcs-</a></li>
	<li><a rel="design" href="/static/designs/konya/screenshot.webp" title="konya (Oğuz Konya)"><img width="100" height="100" alt="screenshot" src="/static/designs/konya/preview.webp" /></a><br /><a download href="https://raw.githubusercontent.com/vrana/adminer/refs/tags/v6.3.1/designs/konya/adminer.css">konya</a></li>
	<li><a rel="design" href="/static/designs/kahi2/screenshot.webp" title="kahi (Petr Kahoun)"><img width="100" height="100" alt="screenshot" src="/static/designs/kahi2/preview.webp" /></a><br /><a href="http://kahi.cz/blog/images/adminer-makeup/adminer331-kahi.zip">kahi</a></li>
</ul>
<p class="clear"><strong>Usage:</strong> Just put the file <code>adminer.css</code> or <code>adminer-dark.css</code> alongside <code>adminer.php</code>.</p>
<ul>
<li><a href="https://github.com/pematon/adminer-theme">Several styles by Pematon</a></li>
<li><a href="http://www.rmsoft.sk/index.php/en/portfolio/programming-work/web-services/graphical-interface-css-for-adminer">Several styles by Robert Mesaros</a></li>
</ul>
<script src="/static/download.js?v=1795196291"></script>

<h3 id="references">References</h3>
<ul class="references">
		<li>2026-08-07 <a href="http://php.vrana.cz/adminer-6-0-0.php">Adminer 6.0.0 – přihlašování bez hesla - PHP triky</a> (Czech)</li>
		<li>2026-05-19 <a href="https://www.hostinger.com/tutorials/how-to-set-up-adminer-docker/">Hostinger</a> (English)</li>
		<li>2026-04-15 <a href="https://docs.vultr.com/how-to-install-adminer-on-ubuntu-20-04">Vultr Docs</a> (English)</li>
		<li>2025-04-04 <a href="https://www.liquidweb.com/blog/install-adminer-mysql-ubuntu/">Liquid Web</a> (English)</li>
		<li>2025-03-24 <a href="http://php.vrana.cz/adminer-5-1-0.php">Adminer 5.1.0 – autoloading pluginů - PHP triky</a> (Czech)</li>
		<li>2025-03-21 <a href="https://news.ycombinator.com/item?id=43386581">Hacker News</a> (English)</li>
		<li>2025-03-07 <a href="http://php.vrana.cz/adminer-5-0-0.php">Adminer 5.0.0 – jmenný prostor - PHP triky</a> (Czech)</li>
		<li>2025-01-05 <a href="https://www.cloudways.com/blog/adminer-vs-phpmyadmin/">Cloudways</a> (English)</li>
		<li>2022-08-11 <a href="https://www.techrepublic.com/article/deploy-adminer-database-ubuntu/">TechRepublic</a> (English)</li>
		<li>2022-08-02 <a href="https://www.howtoforge.com/how-to-install-adminer-database-administration-tool-on-ubuntu-22-04/">HowtoForge</a> (English)</li>
		<li>2022-08-01 <a href="https://www.tecmint.com/adminer-mysql-database-administration-linux/">Tecmint</a> (English)</li>
		<li>2022-05-30 <a href="https://news.ycombinator.com/item?id=31554753">Hacker News</a> (English)</li>
		<li>2021-01-18 <a href="https://kinsta.com/blog/adminer/">Kinsta</a> (English)</li>
		<li>2020-12-30 <a href="http://php.vrana.cz/users-of-adminer-3-7-1-and-older-might-have-been-hacked.php">Users of Adminer 3.7.1 and older might have been hacked - PHP triky</a> (English)</li>
		<li>2019-04-01 <a href="http://www.linux-magazine.com/Issues/2019/222/The-sys-admin-s-daily-grind-Adminer">Linux Magazine</a> (English)</li>
		<li>2012-04-19 <a href="https://www.linux.com/tutorials/manage-your-database-adminer/">Linux.com</a> (English)</li>
		<li>2012-03-19 <a href="https://sourceforge.net/blog/podcast-adminer/">SourceForge.net</a> (English)</li>
		<li>2010-01-12 <a href="https://zdrojak.cz/clanky/phpmyadmin-vs-adminer/">Zdroják</a> (Czech)</li>
		<li>2009-12-28 <a href="http://php.vrana.cz/architecture-of-adminer.php">Architecture of Adminer - PHP triky</a> (English)</li>
		<li>2009-08-27 <a href="http://www.phparch.com/magazine/2009-2/august/">php|arch</a> (English)</li>
		<li>2009-08-02 <a href="http://en.wikipedia.org/wiki/Adminer">Wikipedia</a> (English)</li>
		<li>2008-08-21 <a href="http://www.linux.com/archive/feature/145334">Linux.com</a> (English)</li>
		<li>2008-07-03 <a href="https://sourceforge.net/blog/cca08-finalists/">SourceForge.net</a> (English)</li>
		<li>2007-07-25 <a href="http://www.root.cz/zpravicky/phpminadmin-pohodlna-administrace-databaze/">Root.cz</a> (Czech)</li>
		<li>2007-07-25 <a href="http://php.vrana.cz/phpminadmin.php">phpMinAdmin – správa databáze v jednom souboru - PHP triky</a> (Czech)</li>
</ul>
<div class="more ref">
	<a href="/en/reference/">More&hellip;</a>
</div>

			<div id="footer">
				<p id="author">
					<a href="https://www.vrana.cz/">Jakub Vrána</a>
				</p>
				<p id="credits">
					Design: <a href="mailto:jan&#64;smitka.org">Jan Smitka</a>,
					<a href="https://github.com/legacy-icons/famfamfam-silk">Silk Icons</a>,
					Translation: <a href="https://php.vrana.cz/">Jakub Vrána</a>
				</p>
			</div>
		</div>
	</body>
</html>
