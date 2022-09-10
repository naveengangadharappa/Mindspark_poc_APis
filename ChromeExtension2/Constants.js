// NOTE: This file is parsed by our code so don't change the top level variable names nor their order!

NO_EXTERNAL_ID = 'NO_EXTERNAL_ID';              // the external source doesn't provide IDs, we'll create one
// there are a number of possible error conditions for sending a message or post:
// - permanent failure due to incorrect scraping - important that we're notified when this is the case!
// - permanent failure of the recipient (recipient account was closed, recipient blocked sender, etc.)
// - permanent failure of the message (the message is flagged as spam or is somehow unsupported)
// - temporary failure of the message (the window lost focus)
// - temporary failure of the sender (rate limiting)
ERROR_EXTERNAL_ID = 'ERROR_EXTERNAL_ID';        // there was a fatal error sending the message or post
RETRY_EXTERNAL_ID = 'RETRY_EXTERNAL_ID';        // there was a possibly temporary error sending the message or post
LIMITED_EXTERNAL_ID = 'LIMITED_EXTERNAL_ID';    // pause all sending for a long delay - handled in extension
BLOCKED_EXTERNAL_ID = 'BLOCKED_EXTERNAL_ID';    // remove after v1.23

PRIMARY_TAB = 'PRIMARY';
GENERAL_TAB = 'GENERAL';

MINIMUM_TAB_WIDTH = 1024;   // remove after v1.2

BACKGROUND_PROVIDED_TAB_ID = 'background_provided_tab_id';

constants = {
    MINIMUM_TAB_WIDTH: 1024,        // some sites provide a different UI for narrow view
    MAXIMUM_MESSAGES_PER_CHUNK: 150,
    MAXIMUM_COMMENTS_PER_CHUNK: 150,    // using 200 resulted in "The message port closed before a response was received." so I set messages to 150 as well since they're similar size
    MAXIMUM_MEMBERS_PER_CHUNK: 200,
};


timings = {     // all these values are in seconds
    SHORT_AJAX_REQUEST: 20,
    MEDIUM_AJAX_REQUEST: 60,
    LONG_AJAX_REQUEST: 600,
    CHECK_FOR_UPDATED_CONSTANTS: 300,
    SA_NOT_LOGGED_IN_DELAY: 60,
    SOCIAL_NOT_LOGGED_IN_DELAY: 120,
    TAB_NOT_VISIBLE_DELAY: 5,
    UI_RECHECK_DELAY: 3,
    IDLE_LOOP_DELAY: 10,                    // the syncs take turns so this is the rate at which each checks if it's his turn yet
    BUSY_LOOP_DELAY: 10,                    // the delay between actions in a specific sync
    INTER_SYNC_RUN_DELAY: 10,               // delay between runs of any syncs (end of last and start of next)
    SYNC_RUN_FREQUENCY: 30,                 // frequency of runs for a specific sync (start to start)
    SEND_MESSAGE_RECHECK_DELAY: 60,         // message sending is fairly timely (especially for bots)
    SEND_POST_RECHECK_DELAY: 120,           // post scheduling is not timely so the delay can be longer
    INTER_POST_DELAY: 60,
    INTER_MESSAGE_DELAY: 120,               // I was sometimes getting blocked by FB at 60 so increased it
    BLOCKED_MESSAGE_DELAY: 3600,
    INTER_CONTACT_DELAY: 30,
    INTER_CONVERSATION_CHECK_DELAY: 30,
    INTER_POST_CHECK_DELAY: 30,
    INTER_GROUP_CHECK_DELAY: 30,
    UPLOAD_SUCCESS_MESSAGE_DELAY: 8,
    SYNC_LOGIN_DELAY: 15,                   // this delay prevents us from asking the user to link accounts one right after the other
    SCRAPER_INACTIVITY_REFRESH_DELAY: 300,  // if scraping tab hasn't been active we'll refresh it, must be greater than the above
    SCRAPER_INACTIVITY_GIVEUP_DELAY: 1800,  // if scraping tab hasn't been active for a long time we'll close it and try again, if this is too short we'll be popping to foreground too often
    BRAND_SELECTION_TRIED_REOFFER: 120,     // wait this long after the user has been provided with the brand selection to ask again
    ACCOUNT_LOGIN_CHECK: 120,               // check if logged in this often
    ACCOUNT_LOGIN_TRIED_REOFFER: 3600,      // wait this long after the user has tried logging in to ask again (also check more often during this time)
    ACCOUNT_LOGIN_REFUSED_REOFFER: 86400,   // wait this long after the user has refused logging in to ask again
    READY_SYNC_CHECK_DELAY: 3600,
    MISSING_SYNC_CHECK_DELAY: 300,
    LINK_SYNC_REFUSED_REOFFER: 86400,
    SYNC_PROCESSING_PING_DELAY: 30,
    SYNC_MAX_SCRAPE_TIME: 300,              // let other scrapers have a shot if this one is taking a long time
    SYNC_MAX_SCRAPE_TIME_LONG: 1200,        // as above for long operations, for example parsing post comments may take a long time, and we must start back at the beginning if we get interrupted
    SCRAPING_EXCEPTION_DELAY: 300,
    CONTACTS_CHECK_DELAY: 600,
    CONTACT_TAGS_CHECK_DELAY: 600,
    GROUPS_CHECK_DELAY: 600,
    BRANDS_CHECK_DELAY: 21600,
    FILTERS_CHECK_DELAY: 600,               // groups can only be changed via the extension so the only scenario is another extension running
    HELP_CHECK_DELAY: 3600,
    MESSAGES_SCRAPE_DELAY: 120,             // message scraping is fairly time sensitive, but should be very efficient
    FACEBOOK_THROTTLED_DELAY: 1800,         // stop scraping for a while
    MESSAGES_THROTTLED_DELAY: 3600,         // stop sending messages for a while
    WATCHED_POSTS_CHECK_DELAY: 3600,        // watching posts is not very time sensitive
    WATCHED_GROUP_REQUESTS_DELAY: 600,      // scraping new group requests is fairly time sensitive
    WATCHED_GROUP_MEMBERS_DELAY: 600,       // scraping new group members is fairly time sensitive
    WATCHED_GROUP_STAFF_DELAY: 21600,       // scraping new group staff is not very time sensitive (6 hours)
    WATCHED_GROUP_QUESTIONS_DELAY: 21600,   // scraping group question changes is not very time sensitive (6 hours)
    BROWSER_IDLE_TIME: 300,
    MESSAGING_FILTER_RECHECK: 2,    // remove after v1.19
};

