module.exports = function getValidUsername (req, res) {

    var models      = require('../../models');
    var usernameValidator = require('../../helpers/user/usernameValidator');

    var rq = req.query;

    if(!rq.username){
        res.status(400).send({ error: 'some required parameters was not provided'});
        res.end();
    }else{
        if(!usernameValidator.isValid(rq.username)){
            return res.json({data: {isValid: false}});
        }

        var regex = new RegExp(["^", rq.username, "$"].join(""), "i");
        var filterObj = req.user ? {username: regex,  _id: { $ne: req.user._id }} : {username: regex};

        models.User.findOne(filterObj, function(err, user){
            if(err) {console.log(err); res.sendStatus(500); return;}
            if(user) return res.json({data: {isValid: false}});
            return res.json({data: {isValid: true}});
        })
    }

}
