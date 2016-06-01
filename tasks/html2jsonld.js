var path = require('path');
var cheerio = require('cheerio');

module.exports = (grunt) => {

  grunt.registerMultiTask('html2json', 'Scrapes html files and converts them to json', function () { 
    var options = this.options();
    var done = this.async();
    var files = this.files.slice();
    
    if(files.length <= 0)
      throw new Error('no HTML files found');
      
    traverseFiles();

    function traverseFiles() {
      if (files.length <= 0) {
        done();
        return;
      }

      var file = files.pop();
      htmlToJson(file, options);
      traverseFiles();
    }
  });
  
  function htmlToJson(file, options)
  {
     $ = getHtml(file.src[0]);
     $ = removeContent($, options.exclude);
     var title = generateTitle(options.title);
     var body = $(options.selector);
     if(body.length > 0) {
       body = getHotLoadedContent($, body, file.orig.cwd, options.selector);
       var json = generateJSON(options.url + path.basename(file.src[0]) + (options.anchor ? options.selector : ""), body);
       writeJSON(file.dest + (options.anchor ? options.selector.replace("#", "_") : ""), json);
    }
  }
  
  function getHtml(path)
  {
    return cheerio.load(grunt.file.read(path), {
	     withDomLvl1: true,
	     normalizeWhitespace: true,
	     xmlMode: true,
	     decodeEntities: true
	   });
  }
 
  function isSelector(string){
    return string[0] == '.' || string[0] == '#';
  }
  
  function generateTitle(title)
  {
    this.title = []; 
    for(var i = 0; i < title.length; i++){
       if(isSelector(title[i])) 
         this.title.push($(title[i]).text())
       else
         this.title.push(title[i])
    }
    
    return this.title;
  }

  function getHotLoadedContent($, body, cwd, selector)
  {
     var hotLoadedContent = body.find("[data-action=load]");
     hotLoadedContent.each(function() {
        var html = getHtml(path.dirname(cwd) + $(this).attr('href').replace(selector, ''));
        body.find($(this).attr('data-target')).append(html($(this).attr('data-filter')).text());
     });
     hotLoadedContent.remove();
  
     return body;
  }
  
  function generateJSON(link, body)
  {
    return { "@graph": [{hasSearchLabel: title.join(""), hasSearchLink: {"@id":link}, body: body.text().trim()}]};
  }
  
  function writeJSON(path, json)
  {
    grunt.file.write(path + '.json', JSON.stringify(json));
  }
  
  function removeContent($, exclude)
  {
    for(var i = 0; i < exclude.length; i++){
      $(exclude[i]).remove();
    }   
    
    return $;
  }
};