elementPaths = {
    Facebook: {
        throttled: "DIV[role=dialog] {propMatch('aria-label', localizedKeywords.Facebook.Throttled)}",
    },
    FacebookMsgs: {
        messageStatus: [
            'div > div:nth-child(1) > div:nth-child(1) > div > a > div > div.ow4ym5g4.auili1gw.rq0escxv.j83agx80.buofh1pr.g5gj957u.i1fnvgqd.oygrvhab.cxmmr5t8.hcukyx3x.kvgmc6g5.tgvbjcpo.hpfvmrgz.qt6c0cv9.rz4wbd8a.a8nywdso.jb3vyjys.du4w35lb.bp9cbjyn.btwxx1t3.l9j0dhe7 > div.ozuftl9m.l9j0dhe7.bi6gxh9e.aov4n071.o8rfisnq > div > div > svg > title {innerHTML.trim()}',
            // there are likely one message status for every sent message so we grab the last one using slice(-1)
            // the "DIV[role=main]" avoids matching on the hidden pop-up message list
            'DIV[role=main] div[data-testid=messenger_delivery_status] {merge.slice(-1)} svg > title {innerHTML.trim()}'
        ],  // remove after v1.23
        // there are likely one message status for every sent message so we grab the last one using slice(-1)
        // the "DIV[role=main]" avoids matching on the hidden pop-up message list
        // these can return a string if possible, otherwise any object to identify the case
        messageCheckSending: 'DIV[role=main] div[data-testid=messenger_delivery_status] {merge.slice(-1)} svg > title {propMatch("textContent", localizedKeywords.FacebookMsgs.MsgSending).textContent.trim()}',
        messageCheckPermanentFailure: 'DIV[role=main] div[data-testid=messenger_delivery_status] {merge.slice(-1)} svg > title {propMatch("textContent", localizedKeywords.FacebookMsgs.MsgSendFailure).textContent.trim()}',
        messageCheckRateLimitFailure: '#No_Match_For_Now',
        messageCheckTemporaryFailure: '#No_Match_For_Now',
        messageCheckSentSuccess: 'DIV[role=main] div[data-testid=messenger_delivery_status] {merge.slice(-1)} svg > title {propMatch("textContent", localizedKeywords.FacebookMsgs.MsgSendSuccess).textContent.trim()}',
        // the "DIV[role=main]" avoids matching on the hidden pop-up message list
        messageRows: 'DIV[role=main] div[data-testid="message-container"]',
        // the message list may include an item called "Marketplace" which opens up a sub-list and for now we want to
        // ignore those which is why I added the fist part below
        chatsList           : "[data-testid='mwthreadlist-item-open'] [data-testid='mwthreadlist-item']",
        chatTimestamp       : [
           ".qzhwtbm6.knvmm38d .ojkyduve .g0qnabr5",
           ".hzawbc8m > .ltmttdrg > .m9osqain > .g0qnabr5",
           'span[data-testid="timestamp"]'
        ],
        chatScroll          : "div[data-testid='MWJewelThreadListContainer'] {parentNode.parentNode.parentNode}",   // remove after 1.16
        chatParsingThrottled: "DIV[role=main] SPAN {propMatch('innerText', localizedKeywords.FacebookMsgs.ChatParsingThrottled)}",
        chatLink            : "a[role='link']", // chat link for fetching the chat id
        chatCurrentContainer: "[aria-current='page']", // to get the current chat container open
        chatRightPanelButton: ".b20td4e0.muag1w35 div[data-visualcompletion='ignore-dynamic'] div[role=button][tabindex='0']",
        conversationParticipants:   "div[role=main] SPAN.d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.oi732d6d.ik7dh3pa.a8c37x1j.keod5gw0.nxhoafnm.aigsh9s9.d9wwppkn.fe6kdd0r.mau55g9w.c8b282yb.iv3no6db.a5q79mjw.g1cxx5fr.lrazzd5p.oo9gr5id.oqcyycmt",
        messageBox          : "div[role='main']",// the current conversation box
        messageBoxParticipantName: "DIV[role='main'] {propMatch('ariaLabel', localizedKeywords.FacebookMsgs.ParticipantName).ariaLabel.match(localizedKeywords.FacebookMsgs.ParticipantName)[1]}",
        messageBoxRoomName: "DIV[role='main'] {propMatch('ariaLabel', localizedKeywords.FacebookMsgs.GroupName).ariaLabel.match(localizedKeywords.FacebookMsgs.GroupName)[1]}",
        messageBoxAttr: "DIV[role='main'] {ariaLabel}",
        messageScrollBox: '[data-release-focus-from="CLICK"]',
        messageBoxMain          : "DIV[role='main']",
        messageBoxMainAttr          : "DIV[role='main'] {ariaLabel}",
//        viewAllReactionsButton: 'div.bp9cbjyn.j83agx80.buofh1pr.ni8dbmo4.stjgntxs > div > span > div > span.gpro0wi8.cwj9ozl2.bzsjyuwj.ja2t1vim',
        messageDiv          : [
/*
                            This may be useful if needed to localize specifiq type of FB message
                            Keep in mind that a message with only one photo don't have any specific id so we can caught
                            That make these selectors below obsolete
                                'div[data-testid="message-container"]',
                                'div[data-testid="outgoing_message"]',
                                'div[data-testid="messenger_incoming_text_row"]',
                                'div[data-testid="chat-video"]',
                                'div[data-testid="chat-audio-player"]',
                                'img[alt="Open Photo"]'
*/
                        "div[data-testid='incoming_group'] div[data-scope='messages_table'] div.ni8dbmo4.stjgntxs.ii04i59q",
                        "div[data-testid='outgoing_group'] div[data-scope='messages_table'] div.ni8dbmo4.stjgntxs.ii04i59q",
                        "div[role=main] div[data-scope='messages_table'] div[data-testid='message-container']"  // role=main is to avoid matching on hidden pop-up message tab
                    ], // the div containing the send message
        messageDivClosestRow: '{parentElement.parentElement.parentElement.parentElement}',
        messageContainer    : "div[role=main] div[data-scope='messages_table']", // role=main is to avoid matching on hidden pop-up message tab, the container of timestamp and message
        messageTimestamp    : "div[data-scope='date_break']",
        editBox             : "div[role=textbox]",
        sendButton          : [
            'div[role=button][aria-label="Press enter to send"]',
            "div > div:nth-child(1) > div > div.rq0escxv.l9j0dhe7.du4w35lb > div > div > div.j83agx80.cbu4d94t.d6urw2fd.dp1hu0rb.l9j0dhe7.du4w35lb > div.rq0escxv.pfnyh3mw.jifvfom9.gs1a9yip.owycx6da.btwxx1t3.j83agx80.buofh1pr.dp1hu0rb.l9j0dhe7.du4w35lb > div.rq0escxv.l9j0dhe7.du4w35lb.cbu4d94t.d2edcug0.hpfvmrgz.rj1gh0hx.buofh1pr.g5gj957u.j83agx80.dp1hu0rb > div > div > div > div > div > div.rq0escxv.du4w35lb.d2edcug0.hpfvmrgz.rj1gh0hx.buofh1pr.g5gj957u.j83agx80.cbu4d94t.l9j0dhe7.ni8dbmo4.stjgntxs > div.iqfcb0g7.tojvnm2t.a6sixzi8.k5wvi7nf.q3lfd5jv.pk4s997a.bipmatt0.cebpdrjk.qowsmv63.owwhemhu.dp1hu0rb.dhp61c6y.l9j0dhe7.iyyx5f41.a8s20v7p > div > div > div > div.ntk0jbrt.pfnyh3mw > div > form > div > div.j83agx80.l9j0dhe7.aovydwv3.ni8dbmo4.stjgntxs.nred35xi.n8tt0mok.hyh9befq > span:nth-child(4) > div",
        ],
        messageAttachmentInput: [
           "input.mkhogb32",
           "div > div:nth-child(1) > div > div.rq0escxv.l9j0dhe7.du4w35lb > div > div > div.j83agx80.cbu4d94t.d6urw2fd.dp1hu0rb.l9j0dhe7.du4w35lb > div.rq0escxv.pfnyh3mw.jifvfom9.gs1a9yip.owycx6da.btwxx1t3.j83agx80.buofh1pr.dp1hu0rb.l9j0dhe7.du4w35lb > div.rq0escxv.l9j0dhe7.du4w35lb.cbu4d94t.d2edcug0.hpfvmrgz.rj1gh0hx.buofh1pr.g5gj957u.j83agx80.dp1hu0rb > div > div > div > div > div > div > div.iqfcb0g7.tojvnm2t.a6sixzi8.k5wvi7nf.q3lfd5jv.pk4s997a.bipmatt0.cebpdrjk.qowsmv63.owwhemhu.dp1hu0rb.dhp61c6y.l9j0dhe7.iyyx5f41.a8s20v7p > div > div > div > div.ntk0jbrt.pfnyh3mw > div > form > div > div.aovydwv3.ni8dbmo4.stjgntxs.nred35xi.pmk7jnqg.k4urcfbm.flx89l3n.l9l1gxur.agkhgkm8 > div > input:nth-child(1)"],
        basicEditBox: 'form textarea',
        basicForm: 'form[method="post"][enctype="multipart/form-data"]',
        basicMessageAttachmentInputOne: 'form input[name="file1"]',
        basicMessageAttachmentInputTwo: 'form input[name="file2"]',
        basicMessageAttachmentInputThree: 'form input[name="file3"]',
        basicSendAcceptButton: 'div#root a[target=_self]', // remove after version 1.15
        // these can return a string if possible, otherwise any object to identify the case
        basicMessageCheckPermanentFailure: '{urlMatch(/upload\\.facebook\\.com/g)} DIV#objects_container > DIV[title] {propMatch("title", localizedKeywords.FacebookMsgs.BasicMsgSendPermanentFailure).title.trim()}',
        basicMessageCheckRateLimitFailure: '{urlMatch(/upload\\.facebook\\.com/g)} DIV#objects_container > DIV[title] {title.trim()}',
        basicMessageCheckTemporaryFailure: '{urlMatch(/error_code/g)}',
        basicMessageCheckSentSuccess: '{urlMatch(/mbasic\\.facebook\\.com\\/messages/g)}',    // match almost anything for now
        sideBarButton: 'div.t6p9ggj4.tkr6xdv7 > div > div.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.pfnyh3mw.d2edcug0.hpfvmrgz.p8fzw8mz.pcp91wgn.iuny7tx3.ipjc6fyt > div > div > span > span > div > div.bp9cbjyn.pq6dq46d.mudddibn.taijpn5t.l9j0dhe7.ciadx1gn > div',
        sideBarMenu: 'div.rq0escxv.pfnyh3mw.jifvfom9.gs1a9yip.owycx6da.btwxx1t3.j83agx80.buofh1pr.dp1hu0rb.l9j0dhe7.du4w35lb > div.rq0escxv.l9j0dhe7.du4w35lb.cbu4d94t.d2edcug0.hpfvmrgz.rj1gh0hx.buofh1pr.g5gj957u.j83agx80.dp1hu0rb > div > div > div > div > div > div.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.kuivcneq.g5gj957u.f4tghd1a.ifue306u.t63ysoy8 > div {innerText.toLowerCase()}',
        elemContainerChatActionsStatus: 'div > div:nth-child(1) > div:nth-child(1) > div > a > div > div.ow4ym5g4.auili1gw.rq0escxv.j83agx80.buofh1pr.g5gj957u.i1fnvgqd.oygrvhab.cxmmr5t8.hcukyx3x.kvgmc6g5.tgvbjcpo.hpfvmrgz.qt6c0cv9.rz4wbd8a.a8nywdso.jb3vyjys.du4w35lb.bp9cbjyn.btwxx1t3.l9j0dhe7 > div.ozuftl9m.l9j0dhe7.bi6gxh9e.aov4n071.o8rfisnq > div > div > div {propMatch("aria-label", localizedKeywords.FacebookMsgs.MarkAsRead)}',
        elemContainerChatActionsButton: 'div > div:nth-child(1) > div:nth-child(2) > div > div > div[aria-label="Menu"]',
        elemContainerChatActionsMarkAsUnreadButton: 'div.rq0escxv.jgsskzai.cwj9ozl2.nwpbqux9.io0zqebd.m5lcvass.fbipl8qg.nwvqtn77.ni8dbmo4.stjgntxs > div > div > div > div.j83agx80.cbu4d94t.buofh1pr.l9j0dhe7 > div > div:nth-child(1)[role="menuitem"]',
        elemParseMessageParent: '{parentNode.parentNode.parentNode}',   // remove after v1.23
        isSentChat: '{parentNode.parentNode.parentNode.propMatch("innerText", localizedKeywords.FacebookMsgs.SelfSent)}',

        activeChatButtonTimestamp: 'a[aria-current="page"] span[data-testid="timestamp"]{innerText}',

        messageHeaderTitleContainer: 'div.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.d2edcug0.hpfvmrgz.rj1gh0hx.buofh1pr.g5gj957u.p8fzw8mz.iuny7tx3.ipjc6fyt.hyh9befq > div > div:nth-child(1)',
        messageElementWithId: 'a {href.match(/[0-9]+/g)}',
        messageIsUnread: [
           'DIV {propMatch("aria-label", localizedKeywords.FacebookMsgs.MarkAsRead)}',
           'span.hihg3u9x.ggxiycxj.l9j0dhe7.hnhda86s.oo9gr5id.l3itjdph'
        ],
        messageIsNotResponded: 'div.bp9cbjyn.j83agx80.m9osqain.frgo5egb > span:first-of-type > span {innerText.match(/^(?!You:|You sent|Reacted|This account can).*/g)}',
        messageIsOnline: 'span.pq6dq46d.jllm4f4h.iwuwq2lu.g5oefq77.oo8ov1ci.ce1xcart.bsodd3zb.xthkpp0z.s45kfl79.emlxlaya.bkmhp75w.spb7xbtv',
        chatContactButtonsElements: [
            // for William
            'div[aria-label="Chats"] div[data-testid="mwthreadlist-item-open"]',
            // for Dominique
            'div[aria-label="Chats"] div[data-testid="mwthreadlist-item"]'
        ],
        chatContactsActionBar: [
            // for facebook.com
            'div.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.pfnyh3mw.i1fnvgqd.bp9cbjyn.owycx6da.btwxx1t3.jei6r52m.wkznzc2l.n851cfcs.dhix69tm.ahb00how > div > div > div.rq0escxv.l9j0dhe7.du4w35lb.cbu4d94t.d2edcug0.hpfvmrgz.aovydwv3.j83agx80.dz1kfvuc.kb5gq1qc.pfnyh3mw.taijpn5t.b0upgy8r > div',
            // for messenger.com
            'div[data-testid=mw_skytale_left_rail_header] div.bp9cbjyn.j83agx80.k4urcfbm > div.bp9cbjyn.j83agx80.rj1gh0hx.buofh1pr.g5gj957u.bkfpd7mw'
        ],
    
        body: '{innerText}',
        attachmentA: 'a[role="link"]:not([target="_blank"])',
        inlineAttachmentUrl: [
            'div[role=img][style*=background-image] { style.backgroundImage.match(/url\\("(.*)"\\)/)[1] }', // inline image
            'a[role=link][target=_blank] { href }', // video link
        ],
        attachmentImageSrc: 'div.j83agx80.datstx6m.g64rku83 > div > div > div > div.bp9cbjyn.j83agx80.taijpn5t.pnzxbu4t.nznu9b0o > div > img{src}',
        otherAttachmentsDownloadHref: 'a[aria-label="Download"]{href}',
        closeAttachmentPopup: 'div[role=dialog] div[aria-label="Close"]',
        conversationIdChats: 'messages\\/t\\/([0-9]+)',
        conversationIdMessages: '^https:\\/\\/(.+)\\.(facebook|messenger)\\.com\\/messages\\/(t\\/)?([0-9]+)(.+)$'
    },
    FacebookPosts: {
        composer: [
            // for Dominique
            'DIV[role=button][onclick*=Composer]',
            // for William
            'div.k4urcfbm.g5gj957u.buofh1pr.j83agx80.ll8tlv6m > div > div.m9osqain.a5q79mjw.gy2v8mqq.jm1wdb64.k4urcfbm.qv66sw1b > span'
        ],
        postTextarea: [
            // for Dominique
            'TEXTAREA.composerInput',
            // for William
            'form div._5rpb > div[role="textbox"]'
        ],
        openPostAttachmentInput: [
            // for Fabien
            'div {propMatch("aria-label", localizedKeywords.FacebookPosts.openPostAttachmentInput)}',
            // for Dominique
            'BUTTON[type=button][data-sigil*=photo-button]',
            // for William
            'form > div > div.rq0escxv.du4w35lb.ms05siws.pnx7fd3z.b7h9ocf4.pmk7jnqg.j9ispegn.kr520xx4.pedkr2u6.oqq733wu > div > div > div > div.ihqw7lf3.discj3wi.l9j0dhe7 > div.scb9dxdr.sj5x9vvc.dflh9lhu.cxgpxx05.dhix69tm.wkznzc2l.i1fnvgqd.j83agx80.rq0escxv.ibutc8p7.l82x9zwi.uo3d90p7.pw54ja7n.ue3kfks5.tr4kgdav.eip75gnj.ccnbzhu1.dwg5866k.cwj9ozl2.bp9cbjyn > div:nth-child(2) > div > div:nth-child(1) > div > span > div > div > div:nth-child(1) > div > div > div.bp9cbjyn.j83agx80.taijpn5t.l9j0dhe7.datstx6m.k4urcfbm > i'
        ],
        postAttachmentInput: 'div.j83agx80.cbu4d94t.buofh1pr.l9j0dhe7 > div.scb9dxdr.qt6c0cv9.dflh9lhu.jb3vyjys > div > div.l9j0dhe7.du4w35lb.rq0escxv.j83agx80.cbu4d94t.d2edcug0.d8ncny3e.buofh1pr.g5gj957u.tgvbjcpo.cxgpxx05.sj5x9vvc > div > div > input',
        shareWith: [
            "#m_privacy_button_text_id",
            'div.a8nywdso.ihqw7lf3.rz4wbd8a.discj3wi.dhix69tm.wkznzc2l.j83agx80.bp9cbjyn > div.cbu4d94t.j83agx80 > div > div > div > div > div > span > div > div > div > span'
        ],
        sharePublic: [
            "LABEL[data-store*=\"300645083384735\"]",
            "div > div.ow4ym5g4.auili1gw.rq0escxv.j83agx80.buofh1pr.g5gj957u.i1fnvgqd.oygrvhab.cxmmr5t8.hcukyx3x.kvgmc6g5.hpfvmrgz.qt6c0cv9.jb3vyjys.l9j0dhe7.du4w35lb.bp9cbjyn.btwxx1t3.dflh9lhu.scb9dxdr.nnctdnn4 > div.ow4ym5g4.auili1gw.rq0escxv.j83agx80.buofh1pr.g5gj957u.i1fnvgqd.oygrvhab.cxmmr5t8.hcukyx3x.kvgmc6g5.tgvbjcpo.hpfvmrgz.qt6c0cv9.rz4wbd8a.a8nywdso.jb3vyjys.du4w35lb.bp9cbjyn.btwxx1t3.l9j0dhe7 > div.n851cfcs.ozuftl9m.n1l5q3vz.l9j0dhe7.o8rfisnq > div > div > i"
        ],
//      backgrounds: "DIV[role=button]._2k39",
        postButton: [
            "button[value=\"Post\"]",
            "div.rq0escxv.du4w35lb.ms05siws.pnx7fd3z.b7h9ocf4.pmk7jnqg.j9ispegn.kr520xx4.pedkr2u6.oqq733wu > div > div > div > div.ihqw7lf3.discj3wi.l9j0dhe7 > div.k4urcfbm.discj3wi.dati1w0a.hv4rvrfc.i1fnvgqd.j83agx80.rq0escxv.bp9cbjyn > div > div"
        ],
//    errorMessage: "div#open_view_error",
        progressBar: "SPAN[role=progressbar]",

//    get Comments

        postContainer : "div[role=article]", // remove after version 1.15
        postContainer_v_video: 'div[role="complementary"]', // remove after version 1.15
        postContainer2 : [
            // at "https://www.facebook.com/watch/?ref=saved&v=852085219067419" the article is only a part
            // of the post so we use this in that case to get the whole article
            '{urlMatch(/\\/watch\\/\\?ref\\=saved/g)} DIV#watch_feed DIV.j83agx80.ad2k81qe.f9o22wc5.iq01arzp',
            // live videos have a fairly different format
            '{urlMatch(/\\/watch\\/live\\//g)} DIV.sq6gx45u.buofh1pr.cbu4d94t.j83agx80',
            // at "/facebook.com\/[^\/]+\/videos\/[0-9]+/g" the post is at this DIV
            '{urlMatch(/facebook.com\\/[^\\/]+\\/videos\\/[0-9]+/g)} div[role="complementary"]',
            // this seems to work elsewhere
            "div[role=article]",
        ],
        postUnavailable : 'a {propMatch("aria-label", localizedKeywords.FacebookPosts.postUnavailable)}',
        postVideoPause: 'div {propMatch("aria-label", localizedKeywords.FacebookPosts.postVideoPause)}',
        postAuthorURL : [
            // duplicated for FB posts below
            // NOTE: live video won't have an author we can easily get, so it's parsed at the "saved posts" page
            '{selfOrChildrenBySelector("H2 A")[0].href}',
            '{selfOrChildrenBySelector("A")[0].href}',
        ],
        // usually there's a drop down list of comment options
        postOpenCommentsButton: [
// DRL FIXIT! This was for William but it breaks in my case because it matches in the open and closed state.
//            'div.bp9cbjyn.j83agx80.pfnyh3mw.p1ueia1e > div:nth-child(1) > div > span',
            'div[role=button][aria-expanded=false] {propMatch("innerText", localizedKeywords.FacebookPosts.Comments)}',
            'div[role=button]:not([aria-expanded]) span {propMatch("innerText", localizedKeywords.FacebookPosts.Comments)}'
        ],
        postHideCommentsButton: [
            'div[aria-label="Hide"][role="button"]',
            'div[role=button][aria-expanded=true] {propMatch("innerText", localizedKeywords.FacebookPosts.Comments)}'
        ],
        postMostRelevantCommentSelector: 'div[role=button] span {propMatch("innerText", localizedKeywords.FacebookPosts.MostRelevant)}',
        postShowAllCommentsButtonOnMostRelevantCommentSelector: [
            // pick "All Comments" over "Newest"
            'div[role=menu] div[role=menuitem] span {propMatch("innerText", localizedKeywords.FacebookPosts.allComments)}',
            'div[role=menu] div[role=menuitem] span {propMatch("innerText", localizedKeywords.FacebookPosts.Newest)}'
        ],
        button : "div[role=button]",    // remove after v1.2
        postLoaded : "div[role=button]",
        viewMoreComments: 'div[role=button] {propMatch("innerText", localizedKeywords.FacebookPosts.viewMoreComments)}',
        commentContainers: "div[role=article]",
        commentContainers_v_video: "li div[role=article]",  // remove after 1.15
        commentText : ".kvgmc6g5.cxmmr5t8.oygrvhab.hcukyx3x.c1et5uql",
        commentAuthor : ".nc684nl6 [role=link][tabindex='0']",
        commentAuthorRoles : [
            // for Dominique
            '{parentElement.parentElement.parentElement} div[aria-label="Identity Badges"] div span {.innerText}',
            // for William
            "{parentElement.parentElement.parentElement} span div span[dir=\"auto\"] {propMatch('innerText', localizedKeywords.FacebookPosts.commentAuthorRoles).innerText}"
        ],
        commentTimestamp : "[role=link][tabindex='0']",
        article: 'div[role="article"]',
        articleActionsButton: 'div[aria-label="Actions for this post"]',
        articleSaveUnsave: [    // remove after v1.19
            'div[role="button"] span {propMatch("innerText", localizedKeywords.FacebookPosts.SaveOrUnsavePostOrVideo)}',
            'div[role="menuitem"] span {propMatch("innerText", localizedKeywords.FacebookPosts.SaveOrUnsavePostOrVideo)}',
        ],
        articleSave: [
            'div[role="button"] span {propMatch("innerText", localizedKeywords.FacebookPosts.SavePostOrVideo)}',
            'div[role="menuitem"] span {propMatch("innerText", localizedKeywords.FacebookPosts.SavePostOrVideo)}',
        ],
        articleUnsave: [
            'div[role="button"] span {propMatch("innerText", localizedKeywords.FacebookPosts.UnsavePostOrVideo)}',
            'div[role="menuitem"] span {propMatch("innerText", localizedKeywords.FacebookPosts.UnsavePostOrVideo)}',
        ],
        articleSaveDone: [
            // in fr-CA aria-label="Terminer"
            'div {propMatch("aria-label", localizedKeywords.FacebookPosts.articleSave)}',
            // Doms case it comes up as a black alert box in the lower left corner of the screen.
            'div[role=alert] a[href*="/saved"]'
        ],
        facebookPostLinkStringDetect: 'l.facebook.com/l',
        savedPostTypeContainer: 'div.hpfvmrgz.knvmm38d.dhix69tm.i1fnvgqd.buofh1pr.cbu4d94t.j83agx80 > div > div:nth-child(1) > span',
        savedPostTypeContainerParentPost: 'div.sjgh65i0',
        allowedSavedPostsFormatToExecuteAction: ['Video', 'Post'],

        actionsDialog: 'div[role="menu"] div[aria-hidden="false"]',
        postContainerForCheckingAvailableScrapingMethod: '{parentBySelector("div[role="article"]")}',
        // aria label automatically translate itself
        // Actions for this post => Actions pour cette publication (fr-CA)
        postActionsBoxBtnForCheckingAvailableScrapingMethod: 'div {propMatch("aria-label", localizedKeywords.FacebookPosts.postActionsBoxBtnForCheckingAvailableScrapingMethod)}',
        postActionsBoxForCheckingAvailableScrapingMethod: [
            // for William
            'div[role="menu"] div[aria-hidden="false"]',
            // for Dominique
            'div[role="dialog"][aria-label="Post actions"] div[role="button"]'
        ],
        // postShareButton: 'div[aria-label="Send this to friends or post it on your timeline."]',
        postShareButton: 'div {propMatch("aria-label", localizedKeywords.FacebookPosts.postShareButton)}',
        // postShareDialogCopyLinkButton: "div[role='dialog'] {propMatch('innerText', 'Copy link')} div[data-visualcompletion='ignore-dynamic'] {propMatch('innerText', 'Copy link')} span {propMatch('innerText', 'Copy link')}",
        postShareDialogCopyLinkButton: "div[role='dialog'] {propMatch('innerText', localizedKeywords.FacebookPosts.shareDialogCopyLinkButton)} div[data-visualcompletion='ignore-dynamic'] {propMatch('innerText', localizedKeywords.FacebookPosts.shareDialogCopyLinkButton)} span {propMatch('innerText', localizedKeywords.FacebookPosts.shareDialogCopyLinkButton)}",
        postShareDialogCopyConfirmationBox: 'ul li {propMatch("innerText", "Link copied")}',
        checkImagePostHref: 'h4 {parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.nextSibling} a img {parentElement.parentElement.parentElement.parentElement.parentElement.href}',
        imagePostHref: 'h4 {parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.nextSibling} a img {parentElement.parentElement.parentElement.parentElement.parentElement.href}',
        postActionBoxActionButtonsForScrapingViaSaving: [
            // should match articleSave and articleUnsave!
            'div[role="button"] span {propMatch("innerText", localizedKeywords.FacebookPosts.SavePostOrVideo)}',
            'div[role="menuitem"] span {propMatch("innerText", localizedKeywords.FacebookPosts.SavePostOrVideo)}',
            'div[role="button"] span {propMatch("innerText", localizedKeywords.FacebookPosts.UnsavePostOrVideo)}',
            'div[role="menuitem"] span {propMatch("innerText", localizedKeywords.FacebookPosts.UnsavePostOrVideo)}',
        ],
        checkPostActionBoxActionButtonsForScrapingViaEmbed: [
            'div[role="menuitem"] {propMatch("innerText", "Embed")}'
        ],
        postActionBoxActionButtonsForScrapingViaEmbed: [
            'div[role="menuitem"] {propMatch("innerText", "Embed")}'
        ],
        postHrefScrapingVieEmbed: 'input[aria-label="Sample code input"] {value.match(/(?<=href=)(.*)(?=&show_text=)/gm)}',
        closeEmbedDialogButton: 'div[aria-label="Embed Post"] div[aria-label="Close"]',
        postHrefViaPostedTimeLink: [
            'h4 {parentElement.parentElement.parentElement.parentElement.parentElement.parentElement} a {href}',
            'h3 {parentElement.parentElement.parentElement.children[1]} a {href}'
            // 6 parents => next sibling => first a => child[1] => a
            // 53 47
        ],
        postMbasic: 'input[name="view_post"] {propMatch("value", localizedKeywords.FacebookPosts.feedPostMbasic)}', // to remove after 1.24
        feedPostMbasic: 'input[name="view_post"] {propMatch("value", localizedKeywords.FacebookPosts.feedPostMbasic)}',
        pagePostMbasic: 'input[name="view_post"] {propMatch("value", localizedKeywords.FacebookPosts.pagePostMbasic)}',
        publicAudienceLink: 'div {propMatch("innerText", localizedKeywords.FacebookPosts.publicAudience).parentElement.parentElement.parentElement.parentElement.parentElement.nextSibling} a',
        pageAttachmentError: 'div[id="objects_container"] > div > div > span',
        feedAttachmentError: 'div[id="objects_container"] > div > div > span',
        pagePostTextField: 'textarea[name="xc_message"]',
        feedPostTextField: 'textarea[name="xc_message"]',
        pagePostAttachment: 'input[type="image"]',
        feedPostAttachment: 'input[type="image"]',
        pagePostAddAttachmentButton: 'input[name="view_photo"]',
        feedPostAddAttachmentButton: 'input[name="view_photo"]',
        pagePostButton: 'input[name="view_post"]',
        feedPostButton: 'input[name="view_post"]',
        pagePostAttachment1: 'input[name="file1"]',
        pagePostAttachment2: 'input[name="file2"]',
        pagePostAttachment3: 'input[name="file3"]',
        feedPostAttachment1: 'input[name="file1"]',
        feedPostAttachment2: 'input[name="file2"]',
        feedPostAttachment3: 'input[name="file3"]',
        pagePostAttachmentPreviewButton: 'input[name="add_photo_done"]',
        feedPostAttachmentPreviewButton: 'input[name="add_photo_done"]',
        feedPostPrivacy: 'input[name="view_privacy"]',
        mComposerBtn: '#MComposer div[role="button"]',
        mPrivacyBtn: '#m_privacy_button_text_id',
        mAudienceOptions: 'fieldset[data-sigil="audience-options-list"] > label > div > div',
        mComposerInput: 'textarea.composerInput',
        mMentionsHidden: 'input[data-sigil=" mentionsHiddenInput"]',
        mSubmitBtn: 'button[data-sigil="submit_composer"]',
        watchLivePath: "/watch/live/",
    },
    FacebookGroupPosts: {
        // composer: 'div.rq0escxv.l9j0dhe7.du4w35lb.hpfvmrgz.buofh1pr.g5gj957u.aov4n071.oi9244e8.bi6gxh9e.h676nmdw.aghb5jc5.gile2uim.qmfd67dx > div:nth-child(1) > div > div > div > div.bp9cbjyn.j83agx80.ihqw7lf3.hv4rvrfc.dati1w0a.pybr56ya > div',
        composer: 'a {propMatch("aria-label", localizedKeywords.FacebookPosts.composer).parentElement.parentElement.nextSibling}',
        postTextarea: "form div._5rpb > div[role=\"textbox\"]",
        openPostAttachmentInput: 'form > div > div.rq0escxv.du4w35lb.ms05siws.pnx7fd3z.b7h9ocf4.pmk7jnqg.j9ispegn.kr520xx4.pedkr2u6.oqq733wu > div > div > div.j83agx80.btwxx1t3.s8dhs3de.mfofr4af.hihg3u9x.ggxiycxj.hjequu9d.ssoat4ej.f344zkr0.s9tcezmb > div > div.ihqw7lf3.discj3wi.l9j0dhe7 > div.scb9dxdr.sj5x9vvc.dflh9lhu.cxgpxx05.dhix69tm.wkznzc2l.i1fnvgqd.j83agx80.rq0escxv.ibutc8p7.l82x9zwi.uo3d90p7.pw54ja7n.ue3kfks5.tr4kgdav.eip75gnj.ccnbzhu1.dwg5866k.cwj9ozl2.bp9cbjyn > div.j83agx80 > div:nth-child(1) > div > span > div > div > div:nth-child(1) > div > div > div.bp9cbjyn.j83agx80.taijpn5t.l9j0dhe7.datstx6m.k4urcfbm > i',
        postAttachmentInput: 'div > div > div.j83agx80.cbu4d94t.buofh1pr > div > div > div > div > div.rq0escxv.l9j0dhe7.du4w35lb.hpfvmrgz.buofh1pr.g5gj957u.aov4n071.oi9244e8.bi6gxh9e.h676nmdw.aghb5jc5.gile2uim.qmfd67dx > div:nth-child(1) > div > div > div > div:nth-child(2) > div > input',
        postButton: 'form > div > div.rq0escxv.du4w35lb.ms05siws.pnx7fd3z.b7h9ocf4.pmk7jnqg.j9ispegn.kr520xx4.pedkr2u6.oqq733wu > div > div > div.j83agx80.btwxx1t3.s8dhs3de.mfofr4af.hihg3u9x.ggxiycxj.hjequu9d.ssoat4ej.f344zkr0.s9tcezmb > div > div.ihqw7lf3.discj3wi.l9j0dhe7 > div.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.pfnyh3mw.i1fnvgqd.gs1a9yip.owycx6da.btwxx1t3.hv4rvrfc.dati1w0a.discj3wi.dlv3wnog.rl04r1d5.enqfppq2.muag1w35 > div.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.d2edcug0.hpfvmrgz.buofh1pr.g5gj957u.ph5uu5jm.b3onmgus.e5nlhep0.ecm0bbzt.mg4g778l > div > div',
        progressBar: "SPAN[role=progressbar]",
        staffMembersContainer: [
            // William
            'div.j83agx80.cbu4d94t.d6urw2fd.dp1hu0rb.l9j0dhe7.du4w35lb > div.l9j0dhe7.dp1hu0rb.cbu4d94t.j83agx80 > div.j83agx80.cbu4d94t.buofh1pr > div',
            // Dominique
            'div[role=main] div.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.pfnyh3mw.d2edcug0.aahdfvyu.tvmbv18p > div.l9j0dhe7.du4w35lb.rq0escxv.j83agx80.cbu4d94t.pfnyh3mw.d2edcug0.ofv0k9yr.cwj9ozl2',
        ],
        // this is from the above, and is the root for the following
        staffMemberContainerElement: 'div.b20td4e0.muag1w35 > div',
        staffMemberName: 'span > span > span > a {innerHTML}',
        staffMemberProfileUrl: 'span > span > span > a {propMatch("href",/((?<=user\\/).*(?=\\/))|((?<=user\\/).*(?=\\/)?)/g).href}',
        staffMemberRoles: 'div > span > span > div > span > span.a8c37x1j.ni8dbmo4.stjgntxs.l9j0dhe7.ltmttdrg.g0qnabr5 {innerText.trim()}',
    },
    FacebookGroups: {
        memberRequestContainer: 'div.q6o897ci.d2edcug0.sej5wr8e.jei6r52m.o8rfisnq.tn7ubyq0',
        memberRequestContainers: 'div.a8nywdso.f10w8fjw.rz4wbd8a.pybr56ya',
        memberRequestContainerTimestamp: '.rj1gh0hx.buofh1pr.g5gj957u.p8fzw8mz.pcp91wgn.iuny7tx3.ipjc6fyt > div > div:nth-child(2) > span',
        memberRequestContainerName: '.rj1gh0hx.buofh1pr.g5gj957u.p8fzw8mz.pcp91wgn.iuny7tx3.ipjc6fyt > div > div:nth-child(1) > span > span > span > a {innerText.trim()}',
        // below is almost identical to the above as it's the same element
        memberRequestsProfileUrl:   '.rj1gh0hx.buofh1pr.g5gj957u.p8fzw8mz.pcp91wgn.iuny7tx3.ipjc6fyt > div > div:nth-child(1) > span > span > span > a {href}',
        memberRequestQuestionElement: 'ul li',
        memberRequestQuestionElementQuestionAnswerText: 'span',
        memberRequestLinks: 'a[role=link] {href}',
        memberRequestContainerItem: 'a[href="/groups/%%GROUPID%%/user/%%USERID%%/"]',
        memberRequestApproveButton: '{parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement} div[aria-label="Approve"]',
        memberRequestDeclineButton: '{parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement} div[aria-label="Decline"]',
        memberRequestFindAByHref: 'a[href="{{href}}"]',    // remove after v1.18
        memberRequestFindApproveButtonFromHref: '{parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement} div[aria-label="Approve"]',    // remove after v1.18
        memberRequestFindDeclineButtonFromHref: '{parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement} div[aria-label="Decline"]',    // remove after v1.18
    
        memberGatherContainer: "body div {parentElement.parentElement}",
        memberGatherScroll: "body div {parentElement.parentElement}",   // remove after v1.18
        memberGatherTitles: "h2 {propMatch('innerText', 'New to the group').parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.nextSibling} div span span span a",   // remove after v1.18
        allMembersGatheredToScrape: "[role='listitem']",
        // from each of the above members as a starting point, here's what we can get...
        memberGatherContainerName: "{innerText}",
        memberGatherContainerDate: "SPAN.j5wam9gi.lrazzd5p.m9osqain {innerText}",
        memberGatherContainerUrl: "span span span a {href}",
        memberGatherContainerFromTitle: "{parentElement.parentElement.parentElement.parentElement.parentElement.children[1]}",  // remove after v1.18
        memberGatherContainerFromTitleInnerText: "{innerText}",  // remove after v1.18
        timestampOfMemberGatheredFromTitle: '{parentElement.parentElement.parentElement.parentElement.nextSibling.innerText}',  // remove after v1.18
        memberParsingHrefParts: "{href.split('/')}",   // remove after v1.18
        memberParsingInnerText: "{innerText}",   // remove after v1.18
        memberViewAnswersButton: "span {propMatch('innerText', 'View Answers').parentElement.parentElement}",
        memberViewNoAnswersYetButton: "span {propMatch('innerText', 'No Answers yet').parentElement.parentElement}",
        memberQuestionsDialog: 'div[aria-label="Membership questions"]',
        memberQuestionsContainer: [
            // Dominique
            'DIV.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.pfnyh3mw.d2edcug0.hpfvmrgz.buofh1pr > DIV {merge.slice(1)}',  // the first item is the dialog header so we remove it to get only the question items
            // William (for Dominique this matched on the "Edit Answers" button)
            'div > div > div h2 {parentElement.parentElement.lastChild.lastChild.lastChild.lastChild.lastChild.children}',
        ],
        memberQuestionsContainerQuestion: [
            // Dominique
            '.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg > div > span{merge[0].innerText}',    // the first match is the question
            // William
            'span > span{merge[0].innerText}',
        ],
        memberQuestionsContainerAnswer: [
            // Dominique
            '.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg > div > span{merge[1].innerText}',    // the second match is the answer
            // William (for DOminique there was no second match)
            'span > span{merge[1].innerText}',
        ],
        timestamp: '(([0-9]*)|a|an) (minute(s?)|hour(s?)|second(s?)|day(s?)|week(s?)|month(s?)|year(s?))',
    },
    FacebookProfile:{
        friendUnfriendButton: 'div.bp9cbjyn.j83agx80.taijpn5t.c4xchbtz.by2jbhx6.a0jftqn4 > div:nth-child(2) > span > span',
        unfriendButton: 'div.iqfcb0g7.tojvnm2t.a6sixzi8.k5wvi7nf.q3lfd5jv.pk4s997a.bipmatt0.cebpdrjk.qowsmv63.owwhemhu.dp1hu0rb.dhp61c6y.l9j0dhe7.iyyx5f41.a8s20v7p > div > div > div.rq0escxv.jgsskzai.cwj9ozl2.nwpbqux9.io0zqebd.m5lcvass.fbipl8qg.nwvqtn77.ni8dbmo4.stjgntxs > div > div > div > div.j83agx80.cbu4d94t.buofh1pr.l9j0dhe7 > div > div:nth-child(3) > div.bp9cbjyn.j83agx80.btwxx1t3.buofh1pr.i1fnvgqd.hpfvmrgz > div > div > span',
        confirmUnfriend: 'div.iqfcb0g7.tojvnm2t.a6sixzi8.k5wvi7nf.q3lfd5jv.pk4s997a.bipmatt0.cebpdrjk.qowsmv63.owwhemhu.dp1hu0rb.dhp61c6y.l9j0dhe7.iyyx5f41.a8s20v7p > div > div > div > div.a8nywdso.ihqw7lf3.rz4wbd8a.jb3vyjys.bkfpd7mw.btwxx1t3.j83agx80 > div > div:nth-child(1) > div.oajrlxb2.g5ia77u1.qu0x051f.esr5mh6w.e9989ue4.r7d6kgcz.nhd2j8a9.p7hjln8o.kvgmc6g5.cxmmr5t8.oygrvhab.hcukyx3x.jb3vyjys.rz4wbd8a.qt6c0cv9.a8nywdso.i1ao9s8h.esuyzwwr.f1sip0of.n00je7tq.arfg74bv.qs9ysxi8.k77z8yql.abiwlrkh.p8dawk7l.lzcic4wl.rq0escxv.pq6dq46d.cbu4d94t.taijpn5t.l9j0dhe7.k4urcfbm > div',
        groupUrlPrefix: 'https://www.facebook.com/groups/'
    },
    InstagramMsgs: {
        primaryTab: "nav a[href='/direct/inbox/']",
        generalTab: "nav a[href='/direct/inbox/general/']",
        chatInfoName: "[role='button'] [aria-labelledby] > div:nth-child(2) > div:nth-child(2)",
        chatInfoButton: "button {has([aria-label=\"View Thread Details\"])}",
        chatInfoCloseButton: [
            "button {has([aria-label=\"View Thread Details\"])}",  // old
            "div.pV7Qt._6Rvw2.qF0y9.Igw0E.IwRSH.YBx95.ybXk5._4EzTm.i0EQd > div:nth-child(2) button"  // first button in second column
        ],
        chatElem: ".rOtsg .KV-D4 .KV-D4",
        chatsLoading: "[data-visualcompletion=\"loading-state\"]",
        messageOrDateDiv: [
            // the first two are for messages (Williams then Doms), the last for dates
            ".VUU41 > div >.DMBLb, div.frMpI > div > div > .DMBLb, div .l4b0S",
        ],
        dateDiv: "div .l4b0S",
        sentFolderCheck: "{parentElement} .VdURK",
        body: "span {innerText} {merge('')}",
        audioAttachments: "audio > source {src}",
        videoAttachments: "video > source {src}",
        imageAttachments: "img {src}",
        openAccountsButton: "BUTTON.sqdOP.yWX7d.y3zKF",
        accountsItem: "DIV[role=dialog] DIV._7UhW9.xLCgt.qyrsm.KV-D4.uL8Hv",
        accountsItemButton: "DIV[role=button]",
        accountsDialog: "DIV[role=dialog]",
        closeAccountsButton: "div",
        closeAccountsDialog: "body > div.RnEpo.Yx5HN",
        newMessageButton: "DIV.oNO81 BUTTON.wpO6b.ZQScA > DIV.QBdPU",
        userSearch: "[name=\"queryBox\"]",
        userList: ".vwCYk  > .-qQT3",
        nextButton: ".cB_4K:not([disabled])",
        infoButton: "BUTTON.wpO6b.ZQScA",
        messageTextarea: ".ItkAi textarea",
        sendButton: ".JI_ht > button",
        loginDialogBoxCloseButton: 'button svg[aria-label="Close"]{.parentElement}',
        threadMessagesOpenButton: 'button svg[aria-label="View Thread Details"] {parentElement}',
        threadDetailsMessagesUsername: ".Eyjts div div div div div div div {propMatch('innerText', '%%USERNAME%%').parentElement.firstChild.innerText}",
        threadMessagesCloseButton: 'div svg[aria-label="Navigate back to chat from thread details"] {parentElement}'
    },
    InstagramPosts: {
        instagramButton: "#media_manager_chrome_bar_instagram_icon",
        createPostButton: [
            "#mediaManagerLeftNavigation .yukb02kx",
            "DIV.tb2mzrle.kpktq7sn.lvc0iid1.p7k9k0yn.aj9uqy00.aut7kocs.fislnrqo.reiujez5 DIV[role=button]"],
        instagramFeedButton: "div[role=\"menu\"] div[role=\"menuitem\"]",
        slidingTray: "#creator_studio_sliding_tray_root",
        addFileButton: "div[aria-haspopup] i",
        uploadFileButton: "div.uiContextualLayer.uiContextualLayerBelowLeft a:first-of-type",
        accountNames: "#creator_studio_sliding_tray_root [role=\"button\"] span > div[style]",
        fromFileUploadButton: "input[type=\"file\"]",
        captionTextarea: "div[aria-autocomplete=\"list\"]",
        postButton: "._3qnf > ._1qjd",
        tabHeader: "#tabHeader",
        tabHeaderDropdown: "#tabHeader i",
        dropdownAccountNames: ".uiScrollableAreaContent > div > div > div:nth-child(3) > div:first-child",
        singleAccountName: "#tabHeader > div> div:nth-child(2) > div"
    },
    PinterestScrape: {
        randomDialogCloseBttn: "DIV[role=dialog] BUTTON[aria-label=cancel]",
        headerProfile: "div[data-test-id=\"header-profile\"] > a",
        createButton: "div[data-test-id=\"boardActionsButton\"] button",
        createPinButton: "div[data-test-id=\"Create Pin\"] div[role=\"button\"]",
        pinTitleTextarea: "textarea[id^=\"pin-draft-title\"]",
        imageInput: "input[id^=\"media-upload-input\"]",
        descriptionTextarea: "div[aria-autocomplete=\"list\"]",
        linkTextarea: "textarea[id^=\"pin-draft-link\"]",
        altTextButton: "div[data-tutorial-id^=\"pin-builder-title\"] button",
        altTextarea: "textarea[id^=\"pin-draft-alttext\"]",
        boardSelectButton: "button[data-test-id=\"board-dropdown-select-button\"]",
        boardSearchInput: "input#pickerSearchField",
        foundBoards: "[data-test-id=\"boardWithoutSection\"] div[role=\"button\"]",
        createBoardButton: "div[data-test-id=\"create-board\"] div[role=\"button\"]",
        createBoardFinalButton: "div[aria-label=\"Board form\"] button",
        savePinButton: "button[data-test-id=\"board-dropdown-save-button\"]",
        seeItNowButton: "div[data-test-id=\"seeItNow\"] > a",
        messagesButton: [
            'button[aria-label=Messages]',
            '[aria-label=Messages][role=button]'
        ],
        chatDivs: ".appContent > .zI7 ul > div [role=\"button\"]",
        chatTimestamp: ".Eqh .swG",
        backButton: "button[aria-label=\"Back to conversations list\"]",
        moreParticipants: ".appContent > .zI7 > div >div > div:first-child [style=\"cursor: none;\"] > div",
        participants: ".appContent > DIV.zI7 > DIV.QLY > DIV.VxL SPAN.tBJ > DIV > a",
        messageDivs: ".appContent > DIV.zI7 > DIV > DIV > DIV:nth-child(2) > DIV > DIV.Jea > DIV > DIV > DIV > DIV > DIV > DIV.hjj",
        composeButton: "button[aria-label=\"Compose new message\"]",
        returnToConversationsButton: "button[aria-label=\"Back to conversations list\"]",
        contactSearch: "#contactSearch",
        searchResults: ".Cii .Ll2 > div",
        messageTextarea: "#messageDraft",
        messageSendButton: "button[aria-label=\"Send message to conversation\"]"
    },
    TikTokScrape: {
        findLoggedUserId: 'html {html().match(/uniqueId":".*?(",)/g}',
        videoInput: "input[type=\"file\"]",
        coverCandidate: "video.candidate",
        captionTextarea: "div[aria-autocomplete]",
        canviewPublic: "input[type=\"radio\"][value=\"0\"]",
        canviewPrivate: "input[type=\"radio\"][value=\"1\"]",
        canviewFriends: "input[type=\"radio\"][value=\"2\"]",
        allowComments: "input[value=\"comment\"]",
        allowDuet: "input[value=\"duet\"]",
        allowStitch: "input[value=\"stitch\"]",
        postButton: [
           "button.btn-post",   // older version
           "button.tiktok-btn-pc-primary"
        ],
        viewProfileButton: "div.modal > div:nth-child(3)",
        videoLinks: [
            "div.video-feed a",  // older version
            "div[data-e2e=user-post-item] a"
        ],
        messageEditor: 'div.notranslate.public-DraftEditor-content',
        conversationMessages: 'DIV.conversation-container DIV.conversation-main > DIV',
        sendMessageButton: 'div.send-button',
        profileMessageSendButton: '.tiktok-1djryq8-DivMessageContainer > a',
    },
    TikTokMessages: {
        chatScroll: '.side-scroll-wrapper',
        chatsList: '.side-scroll-wrapper > div',
        chatTimestamp: '.info-time',
        userUniqueId: '.unique-id',
        participantName: '.nickname',
        chatsListItemClickAble: '.info-text-wrapper',
        messageBox: '.conversation-main',
        messageContainer: '.conversation-main > div',
        messageContainerMsg: '.conversation-main > div.conversation-item-wrapper',
        messageDiv: '.text-container',
        parentFromMessageDivMyself: 'div {classList}',
    },
    TwitterScrape: {
        homeButton: "a[href=\"/home\"]",
        tweetTextarea: "div[aria-multiline]",
        imageInput: "input[type=\"file\"]",
        errorMessage: "DIV[role=alert]",
        tweetButton: "div[data-testid=\"tweetButtonInline\"]",
        tweetLink: "div[data-testid=\"tweet\"] a[aria-label]",
        messagesPage: "a[aria-label=\"Direct Messages\"] div",
        composeMessage: "a[aria-label=\"Compose a DM\"] div",
        searchProfile: "input[aria-label=\"Search query\"]",
        profilesList: [
            "li[role=\"listitem\"] div[dir=\"ltr\"] span",  // old
            "DIV[data-testid=typeaheadResult] DIV[data-testid=TypeaheadUser] > DIV:nth-child(2) DIV.css-901oao.css-bfa6kz.r-14j79pv.r-18u37iz.r-37j5jr.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-qvutc0 > SPAN"
        ],
        messageNextButton: "div[data-testid=\"nextButton\"]",
        messageTextarea: "div[data-testid=\"dmComposerTextInput\"]",
        inputFile: "input[type=\"file\"]",
        sendMessageButton: "div[aria-label=\"Send\"]",
        cancelMessageButton: "div[aria-modal=\"true\"] div[aria-label=\"Close\"]",
        conversationsList: "div[aria-label=\"Timeline: Messages\"] > div >  div",
        // NOTE: there are differences depending on how wide the window is.
        messagesContainer: [
            "section[aria-labelledby=\"detail-header\"] > div:nth-child(2) > div  > div > div  > div > div  > div > div:last-child  > div > div",
            "DIV.css-1dbjc4n.r-16y2uox.r-1h0z5md.r-1jgb5lz > DIV > DIV"
        ],
        // messagesContainer: "[role=\"main\"] > div > div > div > div:nth-child(2) > div > div > div > div > div > div > div"
        chatProfileLink: [
            "[aria-labelledby=\"detail-header\"] [role=\"button\"] > div > div:nth-child(1) [role=\"link\"]",
            "DIV[data-testid=\"UserCell\"][role=\"button\"] > div > div:nth-child(2) A[role=\"link\"]"
        ],
        chatProfileName: [
            "[aria-labelledby=\"detail-header\"] [role=\"button\"] > div A[role=\"link\"] span > span",
            "DIV[data-testid=\"UserCell\"][role=\"button\"] > div > div:nth-child(2) A[role=\"link\"] span > span"
        ],
        chatInfo: "[aria-label=\"Conversation info\"], [aria-label=\"Group info\"]",
        chatInfoBack: "[aria-label=\"Back\"]",
        msgTimeButton: "> div[role=\"button\"] > div > div > div[dir=\"auto\"]",  // this is actually a parameter to find(), and we have the intermediate divs to avoid getting the "Seen"
        msgEntry: "[data-testid=\"messageEntry\"]",
        msgLink: "div[data-focusable=\"true\"][role=\"link\"]",
        chatsTab: "div[role=\"tab\"]",
        returnFromChatsTab: "div[aria-label=\"Back\"][role=\"button\"]",
    },
    Pages: {
        // DRL FIXIT? For this section we may want to conform to the following for each platform for conversation pages:
        // - an entry to find the header for a conversation - our icon is positioned here
        // - an entry to find the display name (name) inside the header
        // - an entry to find the username (handle) inside the header
        // and perhaps similar standards for profile pages and posts. The goal being that we can easily change the
        // constants when the site changes their UI, preferably without having to change our code.
        profileNameFB: [    // DRL FIXIT! Looks like this is no longer used?
            "DIV.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.pfnyh3mw.taijpn5t.gs1a9yip.owycx6da.btwxx1t3.ihqw7lf3.cddn0xzi SPAN > H1.gmql0nx0.l94mrbxd.p1ri9a11.lzcic4wl.bp9cbjyn.j83agx80",
            "DIV.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.g5gj957u.d2edcug0.hpfvmrgz.on77hlbc.buofh1pr.o8rfisnq.ph5uu5jm.b3onmgus.ihqw7lf3.ecm0bbzt DIV.bi6gxh9e.aov4n071 > H2.gmql0nx0.l94mrbxd.p1ri9a11.lzcic4wl.d2edcug0.hpfvmrgz > SPAN",
            "DIV.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.pfnyh3mw.d2edcug0.bp9cbjyn.jb3vyjys DIV.bi6gxh9e.aov4n071 > SPAN > H1",
            "div > div:nth-child(1) > div > div.rq0escxv.l9j0dhe7.du4w35lb > div > div > div.j83agx80.cbu4d94t.d6urw2fd.dp1hu0rb.l9j0dhe7.du4w35lb > div.j83agx80.cbu4d94t.dp1hu0rb > div > div > div:nth-child(1) > div.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.pfnyh3mw.taijpn5t.gs1a9yip.owycx6da.btwxx1t3.ihqw7lf3.cddn0xzi > div > div > div > div.j83agx80.psu0lv52.mpmpiqla.ahl66waf.tmq14sqq.rux31ns4.gy1kt949.sjcfkmk3.dti9y0u4.nyziof1z > div > div > div > div > div > span > h1"
        ],
        facebookProfileActions: [
            'div.btwxx1t3.j83agx80.bp9cbjyn div[aria-label="Message"] {parentElement.parentElement.parentElement}',
            'div[data-pagelet="ProfileActions"] div[aria-label="Message"] {parentElement.parentElement.parentElement}',
            'DIV[role="main"] DIV[aria-label="Message"] {parentElement.parentElement.parentElement}',
        ],
        personCardFB: 'DIV.art1omkt.pedkr2u6.ijkhr0an.s13u9afw',
        personCardFBProfileURL: 'A.oajrlxb2.g5ia77u1.qu0x051f.esr5mh6w.e9989ue4.r7d6kgcz.rq0escxv.nhd2j8a9.nc684nl6.p7hjln8o.kvgmc6g5.cxmmr5t8.oygrvhab.hcukyx3x.jb3vyjys.rz4wbd8a.qt6c0cv9.a8nywdso.i1ao9s8h.esuyzwwr.f1sip0of.lzcic4wl.gmql0nx0.gpro0wi8 {href}',
        personCardFBName: 'A.oajrlxb2.g5ia77u1.qu0x051f.esr5mh6w.e9989ue4.r7d6kgcz.rq0escxv.nhd2j8a9.nc684nl6.p7hjln8o.kvgmc6g5.cxmmr5t8.oygrvhab.hcukyx3x.jb3vyjys.rz4wbd8a.qt6c0cv9.a8nywdso.i1ao9s8h.esuyzwwr.f1sip0of.lzcic4wl.gmql0nx0.gpro0wi8 {innerText.trim()}',
        personCardFBButtonRow: 'DIV.rl04r1d5.dlv3wnog.j83agx80.bp9cbjyn.taijpn5t',
        // DRL FIXIT! We should split this for items with different URL styles using urlMatch!
        postAuthorFB: [
            // live
            '{urlMatch(/facebook.com\\/watch\\/live\\//g)} div[role=main] div[data-instancekey] div.l9j0dhe7.fdg1wqfs.jq4qci2q.av1wybal.j102wcjv a',
            // everything else
            "DIV[role=article] DIV.pybr56ya.dati1w0a.hv4rvrfc.n851cfcs.btwxx1t3.j83agx80.ll8tlv6m DIV.j83agx80.cbu4d94t DIV.qzhwtbm6.knvmm38d > SPAN.d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.oi732d6d.ik7dh3pa.a8c37x1j.keod5gw0.nxhoafnm.aigsh9s9.d9wwppkn.fe6kdd0r.mau55g9w.c8b282yb.iv3no6db.jq4qci2q.a3bd9o3v.knj5qynh.m9osqain.hzawbc8m",
            "DIV[role=article] DIV.pybr56ya.dati1w0a.hv4rvrfc.n851cfcs.btwxx1t3.j83agx80.ll8tlv6m DIV.j83agx80.cbu4d94t DIV.qzhwtbm6.knvmm38d > SPAN > H4 SPAN > A[role=link]",
            // posts on someones profile page
            "DIV[role=article] DIV.pybr56ya.dati1w0a.hv4rvrfc.n851cfcs.btwxx1t3.j83agx80.ll8tlv6m DIV.j83agx80.cbu4d94t DIV.qzhwtbm6.knvmm38d > SPAN > H3 SPAN > A[role=link]",
            "DIV[role=article] DIV.pybr56ya.dati1w0a.hv4rvrfc.n851cfcs.btwxx1t3.j83agx80.ll8tlv6m DIV.j83agx80.cbu4d94t DIV.qzhwtbm6.knvmm38d > SPAN > H2 SPAN > A[role=link]",
            'div.buofh1pr > div > div:nth-child(1) > span > div > h2 > span > span > a',
            'div.rs0gx3tq.oi9244e8.buofh1pr > div > div:nth-child(1) > span > h2 > span > a',
            'div[role="complementary"] span[dir="auto"] > h2',
            'div[aria-label="Videos on Facebook Watch"] div[aria-label="Like"][role="button"]{parentElement}',
            'div[role="complementary"] h2 a[role="link"]',
            'div#watch_feed h2 a[role="link"]'      // https://www.facebook.com/watch/?ref=saved&v=356971973159738
//            'div[role=main] div[role=article]'
        ],
        // DRL NOTE: We can split this per page type using urlMatch in case it changes in one type of page or another
        // and also to make sure the buttons don't appear on pages we haven't tested.
        postMenuItem: [
            // personal feed, groups
            '{urlMatch(/facebook.com\\/$|facebook.com\\/groups\\//g)} div {propMatch("aria-label", localizedKeywords.FacebookPosts.postActionsBoxBtnForCheckingAvailableScrapingMethod).parentElement}',
            // pages and profiles
            '{urlMatch(/facebook.com\\/[a-zA-Z0-9]+$|facebook.com\\/profile\\.php/g)}  div {propMatch("aria-label", localizedKeywords.FacebookPosts.postActionsBoxBtnForCheckingAvailableScrapingMethod).parentElement}',
        ],
        facebookOpenPostWatchLive: 'div.i09qtzwb.rq0escxv.n7fi1qx3.pmk7jnqg.j9ispegn.kr520xx4.nhd2j8a9',
        savedPostActionsContainerFB: [ 
            // For William
            'div.hpfvmrgz.knvmm38d.dhix69tm.i1fnvgqd.buofh1pr.cbu4d94t.j83agx80 > div > div:nth-child(3) > div.lhclo0ds.btwxx1t3.j83agx80 {parentNode.parentNode.parentNode}',
            // For Dom, DRL FIXIT? This isn't showing in a very good location!
            //'a[href] div.pmk7jnqg.k4urcfbm.datstx6m img {parentNode.parentNode.parentNode.parentNode.parentNode.parentNode}'
        ],
        savedPostActionsCollectionFB: [
            'div[role="main"] a[role="link"] span span'
        ],
        savedPostActionsCollectionAppendMenuToFB: '{parentElement.parentElement.parentElement.parentElement}',
        savedPostActionsCollectionPermanentLinkFB: '{parentElement.parentElement.href}',
        savedPostActionsContainer: [
           'div.i1fnvgqd.buofh1pr.cbu4d94t.j83agx80 > div:nth-child(3) > div'
        ],
        // these are starting from the savedPostActionsContainerFB node
        savedPostHref: "a {href}",
        savedPostAuthorURL: "a {nextElementSibling} :scope :nth-child(2) span > a {href}",
        savedPostAuthorName: "a {nextElementSibling} :scope :nth-child(2) span > a > span {innerText.trim()}",
        savedPostBody: "a span span {innerText.trim()}",

        groupTitleFB: 'div.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.d2edcug0.g5gj957u.p8fzw8mz.pcp91wgn.ipjc6fyt.rj1gh0hx.dtpq6qua.p01isnhg.ihqw7lf3.bkfpd7mw > div',


        facebookGroupQuestions: 'div.sej5wr8e div.tvmbv18p > span[dir="auto"]',
        facebookGroupQuestionsTypeElement: '{parentElement.parentElement.parentElement.nextSibling.nextSibling.innerText}',
        facebookGroupQuestionsLabel: '{parentElement.parentElement.parentElement.nextSibling.innerText}',
        facebookGroupQuestionOptionElements: '{parentElement.parentElement.parentElement.nextSibling.nextSibling.firstChild.firstChild.children}',
        facebookGroupQuestionsOptionElementInnerText: '{innerText}',
        facebookGroupQuestionsOptionElementLabel: '{parentElement.parentElement.parentElement.nextSibling.innerText}',
    
        instagramConversationHeader: "DIV._ab8s._ab8w._ab94._ab99._ab9f._ab9m._ab9o DIV._aa4m._aa4p",
        instagramConversationHeaderName: ":root BUTTON._acan._acao._acaq._acat {innerText.trim()}",
        // select all the sender icons and get the URL from one of them
        instagramConversationHeaderAddress: ":root DIV._ab8s._ab8w._ab94._ab99._ab9f._ab9m._ab9o a[role=link] {href.split('/')[3]}",    // https://www.instagram.com/MyName/
        pinterestConversationHeader: "DIV.QLY._he.p6V.zI7.iyn.Hsu DIV.tBJ.dyH.iFc.sAJ.O2T.tg7.IZT.mWe.CKL A {parentElement}",
        pinterestConversationHeaderName: "A {innerText.trim()}",
        pinterestConversationHeaderAddress: "A {href.split('/')[3]}", // https://www.pinterest.ca/MyName/
        twitterConversationHeader: "DIV[data-testid=conversation] > DIV",
        twitterConversationHeaderName: "DIV.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > DIV:nth-child(1) SPAN {innerText.trim()}",
        twitterConversationHeaderAddress: "DIV.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > DIV:nth-child(2) SPAN {propMatch('innerText', /@/).innerText.replace('@', '').trim()}",
        tiktokConversationHeader: "div.conversation-header",
        tiktokConversationHeaderName: "p.nickname {innerText}",
        tiktokConversationHeaderAddress: "p.unique-id {propMatch('innerText', /@/).innerText.replace('@', '').trim()}",

        profileNameMsngr: [
            // works with fr-CA and english on messenger and facebook
            "H1 > SPAN > SPAN.a8c37x1j",
            // For Dominique in both
            "H2 > SPAN.d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.oi732d6d.ik7dh3pa.a8c37x1j.keod5gw0.nxhoafnm.aigsh9s9.d9wwppkn.fe6kdd0r.mau55g9w.c8b282yb.iv3no6db.a5q79mjw.g1cxx5fr.lrazzd5p.oo9gr5id.oqcyycmt",
            // in Messenger.com?? Dom: If I put this first I get multiple matches.
            "DIV.f4tghd1a.ifue306u.kuivcneq.t63ysoy8 SPAN > A[role=link]"
        ],
        profileNameMsngrList: [
            // for William
            'div[data-testid="mwthreadlist-item-open"] a',
            // for Dominique
            'DIV[role=gridcell] > DIV > A[role=link]'
        ],
        profileNameMsngrListName: "span > span",  // offset from the above, returns multiple, use first
        profileNameInsta: "H1.rhpdm",
        postAuthorInsta: "ARTICLE[role=presentation] HEADER",
        profileNameInstaDirect: "DIV.AjEzM.Ljd8Q",  // remove after v1.23
        profileNameInstaDirectName: "DIV.m7ETg > DIV.Igw0E.rBNOH.eGOV_.ybXk5._4EzTm BUTTON._4pI4F._8A5w5 DIV > DIV:first-child",    // remove after v1.23
        profileNamePint: "div[data-test-id=\"profile-header\"] h1",  // remove after v1.23
        postWrapperPint: "DIV[data-test-id=pinWrapper]",
        returnToConversationsButtonPint: "button[aria-label=\"Back to conversations list\"]",
        conversationNamePint: "SPAN A",
        pinterestPostPageDropdownButtonLocationSelector: 'div[data-test-id="closeupActionBar"] > div > div[data-test-id="closeup-action-items"]',
        profileNameTikTok: [
           "DIV.share-title-container > H2.share-title",    // old?
           "DIV[data-e2e=user-page] H2[data-e2e=user-title]"
        ],
        postWrapperTikTok: "DIV[class*=DivVideoCardContainer]",
        postSidebarFromPostWrapper: '{parentElement.parentElement}.tiktok-wc6k4c-DivActionItemContainer',

        tiktokMessengerConversationHeader: 'div.conversation-header',   // remove after v1.23

        profileNameSalesNavigator: "SPAN.profile-topcard-person-entity__name",
        profileNameTwitter: [
           "DIV.css-1dbjc4n.r-6gpygo.r-14gqq1x > DIV.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > DIV.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > DIV.css-1dbjc4n.r-1awozwy.r-18u37iz.r-dnmrzs > DIV.css-901oao.r-18jsvk2.r-1qd0xha.r-1vr29t4.r-bcqeeo.r-qvutc0",
           "DIV.css-901oao.r-1awozwy.r-18jsvk2.r-6koalj.r-37j5jr.r-adyw6z.r-1vr29t4.r-135wba7.r-bcqeeo.r-1udh08x.r-qvutc0 > SPAN.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0 > SPAN.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0",
            "div[data-testid=\"UserName\"] div[dir=auto] span span"
        ],
        postWrapperTwitter: "ARTICLE[data-testid=tweet] > DIV:first-child",
        
        conversationHeaderTwitter: "DIV[data-testid=conversation] > DIV",   // remove after v1.23
        conversationHeaderTwitterName: "DIV.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > DIV:nth-child(1) SPAN",  // remove after v1.23
        conversationHeaderTwitterHandle: "DIV.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > DIV:nth-child(2) SPAN",    // remove after v1.23
        gmailSender: [
            "TD[role=gridcell] SPAN[email]",                                        // email list view
            "DIV[role=listitem] TABLE.cf.gJ > TBODY > TR:first-child SPAN[email]"   // email item view
        ],
        gmailSenderName: "{getAttribute('name')}",
        gmailSenderEmail: "{getAttribute('email')}",
        senderNameGmail: [    // remove after v1.23
            "DIV[role=listitem] TABLE.cf.gJ > TBODY > TR:first-child SPAN[email]",
            "TD[role=gridcell] SPAN[email]"],
        outlookSender: "DIV[draggable=true] DIV.MtC_r.Lf0qr.jYIx5 > SPAN[title]",
        outlookSenderName: "{innerText.trim()}",
        outlookSenderEmail: "{getAttribute('title')}",
        senderNameOutlook: [    // remove after v1.23
            "DIV._1yIHkYLrqDZpAMQ3L2YILh._1E-ojjaYGhOxCgHp9Pe315._2Ht9U0YzzfQGXALqVdO2MN DIV._3J_S6fOI4B5tFT8R6qMqT7 > SPAN[title]",  // read
            "DIV._1yIHkYLrqDZpAMQ3L2YILh._1E-ojjaYGhOxCgHp9Pe315._2Ht9U0YzzfQGXALqVdO2MN DIV._3zJzxRam-s-FYVZNqcZ0BW > SPAN[title]",   // unread
            "DIV[draggable=true] ._2ZDUqsleGa-jar5wAYvVzV SPAN[title]"
        ],


        globalDropdownBtnLocationFacebook: 'div[role="main"] {parentElement}',
        globalDropdownBtnLocationMessenger: 'div[role="main"]',
        globalDropdownBtnLocationInstagram: 'main[role="main"]',
        globalDropdownBtnLocationTwitter: '#react-root',
        globalDropdownBtnLocationTikTok: '#app div:nth-child(1)',
        globalDropdownBtnLocationPinterest: '.mainContainer',
        globalDropdownBtnLocationGmail: [
            'div.no > div.nH.vxm5ce.nn div[role="complementary"] div[role="tablist"]',
            'div.no > div.nH.bAw.nn div[role="complementary"] div[role="tablist"]'
        ],
        globalDropdownBtnLocationOutlook: '#whatsnew {parentElement.parentElement}',
    },
    PostsFacebook: {
        // sometimes we have the A element and sometimes a parent
        postAuthorName: [
            '{selfOrChildrenBySelector("H2 A")[0].innerText.trim()}',
            '{selfOrChildrenBySelector("A")[0].innerText.trim()}',
        ],
        postAuthorURL: [
            // duplicated for FB comments above
            // NOTE: live video won't have an author we can easily get, so it's parsed at the "saved posts" page
            '{selfOrChildrenBySelector("H2 A")[0].href}',
            '{selfOrChildrenBySelector("A")[0].href}',
        ],
        postWrapperFromAuthor: [
            // finds the wrapper element given the author element
            "{parentBySelector('.pybr56ya.dati1w0a.hv4rvrfc.n851cfcs.btwxx1t3.j83agx80.ll8tlv6m').parentElement.nextSibling}",
            "#watch_feed > div > div:nth-child(1) > div > div > div {parentElement.nextSibling}"
        ],
        
        // these are from the wrapper above...
        postSeeMore: "DIV.oajrlxb2.g5ia77u1.qu0x051f.esr5mh6w.e9989ue4.r7d6kgcz.rq0escxv.nhd2j8a9.nc684nl6.p7hjln8o.kvgmc6g5.cxmmr5t8.oygrvhab.hcukyx3x.jb3vyjys.rz4wbd8a.qt6c0cv9.a8nywdso.i1ao9s8h.esuyzwwr.f1sip0of.lzcic4wl.oo9gr5id.gpro0wi8.lrazzd5p",
        postBody: [
            "DIV[data-ad-preview] > DIV > DIV.qzhwtbm6.knvmm38d > SPAN.d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.oi732d6d.ik7dh3pa.fgxwclzu.a8c37x1j.keod5gw0.nxhoafnm.aigsh9s9.d9wwppkn.fe6kdd0r.mau55g9w.c8b282yb.iv3no6db.jq4qci2q.a3bd9o3v.knj5qynh.oo9gr5id.hzawbc8m {innerText.trim()}",
            // for a post on a profile
            "DIV.qt6c0cv9.hv4rvrfc.dati1w0a.jb3vyjys > DIV.f530mmz5.b1v8xokw.o0t2es00.oo9gr5id > DIV.kvgmc6g5.cxmmr5t8.oygrvhab.hcukyx3x.c1et5uql {innerText.trim()}",
            // for a text, image or video post in a group
            "DIV.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg SPAN.d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.oi732d6d.ik7dh3pa.ht8s03o8.a8c37x1j.fe6kdd0r.mau55g9w.c8b282yb.keod5gw0.nxhoafnm.aigsh9s9.d9wwppkn.iv3no6db.jq4qci2q.a3bd9o3v.b1v8xokw.oo9gr5id.hzawbc8m {innerText.trim()}",
            // for a text post with a background in a group
            // DRL FIXIT? This post body has multiple pieces and we're only getting the first one:
            // https://www.facebook.com/realsabahali/posts/pfbid02C42XAKBKYE7XcRuBCB4WtdWiPa8ou36rFYEJnyHhy7Wi43H3avhgUhTjVUpxoxtBl
            "DIV:not([aria-hidden]) >DIV > DIV > DIV.kvgmc6g5.cxmmr5t8.oygrvhab.hcukyx3x.c1et5uql {innerText.trim()}",
        ],
        postImages: "A[role=link] IMG",
        postVideo: "VIDEO {src}",

        postMenuButton: "[role=button][aria-haspopup=menu]",
        postMenu: ".j34wkznp.qp9yad78.pmk7jnqg.kr520xx4 [role=menuitem]",
        postMenuEmbed: "",  // for backwards compatibility with v0.30, then we can remove
        postPopupInput: "[role=dialog] input[type=text]",
        postPopupClose: "[role=dialog] [aria-label=Close]",
    
        // this is for parsing a video or live post sitting on its own page
        // sometimes we have the A element and sometimes a parent
        videoPostAuthorName: '{selfOrChildrenBySelector("A")[0].innerText.trim()}', // remove after v1.19
        videoPostAuthorURL: '{selfOrChildrenBySelector("A")[0].href}',  // remove after v1.19
        videoPostDateStr: "{parentElement.parentElement.nextSibling} a[role=\"link\"] {innerText.replace(/\\n|\\r/g, '')}",  // remove after v1.19
        videoPostBody: "{parentElement.parentElement.parentElement.parentElement.parentElement.nextSibling.innerText}", // remove after v1.19
        videoPostVideoUrl: "video {getAttribute('src')}"    // remove after v1.19
    },
    PostsInstagram: {
        postWrapper: "ARTICLE",
        postAuthor: "SPAN.Jv7Aj.mArmR.MqpiF A.sqdOP.yWX7d._8A5w5.ZIAjV",
        postSeeMore: "BUTTON.sXUSN",
        postBody: [
            "DIV[data-testid=post-comment-root] > SPAN._8Pl3R > SPAN",
            "DIV > UL > DIV > LI DIV > SPAN"
        ],
        postImages: "DIV.eLAPa > DIV.KL4Bh > IMG",
        postVideo: "VIDEO",
        postCommentButton: 'section.ltpMr.Slqrh > span._15y0l > button',
        postDialog: 'div[role="dialog"] > article[role="presentation"]',
        postTimestamp: 'time[datetime] {getAttribute("datetime")}'
    },
    PostsPinterest: {
        postAuthor: "DIV.tBJ.dyH.iFc.MF7.pBj.DrD.IZT.swG.z-6",
        postBody: "A > DIV.tBJ.dyH.iFc.MF7.pBj.DrD.mWe",
        postImage: "IMG",
        postVideo: "VIDEO",
    },
    PostsTikTok: {
        postWrapper: "DIV[class*=DivItemContainer]",
        postAuthor: "H3[class*=H3AuthorTitle]",
        postBody: "DIV[data-e2e*=video-desc]",
        postImage: "IMG[class*=ImgPoster]",
        postVideo: "DIV[class*=DivBasicPlayerWrapper] VIDEO",
        postBtnShare: "{parentElement} div.tiktok-wc6k4c-DivActionItemContainer.e1e0ediu0 span[data-e2e=\"share-icon\"] {parentElement}",
        postBtnEmbed: "a[data-e2e=\"video-share-embed\"]",
        postIdGetter: "textarea.tiktok-myg5zh-TextareaEmbedCode {value.match(/data-video-id=\"[0-9]+/gm)[0].replace('data-video-id=\"',\"\")}"
    },
    PostsTwitter: {
        postWrapper: "ARTICLE",
        postAuthorName: "a[role=link] > div > div > div > span > span",
        postAuthor: "a[role=link] > div > div > div > span > span {parentElement.parentElement.parentElement.parentElement.parentElement.href}",
        postBody1: "DIV[lang][dir] SPAN",    // could be multiple matches on the same line
        postBody2: [    // multiple matches separated by newlines...
            "DIV[data-testid=\"card.layoutSmall.detail\"] SPAN > SPAN",
            "DIV[data-testid=\"card.layoutLarge.detail\"] SPAN > SPAN"
        ],
        postImages: [
            "DIV[data-testid=tweetPhoto] > IMG",
            "DIV[data-testid=\"card.layoutSmall.media\"] IMG",
            "DIV[data-testid=\"card.layoutLarge.media\"] IMG"
        ],
        postVideo: "DIV[data-testid=videoPlayer] VIDEO",
        postTwitterParseDate: "{innerHTML.match(/[0-9]+:[0-9]+ (PM|AM) · [^\n]* [0-9]+, 20[0-9][0-9]/g)[0].replace(' ·', '')}"
    },
    vCardsFacebook: {
        profileName: [
            "DIV.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.pfnyh3mw.taijpn5t.gs1a9yip.owycx6da.btwxx1t3.ihqw7lf3.cddn0xzi SPAN > H1.gmql0nx0.l94mrbxd.p1ri9a11.lzcic4wl.bp9cbjyn.j83agx80",
            "DIV.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.g5gj957u.d2edcug0.hpfvmrgz.on77hlbc.buofh1pr.o8rfisnq.ph5uu5jm.b3onmgus.ihqw7lf3.ecm0bbzt DIV.bi6gxh9e.aov4n071 > H2.gmql0nx0.l94mrbxd.p1ri9a11.lzcic4wl.d2edcug0.hpfvmrgz > SPAN",
            "DIV.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.pfnyh3mw.d2edcug0.bp9cbjyn.jb3vyjys DIV.bi6gxh9e.aov4n071 > SPAN  H1",
            'div[data-pagelet="ProfileActions"] {parentElement.parentElement}  h1',
            // Dominique pages:
            'DIV[role=main] DIV.bi6gxh9e.aov4n071 > H2 > SPAN > SPAN',
            // Dominique profiles:
            'DIV[role=main] SPAN > DIV > H1'
        ],
        linksA: "A.oajrlxb2.g5ia77u1.qu0x051f.esr5mh6w.e9989ue4.r7d6kgcz.rq0escxv.nhd2j8a9.nc684nl6.p7hjln8o.kvgmc6g5.cxmmr5t8.oygrvhab.hcukyx3x.jb3vyjys.rz4wbd8a.qt6c0cv9.a8nywdso.i1ao9s8h.esuyzwwr.f1sip0of.lzcic4wl.py34i1dx.gpro0wi8",	// DRL FIXIT? Remove after v 0.38
        links: "A.oajrlxb2.g5ia77u1.qu0x051f.esr5mh6w.e9989ue4.r7d6kgcz.rq0escxv.nhd2j8a9.nc684nl6.p7hjln8o.kvgmc6g5.cxmmr5t8.oygrvhab.hcukyx3x.jb3vyjys.rz4wbd8a.qt6c0cv9.a8nywdso.i1ao9s8h.esuyzwwr.f1sip0of.lzcic4wl.py34i1dx.gpro0wi8 {href}",
        // this matches on a bunch of things that aren't phones so we check for telephone formats, and then we add the "tel:" prefix
        phone: "DIV.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.g5gj957u.d2edcug0.hpfvmrgz.rj1gh0hx.buofh1pr.o8rfisnq.p8fzw8mz.pcp91wgn.iuny7tx3.ipjc6fyt > DIV.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg > DIV.qzhwtbm6.knvmm38d > SPAN.d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.oi732d6d.ik7dh3pa.a8c37x1j.keod5gw0.nxhoafnm.aigsh9s9.fe6kdd0r.mau55g9w.c8b282yb.iv3no6db.jq4qci2q.a3bd9o3v.oo9gr5id.hzawbc8m > SPAN.d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.oi732d6d.ik7dh3pa.jq4qci2q.a3bd9o3v.oo9gr5id {propMatch('innerText',/^(\\+\\d{1,3}( )?)?((\\(\\d{3}\\))|\\d{3})[- .]?\\d{3}[- .]?\\d{4}$/).innerText.replace(/([\\s\\S]*)/,'tel:$1')}",
        intro: "DIV.bi6gxh9e.aov4n071 > SPAN.d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.oi732d6d.ik7dh3pa.fgxwclzu.a8c37x1j.keod5gw0.nxhoafnm.aigsh9s9.d9wwppkn.fe6kdd0r.mau55g9w.c8b282yb.iv3no6db.a5q79mjw.g1cxx5fr.knj5qynh.m9osqain.oqcyycmt > SPAN",
        introItems: "DIV.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.pfnyh3mw.i1fnvgqd.gs1a9yip.owycx6da.btwxx1t3.hv4rvrfc.dati1w0a.discj3wi.b5q2rw42.lq239pai.mysgfdmx.hddg9phg DIV.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg > DIV.qzhwtbm6.knvmm38d > SPAN",
        // on some profiles (and pages?) there's a menu that comes up
        drodownMenuOpenImageButton: 'a[role="menuitem"] {propMatch("innerText", "View profile picture")}',
        checkIfShouldOpenProfilePictureBigScreenBtn: 'div[aria-label="Page profile photo"] svg circle',
        photoImageBtn: [
           'div[aria-label="Page profile photo"][role="button"] svg {parentBySelector("div[aria-label=\"Page profile photo\"]")}',
        ],
        bigImage: [
            'img[data-visualcompletion=media-vc-image]',    // when the image comes up directly
            'div[role=menu] a[href*="facebook.com/photo"]'  // when a menu comes up first it contains the URL we can get the image from
        ],
        normalProfilePictureHref: 'svg[role="img"]:not([aria-label="Your profile"]) image {getAttribute("xlink:href")}',    // remove after v1.24
        normalProfilePictureHref2: 'svg[role="img"] {!propMatch("aria-label", localizedKeywords.FacebookPosts.yourProfilePhoto)} image {getAttribute("xlink:href")}',
        closeImage: [
            'div[aria-label=Close]',
            'div[role=main] > div:nth-child(1) div[aria-label][role=button]'    // click almost anywhere I think to close menu
        ],
        photoImagePage: 'div[role=main] > div:nth-child(1) div[aria-label="Page profile photo"]',
        bigImagePage: [
           'div[role=menu] a[href*="facebook.com/photo"]',
           'div[data-pagelet="MediaViewerPhoto"] img[data-visualcompletion="media-vc-image"]'
        ],
        closeImagePage: ['div[role="banner"] div[aria-label="Close"]', 'div[role=main] > div:nth-child(1) div[aria-label="Page profile photo"]']    // click almost anywhere I think
    },
    vCardsInstagram: {
        profileName: [
            'DIV.-vDIg > H1.rhpdm',
            'DIV.QGPIr > span.qyrsm.se6yk',
        ],
        profileIntro: [
            'DIV.-vDIg > span',
            'DIV.QGPIr > DIV.MMzan.uL8Hv',
        ],
        photoImage: [
            'MAIN[role=main] IMG',
            'MAIN[role=main] IMG[data-testid=user-avatar]',
        ]
    },
    vCardsPinterest: {
        profileName: "DIV.gjz.hs0.un8.C9i > H1.lH1.dyH.iFc.ky3.pBj.tg7.IZT",
        profileWebsite: "DIV.zI7.iyn.Hsu > A.underlineLink",
        profileIntro: "DIV.zI7.iyn.Hsu > SPAN.tBJ.dyH.iFc.yTZ.pBj.DrD.IZT.swG",
        photoImage: "DIV.mainContainer IMG",
    },
    vCardsTikTok: {
        profileName: [
            "DIV.share-title-container > H1.share-sub-title",        // old??
            "DIV[data-e2e=user-page] H1[data-e2e=user-subtitle] {innerText.trim()}"
        ],
        profileIntro: [
            "HEADER.jsx-4037782421.share-layout-header.share-header > H2.share-desc.mt10",       // old??
            "DIV[data-e2e=user-page] H2[data-e2e=user-bio] {innerText.trim()}"
        ],
        websiteA: [
            "HEADER.jsx-4037782421.share-layout-header.share-header > DIV > A",      // old??
            "DIV[data-e2e=user-page] A[data-e2e=user-link] {href}"
        ],
        photoImage: [
            "DIV.image-wrap.user-page-header > SPAN.tiktok-avatar.tiktok-avatar-circle > IMG",   // old??
            "DIV[data-e2e=user-page] DIV[data-e2e=user-avatar] IMG {src}"
        ],
    },
    vCardsSalesNavigator: {
        profileName: "SPAN.profile-topcard-person-entity__name",
        profileTitle: "SPAN.profile-topcard__summary-position-title",
        profileCompany: "DIV.profile-topcard__summary-position > SPAN > A",
        profileAbout: "SPAN.profile-topcard__summary-content",
        profileAboutSeeMore: "BUTTON.profile-topcard__summary-expand-link",
        profileAboutClose: "BUTTON[data-test-modal-close-btn]",
        profileAboutPopUp: "DIV.profile-topcard__summary-modal-content",
        profileLocation: "DIV.profile-topcard__location-data",
        photoImage: "BUTTON[data-test-profile-topcard=\"photo-expand-button\"] > DIV > IMG",
        profileLinks: "A.profile-topcard__contact-info-item-link",
        profileMoreMenu: "DIV.profile-topcard-actions > DIV:nth-child(4) > BUTTON",
        profileCopyProfileLink: "DIV[data-control-name=\"copy_linkedin\"]",
    },
    vCardsTwitter: {
        profileName: [
            "DIV.css-1dbjc4n.r-6gpygo.r-14gqq1x > DIV.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > DIV.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > DIV.css-1dbjc4n.r-1awozwy.r-18u37iz.r-dnmrzs > DIV.css-901oao.r-18jsvk2.r-1qd0xha.r-1vr29t4.r-bcqeeo.r-qvutc0", // old
            "DIV.css-901oao.r-1awozwy.r-18jsvk2.r-6koalj.r-37j5jr.r-adyw6z.r-1vr29t4.r-135wba7.r-bcqeeo.r-1udh08x.r-qvutc0 > SPAN.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0 > SPAN.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0"
        ],
        profileIntro: "DIV[data-testid=UserDescription]",
        profileWebsite: "DIV[data-testid=UserProfileHeader_Items] > A.css-4rbku5.css-18t94o4.css-901oao.css-16my406.r-13gxpu9.r-1loqt21.r-4qtqp9.r-poiln3.r-zso239.r-bcqeeo.r-qvutc0",
        profileLocation: "DIV[data-testid=UserProfileHeader_Items] > SPAN.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0:nth-of-type(1)",
        profileBirthday: "DIV[data-testid=UserProfileHeader_Items] > SPAN.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0:nth-of-type(2)",
        photoImage: [
            "A[data-focusable=true] IMG[draggable=true].css-9pa8cd", // old
            "A[role=link] IMG[draggable=true].css-9pa8cd"
        ],
    },
    Accounts: {
        facebookSimpleAccountIdInput: 'input[name="tids"]', // remove after version 1.12
        facebookSimpleAccountId: [
            '{urlMatch(/mbasic\\.facebook\\.com/g)} input[name="tids"] {value.split(":")[1]}',
            // the user ID is in the Messages link URL
            '{urlMatch(/upload\\.facebook\\.com/g)} a[href*="mbasic.facebook.com/messages/"] {href.match(/tid=cid\\.c\\.([0-9]*)%3A/g)}',
        ],
        facebookAccountErrorMessage: "DIV.message *[data-sigil=\"error-message\"]",
        tiktokElemCheckLogin: [
            '#sigi-persisted-data {innerHTML.match(/uniqueId":".*?(",)/g)}',
            '__NEXT_DATA__',
            'div[data-e2e=profile-icon]',
            'div.avatar .tiktok-avatar'
        ],
        tiktokGetUid: "#sigi-persisted-data {innerHTML.match(/uid\":\".*?([0-9]+)/g).replace(\"uid\\\":\\\"\", \"\")}",
        tiktokGetUsername: '#sigi-persisted-data {innerHTML.match(/uniqueId":".*?(",)/g)}',
        twitterElemCheckLogin: 'script {innerHTML.match(/fetchStatus":".*?("},)/g)}',
        twitterGetUsername: 'script {innerHTML.match(/screen_name":".*?(",)/g)}',
        twitterGetId: 'script {innerHTML.match(/fetchStatus":{"\\d+/g)}',
        twitterGetIdReplace: 'fetchStatus":{"',
        pinterestElemCheckLogin: '#__PWS_DATA__ {innerHTML.match(/isAuthenticated":.*?(,)/g)}',
        pinterestElemCheckLoginNeedToInclude: 'true',
        pinterestGetUsername: '#HeaderContent div[data-test-id="button-container"] a {href.split("/")[3]}'
    }
};

