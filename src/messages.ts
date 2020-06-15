import Twit from "twit";
import { Args, RateLimit } from ".";

export async function sendMessage(client: Twit, args: Args, id: string): Promise<RateLimit> {
  return new Promise((resolve) => {
    client.post('direct_messages/events/new', {
      event: {
        type: "message_create",
        message_create: {
          target: {
            recipient_id: id
          },
          message_data: {
            text: args.message
          }
        }
      }
    } as object, (error, result, response) => {
      if(error) throw error;
      console.log(result);
      resolve({
        remaining: response.headers["x-rate-limit-remaining"] as string,
        reset: response.headers["x-rate-limit-reset"] as string
      });
    });
  });
}

