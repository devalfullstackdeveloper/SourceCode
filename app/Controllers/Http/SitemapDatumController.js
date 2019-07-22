'use strict'
const Sitemap = use('App/Models/Sitemap')
class SitemapDatumController {
    async renderXML({view,response}){
     

		const SitemapData = await Sitemap
							.query()
							.select('URL','updated_at','title')
                            .fetch()
        
    response.header('Content-type','application/xml')
		return view.render('sitemap',{SitemapData : SitemapData});
    }
    async renderMap({response}){

      		const SitemapData = await Sitemap
							.query()
							.select('id', 'title', 'description', 'URL', 'parentID','updated_at')
                            .fetch()
        // var Data = [];
         
        
        // SitemapData.rows.forEach(element => {
          
    
        //             Data.push({
        //                 key:   "data",
        //                 value: {
        //                     "id" : element.id,
        //                     "title" : element.title,
        //                     "description" : element.description,
        //                     "URL" : element.URL,
        //                     "parentID" : element.parentID,
        //                     "updated_at" : element.updated_at

        //                 }
        //             });
                   
         
            
        // });
        // var data = JSON.stringify(Data);
		return response.json({ success : true, message : SitemapData })

    }
}

module.exports = SitemapDatumController