localizedKeywords = {
    DateAndTime: {
        "UnitSingleChar" : {   // remove after v1.24
            "en" : { "m" : "m", "h" : "h", "d" : "d", "w" : "w", "y" : "y" }
        },
        "UnitStrings" : {
            // all is in the singular as we match it with the startWith method
            "en" : { "second": "second", "minute" : "minute", "hour" : "hour", "day" : "day", "week" : "week", "month": "month", "year" : "year" },
            "fr" : { "second": "seconde", "minute" : "minute", "hour" : "heure", "day" : "jour", "week" : "semaine", "month": "mois", "year" : "an" },
        },
        "MsgTime" : {
            "en" : {
                "sent"           : "sent",
                "RecentDateTime" : "(Today|Yesterday) at ",// this is a string regex
                "TodayAt"        : "Today at "
            },
            "fr": {
                "sent"           : "envoyé",
                "RecentDateTime" : "(Aujourd'hui|Hier) à ",
                "TodayAt"        : "Aujourd'hui à "
            }
        },
        "Yesterday": {
            "en": "Yesterday",
            "fr": "Hier"
        },
        "Suffix" : {
            "en" : {
                "AM"             : "AM",
                "PM"             : "PM",
            }
        },
        "DaysInWeek": {
            "en": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        },
        "DaysInWeek3": {
            "en": ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
            "fr": ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"]
        },
        "MonthName3": {
            "en": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            // "Aou" and after are not tested
            "fr": ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Déc"]
        },
        "MonthsInEnglish": {
            "en": {
                "jan": "January",
                "feb": "February",
                "mar": "March",
                "apr": "April",
                "may": "May",
                "jun": "June",
                "jul": "July",
                "aug": "August",
                "sep": "September",
                "oct": "October",
                "nov": "November",
                "dec": "December",
            },
            "fr": {
                "jan": "January",
                "fév": "February",
                "mar": "March",
                "avr": "April",
                "mai": "May",
                "jun": "June",
                "jul": "July",
                // untested...
                "aou": "August",
                "sep": "September",
                "oct": "October",
                "nov": "November",
                "déc": "December",
            }
        },
        "MsgHoursAndMinutes": {
            // match example: en: "11:29 AM", "8:01 PM" | fr: "11 h 29" | "9 h 24"
            "en": "([0-9]{1,2}):([0-9]{2}) ?([A-Z]+)?",
            "fr": "([0-9]{1,2}) ?h ?([0-9]{2})"
        },
        "MsgSameWeek": {
            // match example: en: "Mon 11:29 AM" | fr: "Lun. 11 h 19"
            "en": "^([a-z]{3})? ?([0-9]+):([0-9]+) ?([a-z]+)?$",
            "fr": "^([a-z]{3})?.? ?([0-9]+) ?h ?([0-9]+)$"
        },
        "MsgOldDate": {
            // match example: en: "01/02/03, 3:48 PM" | fr: 21-12-22 19 h 26
            "en": "([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{1,2}).{0,2}([0-9]{1,2}):([0-9]{1,2}) ?([A-Z]{2})?",
            "fr": "([0-9]{1,2})-([0-9]{1,2})-([0-9]{1,2}) ?([0-9]{1,2}) ?h ?([0-9]{1,2})"
        },
        "daysInWeekLowercase": {
            "en": ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            "fr": ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
        },
        "oneA": {
            "en": "a",
            "fr": "un"
        },
        "oneAn": {
            "en": "an",
            "fr": "une"
        },
        "UnitStringsPlurial" : {
            // all is in the singular as we match it with the startWith method
            "en" : { "second": "seconds", "minute" : "minutes", "hour" : "hours", "day" : "days", "week" : "weeks", "month": "months", "year" : "years" },
            "fr" : { "second": "secondes", "minute" : "minutes", "hour" : "heures", "day" : "jours", "week" : "semaines", "month": "mois", "year" : "ans" },
        },
        "frDate": {
            "fr": '([0-9]{1,2}) ?([A-zÀ-ú]+) ?([0-9]{4})'
        },
        "fullMonthsInEnglish": {
            "fr": {
                "janvier": "January",
                "février": "February",
                "mars": "March",
                "avril": "April",
                "mai": "May",
                "juin": "June",
                "juillet": "July",
                "août": "August",
                "septembre": "September",
                "octobre": "October",
                "novembre": "November",
                "décembre": "December",
            }
        }
    },
    InstagramMsgs: {
        "Today": {
            "en": "Today",
        },
        "Yesterday": {
            "en": "Yesterday",
        },
        "DaysInWeek": {
            "en": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        }
    },
    Facebook: {
        "Throttled" : {
            "en" : "Temporarily Blocked",
            "fr" : "Temporairement bloqué" // not sure about this selector
        },
    },
    FacebookMsgs: {
        "Today": {
            "en": "Today"
        },
        "Yesterday": {  // remove after v1.22
            "en": "Yesterday"
        },
        "DaysInWeek": { // remove after v1.22
            "en": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        },
        "MonthName": {  // remove after v1.22
            "en": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        },
        "SelfSent" : {
            "en" : "^You",   // "You sent", "You replied"
            "fr" : "^Vous"   // "Vous avez envoyé"
        },
        "ParticipantName" : {
            "en" : "^Conversation with (.+)$",
            "fr" : "^Conversation avec (.+)$"
        },
        "ChatParsingThrottled" : {
            "en" : "temporarily blocked",
        },
        "GroupName" : {
            "en" : "^Conversation titled(.+)$",
            "fr" : "^Nom de la conversation(.+)$"
        },
        "SendingStatus": {  // remove after v1.23
            "en" : ["Sending"]
        },
        "SentStatus": {     // remove after v1.23
            "en" : ["Delivered", "Sent"]
        },
        "MsgSending": {
            "en": "Sending"
        },
        "MsgSendSuccess": {
            "en": "Delivered|Sent"
        },
        "MsgSendFailure": {
            "en": "Couldn't send"
        },
        "BasicMsgSendPermanentFailure": {
            "en": "You can't share this link"
        },
        "ChatTime" : {  // remove after v1.22
            "en" : { "m" : "m", "h" : "h", "d" : "d", "w" : "w", "y" : "y" }
        },
        "MarkAsRead" : {
            "en" : "Mark as read"
        },
        "MsgTime" : {   // remove after v1.22
            "en" : {
                "sent"           : "sent",
                "AM"             : "AM",
                "PM"             : "PM",
                "recentDateTime" : "(Today|Yesterday) at ",// this is a string regex
                "today"          : "Today at "
            }
        },
        // these include the group membership roles too
        "MessageFromRoles" : {
            "en" : {
                "Author"        : "Author",
                "GroupAdmin"    : "Admin",
                "GroupModerator": "Moderator",
                "GroupExpert"   : "Group expert",
                "TopFan"        : "Top fan",
                "Subscriber"    : "Subscriber",
            },
            "fr" : {
                "Author"        : "Auteur",
                "GroupAdmin"    : "Administrateur",
                "GroupModerator": "Moderateur",
                "GroupExpert"   : "Expert du groupe",
                "TopFan"        : "Super fan",
                "Subscriber"    : "Supporter",
            },
        },
        "MarkAsRead": {
            "en": "Mark as read",
            "fr": "Marquer comme lu"
        },
        "chatMembers": {
            // lowercased before
            "en": "chat members",
            "fr": "membres de la discussion"
        }
    },
    PinterestScrape: {
        "s": {  // seconds
            "en": "s",
        },
        "m": {  // minutes
            "en": "m",
        },
        "h": {  // hours
            "en": "h",
        },
        "d": {  // days
            "en": "d",
        },
        "w": {  // weeks
            "en": "w",
        },
        "y": {  // years
            "en": "y",
        }
    },
    TwitterScrape: {
        "was sent": {
            "en": "was sent",
        },
        "Today": {
            "en": "Today",
        },
        "Yesterday": {
            "en": "Yesterday",
        },
        "DaysInWeek": {
            "en": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        }
    },
    FacebookPosts: {
        "Public": {
            "en": "Public",
            "fr": "Public"
        },
        "Embed" : {
            "en" : "Embed"
        },
        "MostRelevant" : {
            "en" : "Most relevant",
            "fr" : "Plus pertinents"
        },
        "allComments" : {
            "en" : "All comments",
            "fr": "Tous les commentaires"
        },
        "Newest" : {
            "en" : "Newest",
            "fr" : "Les plus récents"
        },
        // In my tests some posts have two "more" buttons, one at the top to see older comments/answers and another
        // at the bottom to see newer ones. We also have the "View 1 more reply" and "5 replies" type buttons
        // that open up the replies to a comment/answer. The selector we use must match all of these so that as we
        // iterate through this loop we eventually click them all.
        "viewMoreComments" : {
            "en" : "(more comment|previous comment|more answer|previous answer|more reply|more replies|1 Reply|\\d+ Replies)",
            "fr" : "(plus de commentaires|commentaires précédents|autres commentaires|réponses précédentes|réponse précédente|autre réponse|autres réponses|1 réponse|\\d+ réponses)"
        },
        "SeeMore" : {
            "en" : "See More",
            "fr" : "Voir Plus"
        },
        "Comments" : {
            "en" : "^(Comments|\\d+ Comments)$",
            "fr" : "^(commentaires|\\d+ commentaires)$"
        },
        "UnsavePostOrVideo": {
            "en" : "(Unsave post|Unsave video)",
            //add by fabien
            "fr" : "(Annuler l'enregistrement de la publication|Annuler l'enregistrement de la vidéo)"
        },
        "SavePostOrVideo": {
            "en" : "(Save post|Save video)",
            // test fabien
            "fr" : "(Sauvegarder la publication|Enregistrer la vidéo)"
        },
        "postActionsBoxBtnForCheckingAvailableScrapingMethod": {
            "en": "Actions for this post",
            // sometimes the first post of the feed as the property Actions for this post
            "fr": "(Actions pour cette publication|Actions for this post)"
        },
        "articleSave": {
            "en": "Done",
            "fr": "Terminer"
        },
        "postShareButton": {
            "en": "Send this to friends or post it on your timeline.",
            "fr": "Envoyez ceci à vos amis ou publiez-le sur votre journal."
        },
        "shareDialogCopyLinkButton": {
            "en": "Copy link",
            "fr": "Copier le lien"
        },
        "feedPostMbasic": {
            "en": "Post",
            "fr": "Publier"
        },
        "pagePostMbasic": {
            "en": "Post",
            "fr": "Publier"
        },
        "composer": {
            "en": "Profile",
            "fr": "Profil"
        },
        "publicAudience": {
            "en": "Public",
            "fr": "Public"
        },
        "openPostAttachmentInput": {
            "en": "Photo/Video",
            "fr": "Photo / vidéo"
        },
        "yourProfilePhoto": {
            "en": "Your profile"
        },
        "postUnavailable": {
            "en": "Go to News Feed",
            "fr": "Aller au fil d’actualité"
        },
        "postVideoPause": {
            "en": "Pause",
            "fr": "Suspendre"
        },
        "commentAuthorRoles": {
            "en": "[^(Follow)]",
            "fr": "[^(Ajouter)]"
        }
    },
    FacebookProfiles: {
        "FriendOrPendingFriend": {
            "en": ["Friends", "Cancel Request"],
        },
    },
    FacebookGroups: {
        "WriteYourAnswer": {
            "en": "Write your answer...",
            "fr": "Écrivez votre réponse..."
        },
        "NewToTheGroup": {
            "en": "New to the group",
            "fr": "dans le groupe"
        },
        "createdGroup": {
            "en": "Created group ",
            "fr": "Groupe créé "
        },
        "joined": { // remove after v1.26
             "en": 'Joined ',
             "fr": 'Membre depuis '
        },
	    "toSlice": { // remove after v1.26
             "en": ['about ', 'on '],
             "fr": ['il y a ']
        },
        "toRemove": {
            "en": ['Joined '],
            "fr": ['environ ', 'de ']
        },
        "weekDayPattern": {
            "en": "(monday)|(tuesday)|(wednesday)|(thursday)|(friday)|(saturday)|(sunday)",
            "fr": "(lundi)|(mardi)|(mercredi)|(jeudi)|(vendredi)|(samedi)|(dimanche)"
        },
        "needToConvert": {
            'en': '',
            'fr': 'à|le '
        },
        "toBeConvertible": {
            "en": "(about|on|group) (.*)",
            "fr": "(il y a|depuis|créé) (.*)"
        }
    },
    vCardsFacebook: {
        "Lives in": {
            "en": "Lives in",
        }
    }
};

