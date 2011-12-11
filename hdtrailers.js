/**
 *  HD Trailers plugin for showtime version 0.1  by NP
 *
 * 	Change Log:

 *  Copyright (C) 2011 NP
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
(function(plugin) {


	var PREFIX = 'hdtrailers:';
	var HDTRAILERS = 'http://www.hd-trailers.net/';
	//settings 
	
	var service =
	plugin.createService("HD Trailers", PREFIX + "start", "tv", true,
			   plugin.path + "logo.png");
	
	var settings  = plugin.createSettings("HD Trailers",
					  plugin.path + "logo.png",
					 "HD Trailers");
	
	settings.createInfo("info",
			     plugin.path + "logo.png",
			     "HD-Trailers.net \nThis plugin was created for the sole purpose of allowing you to easily view HD (High Definition) movie trailers.\nBased on HD-Trailers.net"+
				 "Plugin developed by NP \n");
				 	
	
	settings.createBool("hd", "HD", false, function(v) {
	    service.hd = v;
	  });
	
	
	settings.createBool("fullhd", "Full HD", false, function(v) {
	    service.fullhd = v;
	  });

	//Store
	var bookmarks = plugin.createStore('bookmarks', true);
	if(!bookmarks.list)
		bookmarks.list = "[]";
		
	//http header fix
	plugin.addHTTPAuth("http:\/\/trailers\.apple\.com\/.*", function(authreq) {
	    authreq.setHeader("User-Agent", "QuickTime");
	  });

	function startPage(page) {      
	
		page.type = "directory";
		page.contents = "video";
		page.metadata.logo = plugin.path + "logo.png";
		
		var trailers = new XML(showtime.httpGet("http://feeds.hd-trailers.net/hd-trailers").toString());
		page.metadata.title = trailers.channel.lastBuildDate.toString()	;
		var url = false;
		
		for each (var item in trailers.channel.item) {
			 
			var metadata = {
			      title: item.title,
			      description: item.description,
			      year: item.pubDate,
			      icon: getValue(item.toString(), 'src="', '"')
			  };
			  
			if (service.fullhd == "1")
				url = getValue(item.toString(), '"', '"&gt;1080p&lt', 'endRef');
			else if (service.hd == "1")
				url = getValue(item.toString(), '"', '"&gt;720p&lt', 'endRef');
			else if (!url || url == '')
				url = getValue(item.toString(), '"', '"&gt;480p&lt', 'endRef');
			
			page.appendItem(url,"video", metadata); 
			url = false;  
		}
		
		page.appendItem(PREFIX + "list:page","directory", { title: "Latest" });
		page.appendItem(PREFIX + "list:topmovies","directory", { title: "Top 10" });
		page.appendItem(PREFIX + "list:openingthisweek","directory", { title: "Opening" });
		page.appendItem(PREFIX + "list:comingsoon","directory", { title: "Coming Soon" });
		page.appendItem(PREFIX + "letters","directory", { title: "A-Z" });

		if(bookmarks.list.length>5)
			page.appendItem( PREFIX + "bookmarks", "directory", {
				  title: "Bookmarks",
				      icon: plugin.path + "logo.png"
				      });

		page.loading = false;	
	}  


	plugin.addURI( PREFIX + "bookmarks", function(page){
		
		page.type = "directory";
		page.contents = "items";
		page.metadata.logo = plugin.path + "logo.png";
		page.metadata.title = 'Bookmarks';
		
		var temp = eval( '('+ bookmarks.list +')');
		for each (var item in temp)
			page.appendItem(PREFIX +"present:" + item.url , "video", item); 
		
		page.loading = false; 
	});


	plugin.addURI( PREFIX + "letters", function(page, category) {
		page.type = "directory";
	    page.contents = "items"; 
	    page.metadata.logo = plugin.path + "logo.png";

		var letter = ['0','A', "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V",  "W", "X", "Y", "Z" ];
		
		for each (var item in letter)
			page.appendItem( PREFIX + 'list:PosterLibrary/'+ item , "directory", { title: item });
					
		page.loading = false;	
	});

	
	plugin.addURI( PREFIX + "list:(.*)", function(page, category) {
		page.type = "directory";
	    page.contents = "items"; 
	    page.metadata.logo = plugin.path + "logo.png";
		
		var content = showtime.httpGet(HDTRAILERS + category).toString()
		page.metadata.title = getValue(content, '<title>', '</title>');
		var next = getValue(content, '"', '">Next &#8811', 'endRef');		
		content = getValue(content, '<table class="indexTable">', '</table>');
		content = content.split('<td class="indexTableTrailerImage">');
		for each (var film in content)
			if(getValue(film, 'title="', '"') != '')
				page.appendItem( PREFIX + 'present:'+ getValue(film, 'href="','"'), "video", 
							{ title:  getValue(film, 'title="', '"'),
							  icon:	getValue(film, 'src="', '"')});

		if(next != '')
			page.appendItem( PREFIX + 'list:'+ next , "directory", { title:  'Next' });
			
		page.loading = false;	
	});


	plugin.addURI( PREFIX + "listsources:(.*)", function(page, category) {
		page.type = "directory";
	    page.contents = "videos"; 
	    page.metadata.logo = plugin.path + "logo.png";
		
		var content = showtime.httpGet(HDTRAILERS + category).toString()
		page.metadata.title = getValue(content, '<title>', '</title>');
		content = getValue(content, '<table class="bottomTable">', '</table>');
		content = content.split('<td class="bottomTableDate" rowspan="2">');
		var url = '';
		for each (var film in content){
			if (service.fullhd == "1")
				url = getValue(film, '"', '" rel="lightbox[res1080p', 'endRef');
			else if (service.hd == "1")
				url = getValue(film, '"', '" rel="lightbox[res720p', 'endRef');
			else if (!url || url == '')
				url = getValue(film, '"', '" rel="lightbox[res480p', 'endRef');

			if( url != '')
				page.appendItem(url, "video", { title:  getValue(film, 'itemprop="name">', '<')});
			url = ''
		}
			
		page.loading = false;	
	});


	plugin.addURI( PREFIX + "present:(.*)", function(page, category) {
	    page.metadata.logo = plugin.path + "logo.png";	
		var content = showtime.httpGet(HDTRAILERS + category).toString()
		var title = getValue(content, '<title>', '</title>');
		page.metadata.title = title;
		
		var icon = getValue(content, '<meta property="og:image" content="', '"');
		page.metadata.icon = icon;
		page.appendPassiveItem("bodytext", new showtime.RichText(getValue(content, '<meta name="description" content="', '"')));
		
		page.appendAction("navopen", getValue(content, '"', '" class="playLatest"', 'endRef'), true, {
					title: "Play Latest"
					});
		
		page.appendAction("navopen", PREFIX + 'listsources:' + category, true, {
					title: "List Trailers"
					});
		
		if(!bookmarked(title))
			var bookmakrButton = page.appendAction("pageevent", "bookmark", true,{ title: "Bookmark" });
		else		
			var bookmakrButton = page.appendAction("pageevent", "bookmark_remove", true,{ title: "Remove Bookmark" });
		
		page.type = "item";	
		page.loading = false;
		
		page.onEvent('bookmark', function(){				
							if(!bookmarked(title)){
								bookmark(category, title, icon)
								showtime.message('Bookmarked: '+ title, true, false);
							}else
								showtime.message('Already Bookmarked: '+ title, true, false);
					});

		page.onEvent('bookmark_remove', function(){ 
							if(!bookmarked(title)){
								showtime.message(title +' Not bookmarked ', true, false);
							}else{
								bookmark_remove(title);
								showtime.message(title + ' bookmark removed' , true, false);
							}
					});
	
	});


	//BookMarks
	
	function mark(url, title, icon){
		this.url = url;
		this.title = title;
		this.icon = icon;
	}
	
	function bookmark(url, title, icon){	
		var temp = eval( '('+ bookmarks.list +')');
		temp.push(new mark(url, title, icon));
		bookmarks.list = showtime.JSONEncode(temp);
	}
	
	function bookmark_remove(title){
		
		var start = bookmarks.list.lastIndexOf('{',bookmarks.list.indexOf(title));
		var offSet = 1;
		if(start<2)
			offSet=0;
		bookmarks.list = bookmarks.list.slice(0,start-offSet) + bookmarks.list.slice(bookmarks.list.indexOf('}',bookmarks.list.indexOf(title))+2-offSet,bookmarks.list.length);
		if(bookmarks.list.indexOf(']') ==-1)
			bookmarks.list= '[]';
	}
	function bookmarked(title){
		
		if(bookmarks.list.indexOf(title) !=-1)
			return true;
		else
			return false; 
	
	}
	

	function getValue(text, start_string, end_string, start, start_offset , end_offset)
	{
	
		if(start == null)
			start = 'start';
			
		if(start_offset == null)
			start_offset = 0;		
		if(start_offset == 'all')
			start_offset = -start_string.length;
		
		if(end_offset == null)
			end_offset = 0;
		
		switch(start){
			case 'start':
				if (text.indexOf(start_string)!=-1 && 
					text.indexOf(end_string, text.indexOf(start_string) + start_string.length)!=-1) {
					var begin_temp = text.indexOf(start_string) + start_string.toString().length + start_offset;
					var end_temp = text.indexOf(end_string, begin_temp) + end_offset;				
					return text.slice(begin_temp, end_temp);
				}
				break;
			
			case 'end':
				if (text.indexOf(start_string)!=-1 && 
					text.indexOf(end_string, text.lastIndexOf(start_string) + start_string.length)!=-1) {
					var begin_temp = text.lastIndexOf(start_string) + start_string.length + start_offset;
					var end_temp = text.indexOf(end_string, begin_temp) + end_offset;				
					return text.slice(begin_temp, end_temp);
				}
				break;
			
			case 'endRef':
				if (text.indexOf(start_string)!=-1 && 
					text.indexOf(end_string)!=-1) {
					var end_temp = text.lastIndexOf(end_string) -1 + end_offset;				
					var begin_temp = text.lastIndexOf(start_string, end_temp) + start_string.length + start_offset;
					return text.slice(begin_temp, end_temp +1);
				}
				break;
			
			default:
				break;	
		}
		showtime.trace('Get Value error!');
		return '';
	}

plugin.addURI( PREFIX + "start", startPage);
})(this);
	
