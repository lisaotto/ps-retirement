(function($){

var win = $(window),
	body = $('body'),
	headerContainer = $('header'),
	header = $('#header'),
	tab = $('.tab');

var siteURLs = [
	'lisaot.to',
	'localhost',
	'grad.lisaot.to',
	'staging.lisaot.to'
];

// scroll to the content...
// different for mobile
function scrollToContent(e, amount, time) {
	if (e) e.preventDefault();

	var top = amount || $('#content').offset().top,
		el = navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/) ? body : $('html, body');
	el.animate({
		scrollTop: top
	}, time || 500);
}

function headerThings() {
	headerContainer.height( win.height() );
}
headerThings();
win.resize( headerThings );

function toggle() {
	$( this.getAttribute('data-toggle') ).toggleClass( this.getAttribute('data-toggle-class') );
	promptScrollOff();
}
body.on('click', '[data-toggle]', toggle);

function toggleGridOverlay() {
	var overlay = $('.gridoverlay');
	overlay.animate({
		opacity: overlay.css('opacity') === '0' ? 1 : 0
	});

	var $this = $(this);
	$this.text( $this.text() === 'VIEW GRID' ? 'HIDE GRID' : 'VIEW GRID' );
}
body.on('click', '.gridbutton', toggleGridOverlay);

// scroll "back up"
body.on('click', '.backup .title', scrollToContent);

// Scroll down for more button
function promptScrollOn() {
	$('.scroll').addClass('prompting');
}

function promptScrollOff() {
	$('.scroll').removeClass('prompting');
}

function decideWhenToPrompt() {
	var url = location.href;
	url = url.split('/');
	for ( var i = 0; i < url.length; i++ ) {
		if ( url[i] === 'project' ) {
			setTimeout(promptScrollOn, 2500);
			return;
		}
	}
}

body.on('click', '.scroll', function(e) {
	promptScrollOff();
	scrollToContent( e, win.height() * 0.75 );
});

decideWhenToPrompt();
win.scroll(promptScrollOff);

// Return booleans for home page, about page, and just having been on a project page
function isHome() {
	return location.href === 'http://localhost/portfolio/' || location.pathname === '/';
}
function isAbout() {
	return location.href === 'http://localhost/portfolio/about/' || location.href === 'http://localhost/portfolio/about' || location.pathname === '/about/' || location.pathname === '/about';
}
function is404() {
	return $('.error').length > 0;
}
function comingFromInternal() {
	var referrer = document.referrer || loadedFromPage,
	 	internal;
	siteURLs.forEach(function(url) {
		if ( referrer.indexOf(url) >= 0 ) return internal = true;
	});
	return internal ? true : false;
}

// click on the work link: if on the work page, should scroll to where the content starts
function scrollToWork(e) {
	e.preventDefault();
	if ( isHome() ) {
		scrollToContent();
	}
}

$('#work-link').click(scrollToWork);

// Smooth AJAX loading!
function loadElements(data) {

	if ( loadedFromElement.closest('#content').length > 0 ) {
		loadedFromElement.fadeOut();
	}

	promptScrollOff();

	// time delay
	var delay = 500;

	// Fade out and remove current project elements
	var curContent = $('#content');

	curContent.height( curContent.height() );
	curContent.find('*').fadeOut(delay);

	// Animate back to the top of the content and remove old elements
	setTimeout(function(){
		if (win.width() > 960) {
			scrollToContent(null, null, 1);
		} else {
			if ( comingFromInternal() && (isHome() || isAbout()) ) {
				scrollToContent(null, null);
			}
		}
		curContent.find('*').remove();
	}, delay + 5);

	var $data = $(data),
		url,
		title,
		newContent;

	var newBody = data.slice(data.indexOf('<body'));
	newBody = newBody.slice(0, newBody.indexOf('>') + 1);
	var newBodyClass = newBody.slice(newBody.indexOf('class="') + 7);
	newBodyClass = newBodyClass.slice(0, newBodyClass.indexOf('"'));
	var newBodyScroll = newBody.slice(newBody.indexOf('data-scroll="') + 13);
	newBodyScroll = newBodyScroll.slice(0, newBodyScroll.indexOf('"'));

	body.attr('class', newBodyClass);
	body.attr('data-scroll', newBodyScroll);

	for ( var i = 0; i < $data.length; i++ ) {
		var el = $data[i];

		if (el.tagName === 'HEADER') url = $(el).find('#page-url').html();
		if (el.tagName === 'TITLE') title = el.innerHTML;
		if (el.id === 'content') newContent = $(el);
	}

	if ( !!history ) {
		window.history.pushState({}, title, url);
		document.title = title;
	}

	decideWhenToPrompt();

	var newElements = newContent.children(),
		projectSamples = newContent.find('.project-sample'),
		newReadyElements = newContent.find('.navigation, .intro'),
		banner = newContent.find('.banner'),
		newScrollingElements = newElements.not('.banner, .navigation, .intro').find('img, p').not('.icon-arrow-box');

	banner.children().addClass('fader faded');
	projectSamples.addClass('fader faded');
	newReadyElements.addClass('fader faded');
	newScrollingElements.addClass('fader faded');

	setTimeout(function(){

		newElements.appendTo(curContent);

		setTimeout(function(){
			banner.find('.hgroup').removeClass('faded');
			newReadyElements.removeClass('faded');
		}, 100);

		banner.imagesLoaded()
			.done(function(){
				banner.children().removeClass('faded');
			});

		projectSamples.each(function(){
			var $this = $(this);
			setTimeout(function(){
				$this.removeClass('faded');
			}, $this.index() * delay / 2);
		});

		if ( isAbout() ) newElements.find('.faded').removeClass('faded');

		centerPageContent();
		curContent.height('auto');

	}, delay + 10);

	win.scroll(function() {
		newScrollingElements.each(function(){
			var $this = $(this);
			if ( win.scrollTop() + win.height() > $this.offset().top + 50 ) {
				// Three columns in a row (or two columns)
				if ( $this.hasClass('onecolumn') && $this.prev('.onecolumn').length > 0 && $this.next('.onecolumn.last').length > 0 || $this.hasClass('halfcolumn') && $this.hasClass('last')) {
					setTimeout(function(){
						$this.removeClass('faded');
					}, 150);
				} else if ( $this.hasClass('last') && $this.prev('.onecolumn').length > 0) {
					setTimeout(function(){
						$this.removeClass('faded');
					}, 300);

				} else {
					$this.removeClass('faded');
				}
			}
		});
	});

	// send a pageview
	ga('send', 'pageview');
}

var loadedFromPage,
	loadedFromElement;
function loadPage(e) {
	if (e) e.preventDefault();

	loadedFromElement = $(this);
	loadedFromPage = location.href;

	var url = this.href;

	// update nav highlighting
	var aboutLink = $('#about-link'),
		workLink = $('#work-link');

	if ( loadedFromElement.closest('#about-link').length === 1 ) {
		workLink.find('p').removeClass('blue');
		workLink.find('span').remove();
		aboutLink.find('p').addClass('blue');
	} else {
		workLink.find('p').addClass('blue');
		if ( workLink.find('span').length === 0 ) {
			workLink.append('<span class="icon-arrow blue">');
		}
		aboutLink.find('p').removeClass('blue');
	}

	if ( url !== location.href && url + '/' !== location.href) {
		$.ajax({
			url: url,
			success: loadElements
		});
	}
}
if ( !$('html').hasClass('oldie')) {
	body.on('click', '.navigation .next, .project-sample, .back, nav a', loadPage);
}

function shouldWeCenter() {
	return body.attr('data-scroll') === 'false';
}

function centerPageContent() {
	if ( shouldWeCenter() ) {
		var content = $('#content'),
			vcenter = $('.vcenter');
        content.height('auto');
        if ( win.height() > content.height() ) {
            content.height(win.height());
			setTimeout(function(){
				content.height(win.height());
			}, 1);
        }
        if (content.height() > vcenter.height() + 2 * Math.round(parseInt( vcenter.parent().css('margin-top'), 10))) {
            vcenter.css({
                top: (content.height() - vcenter.height() - 2 * parseInt( vcenter.parent().css('margin-top'), 10)) / 2
            });
        } else {
            vcenter.css({ top: 0 });
        }
    }
}
centerPageContent();
win.on('load resize', centerPageContent);

}(jQuery));
