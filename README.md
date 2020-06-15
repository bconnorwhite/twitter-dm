### Credentials

A credentials.json file is required with Twitter API keys:

```json
{
  "consumer_key": "XXXXXXXXXXXXXXXXXXXXXXXX",
  "consumer_secret": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "access_token": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "access_token_secret": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

### Usage

Build:

`yarn run build`

Start:

`yarn run start`

This opens a wizard with the following options:

(user limit maximum based on total account followers)

```
? Message: Test
? User limit (max 1): 1
```

![dm screenshot](https://github.com/bconnorwhite/twitter-dm/blob/master/assets/dm-screenshot.png?raw=true)
