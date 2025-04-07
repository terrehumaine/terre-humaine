const dataStore = new Proxy({ currentIssue: {} }, {
    set(target, key, value) {
        switch (key) {
            // case 'currentIssue':
            //     issue2Page(value);
            //     break;
            case 'githubKey':
                window.localStorage.setItem("githubKey", value);
                break;
            default:
                break;
        }
        console.log({ target, key, value });
        if(target[`${key}_handler`]){
            const handler = target[`${key}_handler`];
            handler(value);
        }

        target[key] = value;
        return true;
    },
    get(target, key) {
        switch (key) {
            case 'githubKey':
                return window.localStorage.getItem("githubKey");
            default:
                return target[key];
        }
        
    }
});

export default dataStore;
export { dataStore };