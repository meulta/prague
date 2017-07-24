import { IRouter, IStateMatch, prependMatcher, routeMessage, konsole } from 'prague';
import { UniversalChat, IChatActivityMatch, IChatMessageMatch, IChatEventMatch, IChatTypingMatch, IActivityMatch, chatRouter } from 'prague-botframework';

export class BrowserBot<BOTDATA> {
    constructor(
        private chat: UniversalChat,
        private data: BOTDATA
    ) {
    }

    run(routers: {
        message?:   IRouter<IStateMatch<BOTDATA> & IChatMessageMatch >,
        event?:     IRouter<IStateMatch<BOTDATA> & IChatEventMatch   >,
        typing?:    IRouter<IStateMatch<BOTDATA> & IChatTypingMatch  >,
        activity?:  IRouter<IStateMatch<BOTDATA> & IChatActivityMatch>
    }) {
        const router = prependMatcher<IActivityMatch>(message => ({
            ... message as any,
            data: this.data
        }), chatRouter(this.chat, routers));

        this.chat.activity$
        .map(activity => ({ activity } as IActivityMatch))
        .do(message => konsole.log("activity", message.activity))
        .flatMap(
            message => routeMessage(router, message),
            1
        )
        .subscribe(
            message => konsole.log("handled", message),
            error => konsole.log("error", error),
            () => konsole.log("complete")
        );
    }
}
