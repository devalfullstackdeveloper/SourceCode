'use strict'

const Sitemap = use('App/Models/Sitemap')
const { validate } = use('Validator')

class SitemapController {


    async index({request, view}){

		const page = (request.get().page !== undefined) ? request.get().page : 1 
         var tempTitle;
		const SitemapData = await Sitemap
							.query()
							.select('id', 'title', 'description', 'URL', 'parentID')
                            .paginate(page)
                            
  
       
		return view.render('admin.Sitemap.list', {SitemapData : SitemapData})

    }
    async showNew({view}){
        const SitemapData = await Sitemap
							.query()
                            .select('id', 'title')
                            .fetch()

	
		return view.render('admin.Sitemap.new_form', {SitemapData : SitemapData})
    }
    async addNew({request, response, view, session}){

		const rules = {
            parent : 'required',
			title : 'required',
            Description : 'required', 
			URL : 'required'
		}

		const messages = {
			'title.required' 			: 'Title is required',
            'Description.required' 		: 'Description is required',
            'parent.required' 			: 'Parent is required',
            'URL.required' 			    : 'URL is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.Sitemap.new')
		}
       
        var count = await Sitemap
        .query()
        .where('title', request.body.title)
         .count('* as total')  
         var total = count[0].total
         if(total != 0)
         {
             
            session.flash({ success : 'Title Already Exists.' })
            return response.route('admin.Sitemap.new')
         }

          count = await Sitemap
         .query()
         .where('description', request.body.Description)
          .count('* as total')  
           total = count[0].total
          if(total != 0)
          {
              
             session.flash({ success : 'Description Already Exists.' })
             return response.route('admin.Sitemap.new')
          }

           count = await Sitemap
          .query()
          .where('URL', request.body.URL)
           .count('* as total')  
            total = count[0].total
           if(total != 0)
           {
               
              session.flash({ success : 'URL Already Exists.' })
              return response.route('admin.Sitemap.new')
           }

		const data = new Sitemap()
        var titleData = request.body.title
        var result = "";
    

        for (let i = 0; i < titleData.length; i++) {
           
            if (titleData[i] == ' ') {
                result=result+'-'
            }
            else
            {
           result=result+titleData[i]
            }
           
        }
         


        data.parentID = request.body.parent
		data.title = result
        data.description = request.body.Description
        data.URL = request.body.URL
	

		await data.save()

		session.flash({ success : 'URL has been added successfully.' })

		return response.route('admin.Sitemap.new')
		
    }
    async remove({request, response}){


     
       var arr = [];
       var deleteRow;
       var child;
       arr.push( request.get().id);
        for (let i = 0; i < arr.length; i++) {
             deleteRow = await Sitemap
            .query()
            .where('id', arr[i])
            .delete()

             child = await Sitemap
            .query()
            .select('id')
            .where('parentID', arr[i])
            .fetch()

            child.rows.forEach(element => {
                arr.push(element.id);
            });



            
        }
		

		return response.json({ success : true, message : 'URL will be removed with all its child URLs' })

    }

    async showEdit({params, response, view}){

        const SitemapData = await Sitemap.find(params.id)
      
        
        const currentParent = await Sitemap
                            .query()
                            .select('parentID')
                            .where('id', params.id)
                            .fetch()
    const parentID = currentParent.rows[0].parentID;
    console.log(parentID);
    const allData = await Sitemap
							.query()
                            .select('id', 'title')
                            .fetch()
        
  

		return view.render('admin.Sitemap.edit_form', {SitemapData : SitemapData, parentID : parentID, allData : allData})

    }


    async edit({params, request, response, view, session}){

		
		const rules = {
            parent : 'required',
			title : 'required',
            Description : 'required', 
			URL : 'required'
		}

		const messages = {
			'title.required' 			: 'Title is required',
            'Description.required' 		: 'Description is required',
            'parent.required' 			: 'Parent is required',
            'URL.required' 			    : 'URL is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

                return response.route('admin.Sitemap.edit', { id : params.id })
		}
		const SitemapData = await Sitemap.find(params.id)


        
        
        SitemapData.parentID = request.body.parent
		SitemapData.title = request.body.title
        SitemapData.description = request.body.Description
		SitemapData.URL = request.body.URL

		await SitemapData.save()

		//session.flash({ success : 'URL has been edited successfully.' })

		return response.route('admin.sitemap')
		
    }

}

module.exports = SitemapController
