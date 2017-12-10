module.exports = function getMultiple (req, res) {

    var isGranted   = require('../../security/isGranted');
    var models      = require('../../models');
    var algoliaClient = require('../../tools/algolia/algolia')
    var algoliaUserIndex = algoliaClient.initIndex('ts_'+process.env.ALGOLIA_INDEX_PREFIX+'_user');
    var lifeStates  = require('../../models/lifeStates.json');

    var rq = req.query;

    getQueryFiler(rq, req, function(filterObj){
        var q = models.User.find(filterObj).sort({'createdAt': 1}).limit(20);

        if(!(rq.allStates && req.user && req.user.isGranted('ROLE_ADMIN')))
            q.where('lifeState').equals(lifeStates.ACTIVE.id);
         
        if(rq.populate){
            q.populate(rq.populate);
        }

        if(rq.skip)
            q.skip(parseInt(rq.skip));

        if(rq.limit)
            q.limit(parseInt(rq.limit));

        if(rq.sort_field && rq.sort_dir && (parseInt(rq.sort_dir)==1 || parseInt(rq.sort_dir)==-1)){
            var sortObj = {};
            sortObj[rq.sort_field] = rq.sort_dir;
            q.sort(sortObj);
        }

        q.exec(function(err, users){
            if (err) {console.log(err); res.sendStatus(500); return;}
            res.json({data: users});
        });
    })

    function getQueryFiler(rq, req, callback){
        var filterObj = {};

        if(rq.search){
            algoliaGetUserIds(decodeURIComponent(rq.search), function(ids){                
                filterObj._id = { '$in': ids }; 
                callback(filterObj);  
            })
        }else{
            callback(filterObj);    
        }

    }


    function algoliaGetUserIds(searchQuery, callback){
        algoliaUserIndex.search(
        {
            query: searchQuery,
            attributesToRetrieve: ['objectID'],
            hitsPerPage: 20,
        },
        function searchDone(err, content) {
            if (err) {
              console.error(err);
              callback([]);
            }
            var usersIds = [];
            for (var h in content.hits) {
                usersIds.push(content.hits[h].objectID)
            }
            callback(usersIds);
        });
    }
}
