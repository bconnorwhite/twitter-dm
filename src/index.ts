import { writeFile, readFile, existsSync } from "fs";
import { prompt } from "inquirer";
import Twit from "twit";
import { CronJob } from "cron";
import { getFollowers } from "./followers";
import { sendMessage } from "./messages";

import credentials from "../credentials.json";

const client = new Twit(credentials);

export type Args = {
  message: string;
  screen_name: string;
  limit: number;
};

export type RateLimit = {
  remaining: string;
  reset: string;
}

type State = {
  followers: {
    cursor: string;
    data: {
      ids: string[];
    }
  };
  messages: {
    index: number;
  }
}

client.get("account/settings", (error, account) => {
  if(error) throw error;
  client.get('users/lookup', {
    screen_name: (account as { screen_name: string })["screen_name"]
  }, (error, users) => {
    if(error) throw error;
    const followers_count = (users as { followers_count: number }[])[0]["followers_count"];
    prompt([{
      type: "input",
      name: "message",
      message: "Message:"
    }, {
      type: "input",
      name: "limit",
      message: `User limit (max ${followers_count}):`,
      filter: (limit: string) => {
        if(isNaN(parseInt(limit))) {
          return limit;
        } else {
          return parseInt(limit) > followers_count ? followers_count : parseInt(limit);
        }
      },
      transformer: (limit: string) => {
        if(isNaN(parseInt(limit))) {
          return limit;
        } else {
          return parseInt(limit) > followers_count ? followers_count : parseInt(limit);
        }
      },
      validate: (limit: string) => {
        return !isNaN(parseInt(limit)) ? true : "Error: limit must be an integer.";
      }
    }]).then(({ message, limit }) => {
      load({
        screen_name: (account as { screen_name: string })["screen_name"],
        limit: limit,
        message
      });
    });
  });
});

function load(args: Args) {
  let state: State = {
    followers: {
      cursor: "-1",
      data: {
        ids: []
      }
    },
    messages: {
      index: 0
    }
  };
  if(existsSync(`output/${args.screen_name}.json`)) {
    readFile(`output/${args.screen_name}.json`, { encoding: "utf-8" }, (err, data) => {
      if(err) throw err;
      state = JSON.parse(data);
    });
  }
  batch(args, state);
}

async function batch(args: Args, state: State) {
  if(state.followers.cursor !== "0" && args.limit > state.followers.data.ids.length) {
    const { ids, cursor, rate_limit_reset } = await getFollowers(client, args, state.followers.cursor);
    state.followers.cursor = cursor;
    (state.followers.data.ids as string[]) = ids;
    save(args, state, () => {
      if(rate_limit_reset) {
        let date = new Date(rate_limit_reset);
        console.log(date.toString(), rate_limit_reset);
        const job = new CronJob(date, () => {
          batch(args, state);
        });
        job.start();
      } else {
        batch(args, state);
      } 
    });
  } else if(state.messages.index < state.followers.data.ids.length) {
    sendMessages(args, state);
  } else {
    console.log("All stages complete.")
  }
}

async function sendMessages(args: Args, state: State) {
  let rate_limit: RateLimit = {
    remaining: "",
    reset: ""
  };
  while(state.messages.index < state.followers.data.ids.length && rate_limit.remaining !== "0") {
    rate_limit = await sendMessage(client, args, state.followers.data.ids[state.messages.index]);
    state.messages.index += 1;
  }
  if(state.messages.index < state.followers.data.ids.length) { // exited while due to rate limit
    save(args, state, () => {
      if(rate_limit.reset) {
        let date = new Date(rate_limit.reset);
        console.log(date.toString(), rate_limit.reset);
        const job = new CronJob(date, () => {
          sendMessages(args, state);
        });
        job.start();
      }
    });
  }
}

function save(args: Args, state: State, callback: () => void) {
  writeFile(`output/${args.screen_name}.json`, JSON.stringify(state), (err) => {
    if(err) throw err;
    callback();
  });
}
