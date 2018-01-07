# Violet

# Development

## Setup

[Create a Yahoo App](https://developer.yahoo.com/apps/create/) with read
permissions for Fantasy Sports. For local development, I use the basic package
from [ngrok](https://ngrok.com/), but you can also [mess around with host
files](https://yahoodevelopers.tumblr.com/post/105969451213/implementing-yahoo-oauth2-authentication).
Next,

    $ cp config.json.example config.json

And fill in the missing info. To install packages, do

    $ yarn install

## Run

Run

    $ yarn start

and you'll see everything running at [localhost:3000](http://localhost:3000/).
If you need to run ngrok, don't forget to run that in a separate shell.

- [ngrok docs](https://ngrok.com/docs#http)

# License

See LICENSE for details.
