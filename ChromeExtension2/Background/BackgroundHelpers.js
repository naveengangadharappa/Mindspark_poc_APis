async function getFinalUrl(url) {
    return new Promise( (resolve, reject) => {
        fetch(url, {method: 'HEAD'})
            .then(response => {
                resolve(response.url);
            })
            .catch(error => {
                Log_WriteError("Error getting final url \"" + url + "\": " + error);
                resolve(url);
            });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}
