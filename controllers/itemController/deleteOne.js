var logger          = require('../../tools/winston');
var lifeStates      = require('../../models/lifeStates.json');
var sortTypes       = require('../../models/customSort/sortTypes.json');
var itemTypes       = require('../../models/item/itemTypes.json');
var m               = require('../../models');
var collectionController = require('../collectionController');

/**
 * Delete an item and decrement the attribute itemsCount of the related collection.
 */
module.exports = function deleteOne(currentUser, itemId, callback){
    m.Item.findById(itemId).populate('_collection').exec(function(err, item){
        if(err) {logger.error(err); return callback(new m.ApiResponse(err, 500))}
        if(!item) {return callback(new m.ApiResponse("cannot find item with id: "+req.params.item_id, 400));}
        if(item._collection._author!=currentUser._id) {return callback(new m.ApiResponse("only the author of the collection can remove item", 401));}
        if(item.lifeState == lifeStates.ARCHIVED.id) return callback(new m.ApiResponse(null, 200));
        
        checkIfCollectionType(currentUser, item, function(err){
            if(err) {logger.error(err); return callback(new m.ApiResponse(err, 500));}

            item.lifeState = lifeStates.ARCHIVED.id;

            item.save(function(err){
                if(err) {logger.error(err); return callback(new m.ApiResponse(err, 500));}
                removeItemFromCustomSort(item, callback);
            });

            m.Collection.findById(item._collection, function(err, collection){
                if(err) logger.error(err);
                collection.itemsCount--;
                collection.save();
            })

        })
    });
}

/**
 * Check if the item have COLLECTION as type, if yes then delete the related collection.
 */
function checkIfCollectionType(currentUser, item, callback){
    if(item.type == itemTypes.COLLECTION.id){
        collectionController.deleteOne(currentUser, item._content, function(apiResponse){
            callback(apiResponse.err);
        })
    }else{
        callback(null);
    }
}

/**
 * Retrieve the customSort object related to collection that contain the item passed
 * as parameter. Then remove the itemId from the list of ids.
 */
function removeItemFromCustomSort(item, callback){
    m.CustomSort.findOne({ _collection: item._collection._id, type: sortTypes.COLLECTION_ITEMS.id}, function(err, customSort){
        if (err) {logger.error(err); return callback(new m.ApiResponse(err, 500));}
        m.CustomSort.update({ _id: customSort._id},{ $pull: { ids: item._id } }, function(err, result){
            if (err) {logger.error(err); return callback(new m.ApiResponse(err, 500));}
            return callback(new m.ApiResponse(null, 200, item));
        })
    })
}
