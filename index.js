var nconf = require("nconf");
var passport = require("koa-passport");
var path = require("path");
var render = require("koa-ejs");
var request = require("request");
var session = require("koa-session");

var Koa = require("koa");
var OAuth2Strategy = require("passport-oauth2");
var Router = require("koa-router");
var YahooFantasy = require("yahoo-fantasy");

var app = new Koa();
var router = new Router();

// sessions
app.keys = ['secret']
app.use(session({}, app))

nconf.argv()
  .env()
  .file({ file: "config.json" })

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(
  new OAuth2Strategy({
    authorizationURL: "https://api.login.yahoo.com/oauth2/request_auth",
    tokenURL: "https://api.login.yahoo.com/oauth2/get_token",
    clientID: nconf.get("yapi:clientId"),
    clientSecret: nconf.get("yapi:clientSecret"),
    callbackURL: nconf.get("appHost") + "/auth/yahoo/callback"
  }, function (accessToken, refreshToken, params, profile, done) {
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
 render(app, {
  root: path.join(__dirname, "views"),
  layout: "template",
  viewExt: "ejs",
  cache: false,
  debug: false,
});

router
  .get("/logout", async function (ctx, next) {
    if (ctx.isAuthenticated()) {
      ctx.logout();
      ctx.redirect("/");
    } else {
      ctx.body = { success: false };
      ctx.throw(401);
    }
  })
  .get("/auth/yahoo", function (ctx, next) {
    passport.authenticate("oauth2")(ctx);
  })
  .get("/auth/yahoo/callback", function (ctx, next) {
    return passport.authenticate("oauth2", {
      successRedirect: '/',
      failureRedirect: '/'
    })(ctx);
  })
  .get("/", async function (ctx, next) {
    await ctx.render("index", { authenticated: ctx.isAuthenticated() });
  });

app.use(router.routes());
app.use(router.allowedMethods());

// if a user has logged in (not required for all endpoints)
// yf.setUserToken(
//   Y!CLIENT_TOKEN,
//   Y!CLIENT_SECRET
// );

// query a resource/subresource
// app.yf.league.teams(
//   nconf.get("leagueKeys:2014"),
//   function (err, data) {
//     if (err)
//       console.log(err);

//     console.log(data);
//   }
// );

app.listen(3000, function () {
  console.log("listening on port 3000");
});
