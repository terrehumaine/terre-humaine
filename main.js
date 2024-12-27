async function fetchJson(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching JSON:', error);
      throw error;
    }
};

function getIssueData(folder){
    return fetchJson(`articles/${folder}/issue.json`);
}

function getUrlParam(parameter) {
    const url = window.location.href;
    const urlObject = new URL(url);
    return urlObject.searchParams.get(parameter);
}
  


const dataStore = {};

const urlPeriod = getUrlParam('period');

(new Promise((resolve, refect)=>{
    if(urlPeriod){
        resolve(urlPeriod);
        return ;
    }

    // receiving last issue
    fetchJson('current.json')
        .then(data=>{
            dataStore.currentNumber = data.numero;
            dataStore.currentFolder = data.period;
            resolve(data.period);
        });
}))
    .then(getIssueData)
    .then(data=>{
        dataStore.currentIssue = data;
    })


document.addEventListener('DOMContentLoaded', function() {

});
