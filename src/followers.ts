import { IncomingMessage } from "http";
import Twit from "twit";

import { Args } from ".";

type FollowerData = {
  ids: string[];
  next_cursor: number;
  next_cursor_str: string;
  previous_cursor: number;
  previous_cursor_str: string;
}

type GetFollowersResult = {
  ids: string[];
  cursor: string;
  rate_limit_reset?: number;
}

function getRateLimitReset(response: IncomingMessage) {
  return parseInt((response.headers["x-rate-limit-reset"] as string)) * 1000;
}

export async function getFollowers(client: Twit, args: Args, cursor: string): Promise<GetFollowersResult> {
  return new Promise((resolve) => {
    client.get('followers/ids', {
      screen_name: args.screen_name,
      cursor: cursor,
      stringify_ids: true,
      count: args.limit < 5000 ? args.limit : 5000
    }, (error, data, response) => {
      let ids: string[] = [];
      if(error) {
        resolve({
          ids,
          cursor,
          rate_limit_reset: getRateLimitReset(response)
        });
      } else {
        ids = ids.concat((data as FollowerData).ids);
        if((data as FollowerData).next_cursor_str === "0") { // Completed
          resolve({
            ids,
            cursor: (data as FollowerData).next_cursor_str
          });
        } else if(response.headers["x-rate-limit-remaining"] === "0") { // Rate limited
          resolve({
            ids,
            cursor,
            rate_limit_reset: getRateLimitReset(response)
          });
        } else { // Continue
          getFollowers(client, args, (data as FollowerData).next_cursor_str).then((result) => {
            resolve({
              ids: ids.concat(result.ids),
              cursor: result.cursor,
              rate_limit_reset: result.rate_limit_reset
            });
          });
        }
      }
    });
  });
}
