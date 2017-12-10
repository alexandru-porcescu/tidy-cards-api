module.exports = function getOne(req, res) {
	var visibility  = require('../../../models/collection/visibility.json');
    var lifeStates  = require('../../../models/lifeStates.json');
    var models      = require('../../../models');
    var mongodbid   = require('../../../helpers/mongodbid');

	var rq = req.query;

    if(!mongodbid.isMongoId(req.params.collection_id))
        return res.render('404');

	var q = models.Collection.findById(req.params.collection_id);

	q.populate('_thumbnail');
    q.populate({
        path: '_author',
        populate: { path: '_avatar' }
    });

	q.exec(function(err, collection){
        if(err) {console.log(err); return res.render('500');}
        if(!collection) return res.render('404');

        var _authorId = collection._author._id ? collection._author._id : collection._author;

        // if collection deleted or private and current user is not the author
        if((collection.lifeState == lifeStates.ARCHIVED.id) ||  (collection.visibility == visibility.PRIVATE.id && (!req.user || String(req.user._id)!=_authorId))){        
            res.render('401');
        }else{
            res.render('collection/getOne', {
		        collection: collection,
		        env: process.env
		    });
        }
    })
}