var express = require('express');
var router = express.Router();
var authQ= require('../queries/auth.js')
var bcrypt=require('bcrypt')
var randToken=require('rand-token')
var uuid = require('node-uuid');
var Users= require('../queries/users.js')
var nJwt = require('njwt');

var secretKey = process.env.SECRET_KEY || uuid.v4();
/* GET home page. */
router.post('/signup', function(req, res, next) {
  //validate first fyi
  console.log(req.body);
  console.log("this");
  authQ.userExists(req.body.username).then(function(match){
    console.log("2");
    if(match.rows.length===0){
      console.log("3");
      bcrypt.hash(req.body.password, 10, function(err, hash) {
        console.log("here");
        account=req.body.account_type
        if(account===3){
          //s
        }
        else if(account===1){
        account=2
        }
        authQ.createUser(req.body.username, hash, account, req.body.state).then(function(){
          authQ.getUserByName(req.body.username).then(function(user){
            res.send({token:authQ.genToken(user[0]),
              id:user[0].id,
              username:user[0].username,
              accountType:user[0].account_type,
              validated:user[0].validated,
              state:user[0].state

            });
          })
        })
     })
    }
    else{
      res.send({error:true, message:'username is taken'})
    }
  })
});
router.post('/login', function(req, res, nex){
  console.log(req.body);
  authQ.getUserByName(req.body.username).then(function(match){
    if(match.length===0){
      res.send({error:true, message:'no such user'});
    }
    else{
      if(bcrypt.compareSync(req.body.password, match[0].password)){
      res.send({token:authQ.genToken(match[0]),
            id:match[0].id,
            username:match[0].username,
            accountType:match[0].account_type,
            validated:match[0].validated,
            state:match[0].state
          })
      }
      else{
        res.send({error:true, message:'password doesnt match'})
      }

    }
  })
})
router.get('/ionic', function(req, res) {
  // request received from Ionic Auth
  console.log("in the router");
  var redirectUri = req.query.redirect_uri;
  var state = req.query.state;
  try {
    var incomingToken = nJwt.verify(req.query.token, secretKey);
    console.log(incomingToken);
    var username = incomingToken.body.data.username;
    var password = incomingToken.body.data.password;
    var user_id;
    console.log("no error, i guess");
    authQ.getUserByName(username).then(function(match){
      console.log("finished username fetch");
      if(match.length===0){
        res.send({error:true, message:'no such user'});
      }
      else{
        if(bcrypt.compareSync(password, match[0].password)){
          console.log('matched');
          // var outgoingToken = nJwt.sign({"user_id": user_id}, secretKey);
          Users.getFollowedForIonic(match[0].id).then(function(results){
            var claims = {
              user_id:match[0].id.toString(),
              sub: match[0].id,
              iss: 'bantaba-server',
              custom: {
                following_performers:results.performers.reduce(function(col, performer){
                  return col+performer.id+'.'
                }, '.'),
                following_events:results.events.reduce(function(col, event){
                  return col+event.id+'.'
                }, '.')
              },
              permissions: match[0].account_type
            }
            var outgoingToken = nJwt.create(claims,secretKey);
            console.log('did sign');
            var url = redirectUri +
              '&token=' + encodeURIComponent(outgoingToken) +
              '&state=' + encodeURIComponent(state)
              // TODO: Take out the redirect_uri parameter before production
              // '&redirect_uri=' + 'https://api.ionic.io/auth/integrations/custom/success';
            console.log(url);
            return res.redirect(url)
            console.log("passed redirect");
          })


        }
        else{
          res.send({error:true, message:'password doesnt match'})
        }

      }
    })

  } catch (ex) { // lots of stuff can go wrong while decoding the jwt
    console.log("some sort of errorrrrr......");
    console.error(ex.stack);
    return res.status(401).send('jwt error');
  }

  // TODO: Authenticate your own real users here

  // authentication failure


  // make the outgoing token, which is sent back to Ionic Auth

});
router.post('/getUser', function(req, res, next){
  if(req.body.token){
    try{
      var token=authQ.verifyToken(req.body.token)
      console.log(token);
      authQ.getUserById(token.body.sub).then(function(match){
        console.log(match);
          res.send({
            id:match[0].id,
            username:match[0].username,
            accountType:match[0].account_type,
            validated:match[0].validated,
            state:match[0].state
          })
      })


    }
    catch(e){
      console.log(e);
      res.send({error:true, message:'invalid token'})
    }
  }
  else{
    res.send({error:true, message:'not logged in'})
  }
})
function dateSplit(date){
  var res = date.split(' ')
  //5th space
  var res2 = '';
  for (var i = 0; i < 5; i++) {
    res2 += (' ' + res[i]);
    }
  return res2;
}
module.exports = router;