constantStyles = {
    /* IMPORTANT! There is places where we append styles after the constantStyles, so constantStyles should always have an ';' in the end */
    Facebook: {
        /* DRL FIXIT! This is an example and not used!
           a multiline string requires slashes at the end and it won't have newlines in it unless you
           add them manually like the first line...
        dropdownMenuButton: "\n\
            display:block;\
            content:'';\
globalDropdownBtn            clear:both;\
            margin-bottom:5px;\
            ",*/
    },
    Pages: {
        TikTok: {
            postSidebarDropdownTriggerButton: "border: none;background: none;outline: none;padding: 0;position: relative;display: -webkit-box;display: -webkit-flex;display: -ms-flexbox;display: flex;-webkit-align-items: center;-webkit-box-align: center;-ms-flex-align: center;align-items: center;cursor: pointer;-webkit-flex-direction: column;-ms-flex-direction: column;flex-direction: column;background-color: #f1f1f2;padding: 12px;border-radius: 50px;",
            postSidebarDropdownTriggerButtonImg: "height: 25px; width: 25px;",
            tiktokMessagesInMessageListContactIconHtml: "margin-left: 7px;",
            globalDropdownBtn: "position:absolute; top:75px; right:10px; z-index:100;",
            globalDropdownBtnImg: "width:35px;height:35px;",
        },
        Messenger: {
            globalDropdownBtn: "position:fixed; top:150px; right:10px; z-index:100;",
            globalDropdownBtnImg: "width:35px;height:35px;",
        },
        Facebook: {
            facebookMessagesInMessageListContactIconHtml: "position: absolute;top: 5px; right:5px;",
            dropdownFilterContactsOnMessagesPage: "margin: 0px 3px 0px 10px;background-color: #F5F5F5;padding: 0px; border-radius: 50%;",
            dropdownFilterContactsOnMessagesPageImg: "width:23px;height:23px;padding:6px 6px 2px 6px",
            dropdownProfileActions: 'margin-left: 5px;margin-right: 5px;margin-top: 7px;background-color: #e4e6eb;padding: 0px;border-radius: 7px;',
            dropdownProfileActionsImg: 'width:23px;height:23px;padding:7px 7px 4px 7px',
            dropdownPersonCardActions: 'margin-left: 5px;margin-right: 5px;margin-top: 7px;background-color: #e4e6eb;padding: 0px;border-radius: 7px;',
            dropdownPersonCardActionsImg: 'width:23px;height:23px;padding:7px 7px 4px 7px',
            globalDropdownBtn: "position:fixed; top:150px; right:10px; z-index:100;",
            globalDropdownBtnImg: "width:35px;height:35px;",
            savedPostActionsDropdown: "background-color: #e4e6eb;padding: 7px;border-radius: 5px;"
        },
        Instagram: {
            massageInstagramDirectPageContactIconHtml: "position: absolute;top: 22px; right:30px;",
            globalDropdownBtn: "position:fixed; top:150px; right:10px; z-index:100;",
            globalDropdownBtnImg: "width:35px;height:35px;",
        },
        Pinterest: {
            conversationContactIconHtml: "position: absolute;top: 21px; right:50px;",
            dropdownButtonForPosts: "position: absolute; top:20px; left:10px;",
            globalDropdownBtn: "position:fixed; top:150px; right:0px; z-index:9999;",
            globalDropdownBtnImg: "width:35px;height:35px",
        },
        Twitter: {
            conversationOrProfilePagePastConversationContactIconHtml: "top: 30px; right: 0;",
            feedPostsDropdownMenu:'top: 13px; right: 25px; position: absolute;',
            globalDropdownBtn: "position:fixed; top:8px; right:0px; z-index:9999;",
            globalDropdownBtnImg: "width:35px;height:35px;",
        },
        Gmail: {
            globalDropdownBtn: "position:relative; z-index:100; margin-left:16px; margin-top:13px;",
            globalDropdownBtnImg: "width:25px;height:25px;",
        },
        Outlook: {
            globalDropdownBtn: "position:relative; z-index:100; margin-top:19px;",
            globalDropdownBtnImg: "width:33px;height:33px;",
        },
        defaultContactIconHtml: {
            img: "width: 18px; height: 18px;",
        }
    },
};

