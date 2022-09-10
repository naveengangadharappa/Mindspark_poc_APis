function srchPathPoIG(item) {
    return srchPath('PostsInstagram', item);
}

function srchPathPoPI(item) {
    return srchPath('PostsPinterest', item);
}

function srchPathPoTT(item) {
    return srchPath('PostsTikTok', item);
}

function srchPathPoTW(item) {
    return srchPath('PostsTwitter', item);
}

/*
async function blobToDataURL(blobUrl) {
    return new Promise( (resolve, reject) => {
    
    attempt 1
        var xhr = new XMLHttpRequest();
        xhr.open('GET', blobUrl, true);
        xhr.responseType = 'blob';
        xhr.onload = function(e) {
            if (this.status == 200) {
                resolve(this.response);
            }
        };
        xhr.send();
        
    attempt 2
        var fileReader = new FileReader();
        fileReader.onload = function(e) {
            resolve(e.target.result);
        };
        fileReader.readAsDataURL(blobUrl);
    })
    .catch(e => { Log_WriteException(e); throw e; });
}
*/

// postID, author, date (timestamp in GMT) are requied, "to" is the page, group or the null/author (for feed)
// returns object with post and an optional error message
async function createPostObject(type, postID, author, date, body, images, video, postUrl=null, to = null, dontWarnAboutAttachments = null) {
    assert(type != null);
    assert(postID != null);
    assert(author != null);
    assert(date != null);
    
    let from = author;
    if (to == null)
        to = [author];    // assume posting to his own wall
    else
        to = [to];
    
    let attachments = [];
    let buttons = [];
    
    // let's normalize the body a bit
    if (body == null) body = '';
    body = Utilities_ReplaceInString(body, '&nbsp;', ' ');
    body = body.trim();
    
    let name = '';
    if (body == null || body.length < 20)
        name = author + ' - ';
    if (body != null && body.length > 0)
        name += Utilities_ShortenWithEllipsis(body, 60 - name.length) + ' ';
    if (body == null || body.length < 20)
        name += '(' + DateAndTime_Now(0).ToFormat('%-D') + ') ';
    name = name.substr(0, name.length-1);   // remove trailing space

    // put the video first if there is one so it will show up as the default content
    if (video != null && video != '')
        attachments.push({'URL': video});
    
    for (let i = 0; i < images.length; i++)
        if (images[i] != null && images[i] != '')
            attachments.push({'URL': images[i]});
    
    // the server requires some body content
    if (body == null || body == '')
        body = author;
    
    let post = {
        Uid: postID ? postID : NO_EXTERNAL_ID,
        Type: type,
        Date: timestampToString(date),
        Folder: 'inbox',
        Url: postUrl,
        Name: name,
        From: from,
        To: to,
        Body: body,
        Attachments: attachments,
        Buttons: buttons,
        message: null
    };
    
    let removed = await massageAttachments(post);
    if (removed && dontWarnAboutAttachments !== true) {
        post.message = Str('The media for this post was not extracted. Upload anyway?');
    }
    
    return post;
}

async function getPostFromInstagram(elem) {
    let author = null;
    let body = '';
    let images = [];
    let video = null;
    
    let wrapper = Utilities_GetParentBySelector(elem, srchPathPoIG('postWrapper'));
    
    let temp = findElement(srchPathPoIG('postSeeMore'), null, wrapper);
    if (temp != null) {
        temp.click();
        await sleep(1);
    }
    
    temp = findElement(srchPathPoIG('postAuthor'), null, wrapper);
    if (temp != null)
        author = temp.innerText.trim();
    
    let temps = findElements(srchPathPoIG('postImages'), null, wrapper);
    for (let i = 0; i < temps.length; i++) {
        if (temps[i].alt != undefined) {
            if (body.length > 0)
                body += "\r\n";
            body += temps[i].alt;
        }
        images.push(temps[i].src);
    }
    
    temps = temps.concat(findElements(srchPathPoIG('postBody'), null, wrapper));
    for (let i = 0; i < temps.length; i++) {
        if (temps[i].innerText.trim() == '')
            continue;
        if (i > 0)
            body += "\r\n";
        else
            body = '';  // this will also remove the "alt" we added above as it's not needed if we have a "real" body
        body += temps[i].innerText.trim();
    }
    
    temp = findElement(srchPathPoIG('postVideo'), null, wrapper);
    if (temp != null) {
        video = temp.src;
        if (temp.poster)
            images.push(temp.poster);
    }
    
    if (author)
        author = author + '@igun.socialattache.com';

    let date = Date.now();
    temp = findElement(srchPathPoIG('postTimestamp'), null, wrapper)
    if(temp != null){
        date = new Date(temp)
    }

    // DRL FIXIT? What are these for?
    findElement(srchPathPoIG('postCommentButton'),'', wrapper).click()
    let dialog = await waitForElement(srchPathPoIG('postDialog'))

    let postId = window.location.href.split('/')[4]

    return createPostObject('ig_post', postId, author, date, body, images, video);
}

