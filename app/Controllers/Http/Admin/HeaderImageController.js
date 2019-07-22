'use strict'

const HeaderImage = use('App/Models/HeaderImage')
const { validate } = use('Validator')
class HeaderImageController {

async headerImageNew({view}){
    return view.render('admin.headerImages.new_form')
}


async detail({request, response,session,view}){
    
    if(request.get().id<1)
    {
      
        return response.json({ success : false, message : 'Please select module name.' })
    }

    var headerImage =  await HeaderImage.query().where('page_type',request.get().id).first()
  

    if( ! headerImage ){
        return response.json({ success : false, message : 'Invalid Type.' })
    }
  
    return response.json({ success : true, data:headerImage})
}


async addNew({request, response, view, session}){

    const _pageType=request.body.pageType;
    const _alt_tag = request.body.alt_tag;
    if(!request.file('image')){
        session.flash({ error : 'Please choose image.' })
        return response.route('admin.headerimage.new')
    }

    const image = request.file('image', {
        types: ['image'],
        size: '2mb'
    })

    const newName = new Date().getTime() + '.' + image.subtype

    await image.move('public/images/headerimages', {
        name: newName,
        overwrite: true
    })

    if (!image.moved()) {
        session.flash({ error : image.error() })
        return response.route('admin.headerimage.new')
    }
    var headerImage =  await HeaderImage.query().where('page_type',_pageType).first()
    if( ! headerImage ){
          headerImage=new HeaderImage();
    }
    else
    {
        
  // await image.unlink('public/images/headerImages/'+headerImage.image)
    }

    headerImage.page_type = _pageType
    headerImage.image = newName
    headerImage.alt_tag = _alt_tag
    await headerImage.save()

    session.flash({ success : 'Header Image has been updated successfully.' })

    return response.route('admin.headerimage.new')
    
}
}

module.exports = HeaderImageController