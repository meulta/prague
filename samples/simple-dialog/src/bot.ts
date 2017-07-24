import { UniversalChat, WebChatConnector, IChatMessageMatch } from 'prague-botframework';
import { BrowserBot } from 'prague-botframework-browserbot';

const webChat = new WebChatConnector()
window["browserBot"] = webChat.botConnection;
const browserBot = new BrowserBot(new UniversalChat(webChat.chatConnector), undefined);

// This is our "base message type" which is used often enough that we made it really short

type B = IChatMessageMatch;

// General purpose rule stuff

import { IRouter, first, best, ifMatch, run } from 'prague';

// Regular Expressions

import { matchRE, ifMatchRE } from 'prague';

// LUIS

import { LuisModel } from 'prague';

// WARNING: don't check your LUIS id/key in to your repo!

const luis = new LuisModel('id', 'key');

// Dialogs

import { RootDialogInstance, DialogInstance, Dialogs } from 'prague'

let rootDialogInstance: DialogInstance;

const dialogs = new Dialogs<B>({
        get: (match) => rootDialogInstance,
        set: (match, rdi) => {
            rootDialogInstance = rdi;
        }
    } 
    // {
    //     matchLocalToRemote: (match: B) => ({
    //         activity: match.activity,
    //         text: match.text,
    //         message: match.message,
    //         address: match.address,
    //         data: match.data,
    //     }),
    //     matchRemoteToLocal: (match, tasks) => ({
    //         activity: match.activity,
    //         text: match.text,
    //         message: match.message,
    //         address: match.address,
    //         data: match.data,
    //         reply: (message: any) => tasks.push({
    //             method: 'reply',
    //             args: {
    //                 message
    //             }
    //         })
    //     } as any),
    //     executeTask: (match, task) => {
    //         switch (task.method) {
    //             case 'reply':
    //                 match.reply(task.args.message);
    //                 break;
    //             default:
    //                 console.warn(`Remote dialog added task "${task.method}" but no such task exists.`)
    //                 break;
    //         }
    //     },
    // }
);

interface GameState {
    num: number,
    guesses: number
}

interface GameArgs {
    upperLimit: number;
    numGuesses: number;
}

const gameDialog = dialogs.add<GameArgs, {}, GameState>(
    'game',
    (dialog, m, args = { upperLimit: 50, numGuesses: 10}) => {
        m.reply(`Guess a number between 1 and ${args.upperLimit}. You have ${args.numGuesses} guesses.`);
        dialog.state = {
            num: Math.floor(Math.random() * args.upperLimit),
            guesses: args.numGuesses
        }
    },
    (dialog) => first(
        ifMatchRE(/\d+/, m => {
            const guess = parseInt(m.groups[0]);
            if (guess === dialog.state.num) {
                m.reply("You're right!");
                return dialog.end();
            }

            if (guess < dialog.state.num )
                m.reply("That is too low.");
            else
                m.reply("That is too high.");

            if (--dialog.state.guesses === 0) {
                m.reply("You are out of guesses");
                return dialog.end();
            }
            
            m.reply(`You have ${dialog.state.guesses} left.`);
        }),
        m => m.reply("Please guess a number between 1 and 50.")
    )
);

const rootDialog = dialogs.add(
    'root',
    (dialog) => first(
        ifMatchRE(/start game/, m => dialog.activate('game')),
        dialog.routeTo('game'),
        m => m.reply("Type 'start game' to start the game")
    )
)

const appRule: IRouter<B> = dialogs.routeToRoot('root');

browserBot.run({
    message: appRule
});