constantPaths = {
    Facebook: {
        // we add an "action" parameter here so the content scripts can differentiate
        sendMessengerMsg: "{{Origin}}/messages/t/{{ConversationID}}?action=send",
        basicSendMessengerMsg: "https://mbasic.facebook.com/messages/photo/?ids={{ConversationID}}&tids%5B0%5D=cid.c.{{ConversationID}}%3A{{AccountID}}&message_text&cancel=https%3A%2F%2Fmbasic.facebook.com%2Fmessages%2Fread%2F%3Ffbid%3D{{ConversationID}}%26request_type%3Dsend_success%26_rdr&_rdr",
        basicSendMessengerRoomMsg: "https://mbasic.facebook.com/messages/photo/?ids&tids%5B0%5D=cid.g.{{ConversationID}}&message_text&cancel=https%3A%2F%2Fmbasic.facebook.com%2Fmessages%2Fread%2F%3Ftid%3D{{ConversationID}}%26request_type%3Dsend_success%26_rdr&_rdr",
        watchedGroupRequests: "https://www.facebook.com/groups/{{groupId}}/member-requests",
        watchedGroupStaff: "https://www.facebook.com/groups/{{groupId}}/members/admins",
        watchedGroupMembers: "https://www.facebook.com/groups/{{groupId}}/members",
        watchedGroupMemberAnswers: "https://www.facebook.com/groups/{{groupId}}/user/{{userId}}",   // remove after version 1.18
        watchedGroupRequestAnswers: "https://www.facebook.com/groups/{{groupId}}/user/{{userId}}",
        watchedGroupQuestions: "https://www.facebook.com/groups/{{groupId}}/membership_questions",
        savedPostsPage: 'https://www.facebook.com/saved'
    },
};
