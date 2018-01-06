var nconf = require("nconf");
var passport = require("koa-passport");
var request = require("request");
var route = require("koa-route");

var Koa = require("koa");
var OAuth2Strategy = require("passport-oauth2");
var YahooFantasy = require("yahoo-fantasy");

var app = new Koa();

nconf.argv()
  .env()
  .file({ file: "config.json" })

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(
  new OAuth2Strategy({
    authorizationURL: "https://api.login.yahoo.com/oauth2/request_auth",
    tokenURL: "https://api.login.yahoo.com/oauth2/get_token",
    clientID: nconf.get("yapi:clientId"),
    clientSecret: nconf.get("yapi:clientSecret"),
    callbackURL: nconf.get("appHost") + "/auth/yahoo/callback"
  }, function(accessToken, refreshToken, params, profile, done) {
    var options = {
      url: "https://social.yahooapis.com/v1/user/" + params.xoauth_yahoo_guid + "/profile?format=json",
      method: "get",
      json: true,
      auth: {
        "bearer": accessToken
      }
    };

    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var userObj = {
          id: body.profile.guiid,
          name: body.profile.nickname,
          avatar: body.profile.image.imageUrl,
          accessToken: accessToken,
          refreshToken: refreshToken
        };

        app.yf.setUserToken(accessToken);

        return done(null, userObj);
      }
    });
  })
);

// you can get an application key/secret by creating a new application on Yahoo!
app.yf = new YahooFantasy(
  nconf.get("yapi:clientId"),
  nconf.get("yapi:clientSecret")
);


app.use(passport.initialize());
app.use(passport.session());

// routes

app.use(route.get("/auth/yahoo", passport.authenticate("oauth2")));

app.use(route.get("/auth/yahoo/callback",
  passport.authenticate("oauth2", {
    failureRedirect: "/login",
    successRedirect: "/"
  })
));

app.use(route.get("/logout", function(req, res) {
  req.logout();
}));

// if a user has logged in (not required for all endpoints)
// yf.setUserToken(
//   Y!CLIENT_TOKEN,
//   Y!CLIENT_SECRET
// );

// query a resource/subresource
// app.yf.league.teams(
//   nconf.get("leagueKeys:2014"),
//   function(err, data) {
//     if (err)
//       console.log(err);

//     console.log(data);
//   }
// );

app.listen(3000, function() {
  console.log("listening on port 3000");
});
