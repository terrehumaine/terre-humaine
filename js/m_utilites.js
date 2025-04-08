export function menuActiveToggle(){
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('active');
}    

export async function fetchJson(url, options = {}) {
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

export function getIssueData(folder){
    return fetchJson(`articles/${folder}/issue.json`);
}

export function getUrlParam(parameter) {
    const url = window.location.href;
    const urlObject = new URL(url);
    return urlObject.searchParams.get(parameter);
}

export function period2Long(period){
    const months = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const [yyyy, mm] = period.split('-');
    return `${months[mm*1]} ${yyyy}`;
}