async function getPostFromPinterest(elem) {
    let author = null;
    let body = null;
    let images = [];
    let video = null;
    
    let wrapper = elem;
    
    let temp = findElement(srchPathPoPI('postAuthor'), null, wrapper);
    if (temp != null)
        author = temp.title;

    temp = findElement(srchPathPoPI('postImage'), null, wrapper);
    if (temp != null) {
        body = temp.alt;
        images.push(temp.src);
    }
    
    temp = findElement(srchPathPoPI('postBody'), null, wrapper);
    if (temp != null)
        body = temp.innerText.trim();
    
    temp = findElement(srchPathPoPI('postVideo'), null, wrapper);
    if (temp != null) {
        video = temp.src;
        if (temp.poster)
            images.push(temp.poster);
    }
    
    if (author){
        author = author + '@pintun.socialattache.com';
    }else{
        author = 'unknown@pintun.socialattache.com';
    }

    let postId = window.location.href.split('/')[4]

    let date = Date.now();// DRL FIXIT? Can we get this?

    return createPostObject('pint_post', postId, author, date, body, images, video);
}

async function getPostFromTikTok(elem) {
    let author = null;
    let body = null;
    let images = [];
    let video = null;
    
    let wrapper = Utilities_GetParentBySelector(elem, srchPathPoTT('postWrapper'));
    
    let temp = findElement(srchPathPoTT('postAuthor'), null, wrapper);
    if (temp != null)
        author = temp.innerText.trim();
    
    temp = findElement(srchPathPoTT('postBody'), null, wrapper);
    if (temp != null)
        body = temp.innerText.trim();
    
    temp = findElement(srchPathPoTT('postImage'), null, wrapper);
    if (temp != null)
        images.push(temp.style.backgroundImage.slice(4, -1).replace(/["']/g, ""));
    
    temp = findElement(srchPathPoTT('postVideo'), null, wrapper);
    if (temp != null)
        video = temp.src;
    
    if (author)
        author = author + '@ttun.socialattache.com';

    // Getting the post ID
    let btnSharePost = findElement(srchPathPoTT('postBtnShare'), null, elem)
    Utilities_TriggerMouseEvent(btnSharePost, 'mouseover')
    let embedBtn = await waitForElement(srchPathPoTT('postBtnEmbed'))
    embedBtn.click()
    let postId = await waitForElement(srchPathPoTT('postIdGetter'))

    let date = Date.now(); // DRL FIXIT? To get this we can instead of parse from the feed, open a new tab with the post url, and parse from there

    return createPostObject('tt_post', postId, author, date, body, images, video);
}

async function getPostFromTwitter(elem) {
    let authorName = null;
    let authorUid = null;
    let body = null;
    let images = [];
    let video = null;
    
    let wrapper = Utilities_GetParentBySelector(elem, srchPathPoTW('postWrapper'));
    
    let temp = findElement(srchPathPoTW('postAuthorName'), null, wrapper);
    if (temp != null){
        authorUid = findElement(srchPathPoTW('postAuthor'), null, wrapper).split('/')[3];
        authorName = temp.innerText.trim();
    }

    // the first body section is all on one line
    let temps = findElements(srchPathPoTW('postBody1'), null, wrapper);
    for (let i = 0; i < temps.length; i++) {
        if (body == null)
            body = '';
        body += temps[i].innerText.trim();
    }
    
    // the following body sections need to be split across lines
    temps = Array.prototype.slice.call(findElements(srchPathPoTW('postBody2'), null, wrapper));
    for (let i = 0; i < temps.length; i++) {
        if (body)
            body += "\r\n";
        else
            body = '';
        body += temps[i].innerText.trim();
    }
    
    // DRL FIXIT? We should use the array capability in the paths feature to reduce this to a single call
    // so in future we can update it as needed.
    temps = Array.prototype.slice.call(findElements(srchPathPoTW('postImages'), null, wrapper));
    for (let i = 0; i < temps.length; i++) {
        images.push(temps[i].src);
    }
    
    temp = findElement(srchPathPoTW('postVideo'), null, wrapper);
    if (temp != null) {
        video = temp.src;
        if (temp.poster)
            images.push(temp.poster);
    }
    
    // it looks like Twitter can provide the image in different sizes so let's ask for the large version
    for (let i = 0; i < images.length; i++) {
        if (images[i].indexOf('name=') > 0)
            images[i] = Url_SetParam(images[i], 'name', 'large');
    }
    let author = null
    if (authorUid && authorName)
        author = authorName+" <"+authorUid.toLowerCase() + '@twitun.socialattache.com>';

    let postId = window.location.href.split("/")[5]

    // FIXIT - As long the super selector returns a valid string for the new Date() this will keep working.
    //The date in this occasion is: 2:06 PM · Jan 7, 2022
    let date = findElement(srchPathPoTW('postTwitterParseDate'), null, elem)
    if(date == null){
        date = Date.now();
    }else{
        date = new Date(date)
    }

    return createPostObject('twit_post', postId, author, date, body, images, video);
}
